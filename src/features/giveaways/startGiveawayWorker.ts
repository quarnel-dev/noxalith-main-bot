import { createHash } from 'node:crypto'

import type { UsingClient } from 'seyfert'

import {
  drawGiveawayWinner,
  findGiveaway,
  findGiveawaysToFinish,
  markGiveawayResultPublished,
} from '#repositories/giveawayRepository'

import { buildGiveawayCard } from './buildGiveawayCard.ts'
import { getGiveawayPrize } from './giveawayPrizes.ts'

export function startGiveawayWorker(client: UsingClient, guildId: string): void {
  async function tick(): Promise<void> {
    try {
      const giveaways = await findGiveawaysToFinish(guildId)

      for (const pending of giveaways) {
        try {
          if (pending.status === 'open' && !(await drawGiveawayWinner(pending, 'finish'))) {
            continue
          }

          const giveaway = await findGiveaway(pending._id)
          if (!giveaway?.resultPending) continue

          const winnerId = giveaway.winnerIds.at(-1)
          const round = giveaway.winnerIds.length
          const card = buildGiveawayCard(giveaway, true, {
            round,
            available: giveaway.participantIds.some((id) => !giveaway.winnerIds.includes(id)),
          })

          await client.messages.edit(giveaway._id, giveaway.channelId, card)

          const template = giveaway.prizeId ? getGiveawayPrize(giveaway.prizeId) : undefined
          const prize = template?.prizeName || giveaway.prizeText || giveaway.prize || template?.label || 'приз розыгрыша'
          const deadline = Math.floor((Date.now() + 86_400_000) / 1_000)
          const organizer = giveaway.organizerId ? `<@${giveaway.organizerId}>` : 'организатору'
          const nonce = createHash('sha256').update(`${giveaway._id}:${round}`).digest('hex').slice(0, 25)

          const content = winnerId
            ? [
                round > 1 ? `🎉 Поздравляем нового победителя <@${winnerId}>!` : `🎉 <@${winnerId}>, поздравляем с победой!`,
                `**Приз:** ${prize}`,
                `Напиши ${organizer} в ЛС до <t:${deadline}:F>, чтобы забрать приз`,
              ].join('\n')
            : 'Розыгрыш завершён без участников'

          await client.messages.write(giveaway.channelId, {
            content,
            allowed_mentions: { parse: [], users: winnerId ? [winnerId] : [] },
            nonce,
            enforce_nonce: true,
          })

          await markGiveawayResultPublished(giveaway)
        } catch (error) {
          client.logger.error(`Не удалось опубликовать итог розыгрыша ${pending._id}`, error)
        }
      }
    } catch (error) {
      client.logger.error('Не удалось проверить завершённые розыгрыши', error)
    } finally {
      setTimeout(() => void tick(), 5_000).unref()
    }
  }

  void tick()
}
