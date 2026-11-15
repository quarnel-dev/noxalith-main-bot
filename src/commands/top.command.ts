import { readFile } from 'node:fs/promises'

import { AttachmentBuilder, Command, Declare } from 'seyfert'
import type { CommandContext, Guild } from 'seyfert'

import { renderHtmlToPng } from '#core/render/renderHtmlToPng'
import { getLevelProgress } from '#features/levels/getLevelProgress'
import { findMember, findMemberXpRank, findTopMembers } from '#repositories/membersRepository'
import type { MemberDocument } from '#repositories/membersRepository'

import { buildLeaderboardHtml, type LeaderboardEntry } from '../ui/leaderboard/buildLeaderboardHtml.ts'

const fallbackAvatarPath = new URL('../../assets/leaderboard/icon_discord.svg', import.meta.url)

async function toEntry(guild: Guild, member: MemberDocument, rank: number, fallbackAvatarUrl: string): Promise<LeaderboardEntry> {
  const userId = member._id
  const totalXp = member.levels?.totalXp ?? 0
  const level = getLevelProgress(totalXp).level

  try {
    const discordMember = await guild.members.fetch(userId)

    return {
      userId,
      rank,
      displayName: discordMember.nick ?? discordMember.globalName ?? discordMember.username,
      avatarUrl: discordMember.avatarURL() ?? fallbackAvatarUrl,
      level,
      totalXp,
    }
  } catch {
    return {
      userId,
      rank,
      displayName: `Участник ${userId.slice(-4)}`,
      avatarUrl: fallbackAvatarUrl,
      level,
      totalXp,
    }
  }
}

@Declare({
  name: 'top',
  description: 'Показывает рейтинг участников по XP',
})
export default class TopCommand extends Command {
  async run(ctx: CommandContext) {
    await ctx.deferReply(true)

    try {
      if (!ctx.guildId) {
        await ctx.editResponse({ content: 'Рейтинг доступен только на сервере' })
        return
      }

      const [guild, members, viewerMember, fallbackAvatar] = await Promise.all([
        ctx.client.guilds.fetch(ctx.guildId),
        findTopMembers(10),
        findMember(ctx.author.id),
        readFile(fallbackAvatarPath),
      ])

      const fallbackAvatarUrl = `data:image/svg+xml;base64,${fallbackAvatar.toString('base64')}`

      const top = await Promise.all(members.map((member, index) => toEntry(guild, member, index + 1, fallbackAvatarUrl)))

      let viewer: LeaderboardEntry | null = null

      if (viewerMember && (viewerMember.levels?.totalXp ?? 0) > 0) {
        const topEntry = top.find((entry) => entry.userId === ctx.author.id)

        if (topEntry) {
          viewer = topEntry
        } else {
          const rank = await findMemberXpRank(ctx.author.id)

          if (rank !== null) {
            viewer = await toEntry(guild, viewerMember, rank, fallbackAvatarUrl)
          }
        }
      }

      const html = buildLeaderboardHtml({ top, viewer })
      const png = await renderHtmlToPng(html, '#leaderboard-card')
      const attachment = new AttachmentBuilder().setName('leaderboard.png').setFile('buffer', png)

      await ctx.editResponse({ files: [attachment] })
    } catch (error) {
      ctx.client.logger.error('Не удалось сформировать рейтинг', error)
      await ctx.editResponse({ content: 'Не удалось загрузить рейтинг' })
    }
  }
}
