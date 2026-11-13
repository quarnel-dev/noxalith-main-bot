import { ComponentCommand, type ComponentContext } from 'seyfert'

import { GIVEAWAY_REROLL_PREFIX } from '#features/giveaways/buildGiveawayCard'
import { drawGiveawayWinner, findGiveaway } from '#repositories/giveawayRepository'

export default class GiveawayRerollComponent extends ComponentCommand {
  componentType = 'Button' as const

  filter(ctx: ComponentContext<typeof this.componentType>) {
    return ctx.customId.startsWith(GIVEAWAY_REROLL_PREFIX)
  }

  async run(ctx: ComponentContext<typeof this.componentType>) {
    await ctx.deferReply(true)

    if (!ctx.member?.permissions.strictHas('Administrator')) {
      await ctx.editOrReply({ content: 'Перевыбрать победителя может только администратор' })
      return
    }

    const giveaway = await findGiveaway(ctx.message.id)

    if (!giveaway || giveaway.guildId !== ctx.guildId || giveaway.status !== 'closed') {
      await ctx.editOrReply({ content: 'Завершённый розыгрыш не найден' })
      return
    }

    if (giveaway.resultPending || ctx.customId !== `${GIVEAWAY_REROLL_PREFIX}${giveaway.winnerIds.length}`) {
      await ctx.editOrReply({ content: 'Результат обновляется. Используй кнопку на обновлённой карточке' })
      return
    }

    if (giveaway.participantIds.every((id) => giveaway.winnerIds.includes(id))) {
      await ctx.editOrReply({ content: 'Кандидаты для перевыбора закончились' })
      return
    }

    const drawn = await drawGiveawayWinner(giveaway, 'reroll')
    await ctx.editOrReply({
      content: drawn ? 'Новый победитель выбран. Бот опубликует результат' : 'Результат уже изменился',
    })
  }
}
