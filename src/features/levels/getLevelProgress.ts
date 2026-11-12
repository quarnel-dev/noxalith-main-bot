const FIRST_LEVEL_XP = 300

export function getLevelProgress(totalXp: number) {
  if (!Number.isSafeInteger(totalXp) || totalXp < 0) {
    throw new RangeError('totalXp must be a non-negative safe integer')
  }

  let level = 0
  let currentXp = totalXp
  let requiredXp = FIRST_LEVEL_XP

  while (currentXp >= requiredXp) {
    currentXp -= requiredXp
    level += 1

    const multiplier = 1 + 0.2 / (1 + (level - 1) / 28.5)
    requiredXp = Math.round(requiredXp * multiplier)
  }

  return {
    level,
    totalXp,
    xpToNextLevel: requiredXp - currentXp,
    progress: { currentXp, requiredXp },
  }
}
