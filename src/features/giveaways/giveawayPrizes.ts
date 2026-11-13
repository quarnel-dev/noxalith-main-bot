import type { Container } from 'seyfert'

import { customPrize } from './prizes/custom.ts'
import { nitroPrize } from './prizes/nitro.ts'

export interface GiveawayPrize {
  id: string
  label: string
  requiresText?: boolean
  prizeName?: string
  attachment?: { name: string; path: URL }
  render(card: Container, text: string): void
}

const prizes: readonly GiveawayPrize[] = [nitroPrize, customPrize]

export const giveawayPrizeChoices = prizes.map(({ id, label }) => ({
  name: label,
  value: id,
}))

export function getGiveawayPrize(id: string): GiveawayPrize | undefined {
  return prizes.find((prize) => prize.id === id)
}
