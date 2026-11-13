import { ComponentCommand, type ComponentContext } from 'seyfert'

import { GIVEAWAY_JOIN_ID } from '#features/giveaways/buildGiveawayCard'
import { getGiveawayRule } from '#features/giveaways/giveawayRequirements'
import { addGiveawayParticipant, findGiveaway } from '#repositories/giveawayRepository'

const joinMessages = {
  joined: 'Ты участвуешь в розыгрыше',
  alreadyJoined: 'Ты уже участвуешь в розыгрыше',
  closed: 'Приём заявок завершён',
} as const

export default class GiveawayJoinComponent extends ComponentCommand {
  componentType = 'Button' as const

  filter(ctx: ComponentContext<typeof this.componentType>) {
    return ctx.customId === GIVEAWAY_JOIN_ID
  }

  async run(ctx: ComponentContext<typeof this.componentType>) {
    await ctx.deferReply(true)

    const giveaway = await findGiveaway(ctx.message.id)

    if (!giveaway || giveaway.guildId !== ctx.guildId) {
      await ctx.editOrReply({ content: 'Розыгрыш не найден' })
      return
    }

    if (giveaway.status !== 'open' || giveaway.endsAt.getTime() <= Date.now()) {
      await ctx.editOrReply({ content: joinMessages.closed })
      return
    }

    for (const requirementId of giveaway.requirements) {
      const rule = getGiveawayRule(requirementId)

      if (!rule) {
        await ctx.editOrReply({ content: 'Условие этого розыгрыша недоступно' })
        return
      }

      const rejection = await rule.check(ctx)
      if (rejection !== null) {
        await ctx.editOrReply({ content: rejection })
        return
      }
    }

    const result = await addGiveawayParticipant(giveaway._id, ctx.author.id)
    await ctx.editOrReply({ content: joinMessages[result] })
  }
}
