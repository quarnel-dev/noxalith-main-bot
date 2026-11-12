import { Command, Declare, type CommandContext, AttachmentBuilder, createUserOption, Options } from 'seyfert'

import { getLevelProgress } from '#features/levels/getLevelProgress'
import { findMember } from '#repositories/membersRepository'
import { renderHtmlToPng } from '#core/render/renderHtmlToPng'
import { buildProfileHtml } from '../ui/profile/buildProfileHtml.ts'

const options = {
  member: createUserOption({
    description: 'Чей профиль показать',
    required: false,
  }),
}

@Declare({
  name: 'profile',
  description: 'Показывает твой профиль на сервере',
})
@Options(options)
export default class ProfileCommand extends Command {
  async run(ctx: CommandContext<typeof options>) {
    await ctx.deferReply(true)

    try {
      const target = ctx.options.member ?? ctx.member ?? ctx.author
      const member = await findMember(target.id)
      const { level, progress } = getLevelProgress(member?.levels?.totalXp ?? 0)

      const nickname = 'nick' in target ? target.nick : null
      const joinedTimestamp = 'joinedTimestamp' in target ? target.joinedTimestamp : undefined

      const html = buildProfileHtml({
        displayName: nickname ?? target.globalName ?? target.username,
        avatarUrl: target.avatarURL(),
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
