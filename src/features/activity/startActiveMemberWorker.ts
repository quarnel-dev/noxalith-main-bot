import { SeyfertError, type UsingClient } from 'seyfert'

import { dsConfig } from '#config/ds.config'

import { findActiveUsers } from '#repositories/activityRepository'
import {
  clearActiveMemberUntil,
  findMember,
  findMembersWithExpiredActiveRole,
  setActiveMemberUntil,
} from '#repositories/membersRepository'
import { getLastProcessedActivityDay, setLastProcessedActivityDay } from '#repositories/activityWorkerRepository'

import { getActivityDay, previousActivityDay } from './activityDay.ts'

const DAY_MS = dsConfig.activity.dayMs
const CHECK_INTERVAL_MS = dsConfig.activity.checkIntervalMs

function nextDay(day: string): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) + DAY_MS).toISOString().slice(0, 10)
}

function evaluationTime(day: string): Date {
  return new Date(Date.parse(`${day}T00:00:00Z`) + DAY_MS - 3 * 3_600_000)
}

function memberLeftServer(error: unknown): boolean {
  return error instanceof SeyfertError && (error.code.endsWith('_10007') || error.code.endsWith('_10013'))
}

export function startActiveMemberWorker(client: UsingClient): void {
  async function tick(): Promise<void> {
    try {
      const today = getActivityDay()
      const lastProcessed = await getLastProcessedActivityDay()
      let day = lastProcessed ? nextDay(lastProcessed) : previousActivityDay(today)

      if (day < today) {
        const guild = await client.guilds.fetch(dsConfig.guildId)

        while (day < today) {
          const evaluatedAt = evaluationTime(day)
          const eligible = new Set(await findActiveUsers(day, dsConfig.activity.dailyTokenThreshold))

          for (const member of await findMembersWithExpiredActiveRole(evaluatedAt)) {
            if (eligible.has(member._id)) {
              try {
                await guild.members.addRole(member._id, dsConfig.activeMemberRoleId)
                await setActiveMemberUntil(
                  member._id,
                  new Date(evaluatedAt.getTime() + dsConfig.activity.roleDurationDays * DAY_MS)
                )
              } catch (error) {
                if (!memberLeftServer(error)) throw error
                await clearActiveMemberUntil(member._id)
              }

              eligible.delete(member._id)
              continue
            }

            try {
              await guild.members.removeRole(member._id, dsConfig.activeMemberRoleId)
            } catch (error) {
              if (!memberLeftServer(error)) throw error
            }

            await clearActiveMemberUntil(member._id)
          }

          for (const userId of eligible) {
            const member = await findMember(userId)
            if (member?.activeMemberUntil && member.activeMemberUntil > evaluatedAt) {
              continue
            }

            try {
              await guild.members.addRole(userId, dsConfig.activeMemberRoleId)
            } catch (error) {
              if (memberLeftServer(error)) continue
              throw error
            }

            await setActiveMemberUntil(userId, new Date(evaluatedAt.getTime() + dsConfig.activity.roleDurationDays * DAY_MS))
          }

          await setLastProcessedActivityDay(day)
          client.logger.info(`[activity] Обработан день ${day}`)
          day = nextDay(day)
        }
      }
    } catch (error) {
      client.logger.error('Не удалось обновить роли активных участников', error)
    } finally {
      setTimeout(() => void tick(), CHECK_INTERVAL_MS).unref()
    }
  }

  void tick()
}
