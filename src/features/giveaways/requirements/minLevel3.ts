import { getLevelProgress } from '#features/levels/getLevelProgress'
import { findMember } from '#repositories/membersRepository'
import type { GiveawayRule } from '../giveawayRequirements.ts'

const minLevel = 3

export const minLevel3 = {
  id: 'min_level_3',
  label: `Минимальный уровень ${minLevel}`,

  async check(ctx) {
    const member = await findMember(ctx.author.id)
    const { level } = getLevelProgress(member?.levels?.totalXp ?? 0)

    return level < minLevel ? `Для участия нужен уровень **${minLevel}**. Сейчас у тебя **${level}**` : null
  },
} satisfies GiveawayRule
