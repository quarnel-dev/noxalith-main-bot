import type { ComponentContext } from 'seyfert'

import type { GiveawayRequirement } from '#repositories/giveawayRepository'
import { minLevel3 } from './requirements/minLevel3.ts'

export interface GiveawayRule {
  id: string
  label: string
  check(ctx: ComponentContext<'Button'>): string | null | Promise<string | null>
}

const rules: readonly GiveawayRule[] = [minLevel3]

export const giveawayRequirementChoices = rules.map((rule) => ({
  name: rule.label,
  value: rule.id,
}))

export function getGiveawayRule(requirement: GiveawayRequirement): GiveawayRule | undefined {
  return rules.find((rule) => rule.id === requirement)
}
