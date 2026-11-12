import { Command, Declare, Options, createUserOption } from 'seyfert'
import type { CommandContext } from 'seyfert'

import { giveReputation } from '#repositories/reputationRepository'

const options = {
  member: createUserOption({
    description: 'Кому дать +1 к репутации',
    required: true,
  }),
}

@Declare({
  name: 'rep',
  description: 'Дать участнику +1 к репутации',
})
@Options(options)
export default class RepCommand extends Command {
  async run(ctx: CommandContext<typeof options>) {
    await ctx.deferReply(true)

    const target = ctx.options.member

    if (target.id === ctx.author.id || target.bot) {
      await ctx.editResponse({ content: 'Себе и ботам репутацию выдать нельзя.' })
      return
    }

    try {
      const given = await giveReputation(ctx.author.id, target.id)

      await ctx.editResponse({
        content: given ? 'Участник получил +1 к репутации.' : 'Для этого участника ещё действует кулдаун.',
      })
    } catch (error) {
      ctx.client.logger.error('Не удалось выдать репутацию', error)
      await ctx.editResponse({ content: 'Не удалось выдать репутацию. Попробуй позже.' })
    }
  }
}
