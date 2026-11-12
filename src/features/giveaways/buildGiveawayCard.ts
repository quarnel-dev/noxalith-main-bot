import { ActionRow, Button, ButtonStyle, Container, MessageFlags, TextDisplay } from 'seyfert'

import type { GiveawayRequirement } from '#repositories/giveawayRepository'

import { getGiveawayRule } from './giveawayRequirements.ts'

export const GIVEAWAY_JOIN_ID = 'giveaway:join'

export function buildGiveawayCard(prize: string, endsAt: Date, requirements: GiveawayRequirement[], disabled: boolean) {
  const timestamp = Math.floor(endsAt.getTime() / 1_000)
  const lines = [
    '### Розыгрыш',
    `**Приз:** ${prize}`,
    `**Окончание:** <t:${timestamp}:F> (<t:${timestamp}:R>)`,
    ...requirements.map((requirement) => {
      const label = getGiveawayRule(requirement)?.label ?? 'Условие недоступно'
      return `**Условие:** ${label}`
    }),
  ]

  return {
    flags: MessageFlags.IsComponentsV2,
    allowed_mentions: { parse: [] },
    components: [
      new Container().addComponents(
        new TextDisplay().setContent(lines.join('\n')),
        new ActionRow<Button>().setComponents([
          new Button().setCustomId(GIVEAWAY_JOIN_ID).setLabel('Участвовать').setStyle(ButtonStyle.Primary).setDisabled(disabled),
        ])
      ),
    ],
  }
}
