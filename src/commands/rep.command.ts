import { Command, Container, Declare, MessageFlags, Options, TextDisplay, createUserOption } from 'seyfert'
import type { CommandContext } from 'seyfert'

import { giveReputation } from '#repositories/reputationRepository'

const options = {
  member: createUserOption({
    description: 'Кому дать +1 к репутации',
    required: true,
  }),
}

function repResponse(title: string, description: string, color: number) {
  return {
    flags: MessageFlags.IsComponentsV2,
    allowed_mentions: { parse: [] },
    components: [new Container().setColor(color).addComponents(new TextDisplay().setContent(`### ${title}\n${description}`))],
  }
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
      await ctx.editResponse(repResponse('Репутация недоступна', 'Себе и ботам репутацию выдать нельзя', 0x747f8d))
      return
    }

    let given: boolean

    try {
      given = await giveReputation(ctx.author.id, target.id)
    } catch (error) {
      ctx.client.logger.error('Не удалось выдать репутацию', error)
      await ctx.editResponse(repResponse('Не удалось выдать репутацию', 'Попробуй чуть позже', 0xda6c74))
      return
    }

    await ctx.editResponse(
      given
        ? repResponse('Репутация выдана', `<@${target.id}> получил **+1** к репутации`, 0x57a880)
        : repResponse('Плюс уже выдан', `Для <@${target.id}> ещё действует кулдаун`, 0xc49a55)
    )
  }
}
