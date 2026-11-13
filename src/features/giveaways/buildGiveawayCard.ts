import { ActionRow, Button, ButtonStyle, Container, MessageFlags, TextDisplay } from 'seyfert'

import type { GiveawayRequirement } from '#repositories/giveawayRepository'

import { getGiveawayRule } from './giveawayRequirements.ts'
import { getGiveawayPrize } from './giveawayPrizes.ts'
import { customPrize } from './prizes/custom.ts'

export const GIVEAWAY_JOIN_ID = 'giveaway:join'
export const GIVEAWAY_REROLL_PREFIX = 'giveaway:reroll:'

type GiveawayCardData = {
  prize?: string
  prizeId?: string
  prizeText?: string
  endsAt: Date
  requirements: GiveawayRequirement[]
}

export function buildGiveawayCard(giveaway: GiveawayCardData, disabled: boolean, reroll?: { round: number; available: boolean }) {
  const { prize, prizeId, prizeText, endsAt, requirements } = giveaway
  const template = (prizeId ? getGiveawayPrize(prizeId) : undefined) ?? customPrize
  const card = new Container()

  template.render(card, prizeText ?? prize ?? 'Приз розыгрыша')

  const timestamp = Math.floor(endsAt.getTime() / 1_000)
  const lines = [
    `**Окончание:** <t:${timestamp}:F> (<t:${timestamp}:R>)`,
    ...requirements.map((id) => {
      const label = getGiveawayRule(id)?.label ?? 'Условие недоступно'
      return `**Условие:** ${label}`
    }),
  ]

  card.addComponents(
    new TextDisplay().setContent(lines.join('\n')),
    new ActionRow<Button>().setComponents([
      reroll
        ? new Button()
            .setCustomId(`${GIVEAWAY_REROLL_PREFIX}${reroll.round}`)
            .setLabel('Перевыбрать')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(!reroll.available)
        : new Button().setCustomId(GIVEAWAY_JOIN_ID).setLabel('Участвовать').setStyle(ButtonStyle.Primary).setDisabled(disabled),
    ])
  )

  return {
    flags: MessageFlags.IsComponentsV2,
    allowed_mentions: { parse: [] },
    components: [card],
  }
}
