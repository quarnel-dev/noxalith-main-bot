import { dsConfig } from '#config/ds.config'

export function getLevelProgress(totalXp: number) {
  if (!Number.isSafeInteger(totalXp) || totalXp < 0) {
    throw new RangeError('totalXp must be a non-negative safe integer')
  }

  const { initialGrowthBonus, growthDecay, firstLevelXp } = dsConfig.levels

  let level = 0
  let currentXp = totalXp
  let requiredXp: number = firstLevelXp

  while (currentXp >= requiredXp) {
    currentXp -= requiredXp
    level += 1

    const multiplier = 1 + initialGrowthBonus / (1 + (level - 1) / growthDecay)
    requiredXp = Math.round(requiredXp * multiplier)
  }

  return {
    level,
    totalXp,
    xpToNextLevel: requiredXp - currentXp,
    progress: { currentXp, requiredXp },
  }
}
