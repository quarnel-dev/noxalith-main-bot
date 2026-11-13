import { dsConfig } from '#config/ds.config'
import { addXp } from '#repositories/membersRepository'

import { calculateMessageXp } from './calculateMessageXp.ts'
import { getLevelProgress } from './getLevelProgress.ts'

interface XpWindow {
  expiresAt: number
  remainingXp: number
  seen: Set<string>
}

const windows = new Map<string, XpWindow>()
const pending = new Map<string, Promise<number | null>>()

export async function awardMessageXp(userId: string, content: string): Promise<number | null> {
  const previous = pending.get(userId)
  const current = (previous ?? Promise.resolve(null)).catch(() => null).then(() => persistMessageXp(userId, content))

  pending.set(userId, current)

  try {
    return await current
  } finally {
    if (pending.get(userId) === current) pending.delete(userId)
  }
}

async function persistMessageXp(userId: string, content: string): Promise<number | null> {
  const now = performance.now()
  let window = windows.get(userId)

  if (window && now >= window.expiresAt) window = undefined
  if (window?.remainingXp === 0) return null

  const xp = calculateMessageXp(content)
  if (xp === 0) return null

  const key = getMessageKey(content)
  if (window?.seen.has(key)) return null

  const awarded = Math.min(xp, window?.remainingXp ?? dsConfig.levels.windowXp)
  const previousXp = await addXp(userId, awarded)

  if (!window) {
    const newWindow: XpWindow = {
      expiresAt: now + dsConfig.levels.windowMs,
      remainingXp: dsConfig.levels.windowXp,
      seen: new Set(),
    }

    windows.set(userId, newWindow)
    window = newWindow

    setTimeout(
      () => {
        if (windows.get(userId) === newWindow) windows.delete(userId)
      },
      Math.max(0, newWindow.expiresAt - performance.now())
    ).unref()
  }

  window.seen.add(key)
  window.remainingXp -= awarded

  const previous = getLevelProgress(previousXp)
  if (awarded < previous.xpToNextLevel) return null

  return getLevelProgress(previousXp + awarded).level
}

function getMessageKey(content: string): string {
  const tokens = content
    .normalize('NFC')
    .toLowerCase()
    .match(/<(?:@&?\d+|#\d+|a?:[a-z0-9_]+:\d+)>|[\p{L}\p{Nd}]+/gu)

  return (tokens ?? []).map((token) => (token.startsWith('<') ? token : token.replace(/(.)\1+/gu, '$1'))).join(' ')
}
