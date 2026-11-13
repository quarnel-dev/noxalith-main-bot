import { TextDisplay } from 'seyfert'

import type { GiveawayPrize } from '../giveawayPrizes.ts'

export const customPrize = {
  id: 'custom',
  label: 'Свой приз',
  requiresText: true,

  render(card, text) {
    card.addComponents(new TextDisplay().setContent(`### Розыгрыш\n**Приз:** ${text}`))
  },
} satisfies GiveawayPrize
