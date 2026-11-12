import { Command, Declare, type CommandContext, AttachmentBuilder } from 'seyfert'

import { getLevelProgress } from '#features/levels/getLevelProgress'
import { findMember } from '#repositories/membersRepository'
import { renderHtmlToPng } from '#core/render/renderHtmlToPng'
import { buildProfileHtml } from '../ui/profile/buildProfileHtml.ts'

@Declare({
  name: 'profile',
  description: 'Показывает твой профиль на сервере',
})
export default class ProfileCommand extends Command {
  async run(ctx: CommandContext) {
    await ctx.deferReply(true)

    try {
      const member = await findMember(ctx.author.id)
      const { level, progress } = getLevelProgress(member?.levels?.totalXp ?? 0)
      const joinedTimestamp = ctx.member?.joinedTimestamp

      const html = buildProfileHtml({
        displayName: ctx.member?.nick ?? ctx.author.globalName ?? ctx.author.username,
        avatarUrl: ctx.member?.avatarURL() ?? ctx.author.avatarURL(),
        joinedAt: joinedTimestamp == null ? null : new Date(joinedTimestamp),
        level,
        reputation: 0,
        progress,
      })

      const png = await renderHtmlToPng(html, '#profile-card')
      const attachment = new AttachmentBuilder().setName('profile.png').setFile('buffer', png)

      await ctx.editResponse({ files: [attachment] })
    } catch (error) {
      ctx.client.logger.error('Не удалось сформировать профиль', error)
      await ctx.editResponse({ content: 'Не удалось загрузить профиль.' })
    }
  }
}
