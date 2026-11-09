import { calculateMessageXp } from './calculateMessageXp.ts'

const WINDOW_MS = 45_000
const WINDOW_XP = 20

interface XpWindow {
  expiresAt: number
  remainingXp: number
  seen: Set<string>
}

const windows = new Map<string, XpWindow>()

export function awardMessageXp(userId: string, content: string): number {
  const now = performance.now()
  let window = windows.get(userId)

  if (window && now >= window.expiresAt) window = undefined
  if (window?.remainingXp === 0) return 0

  const xp = calculateMessageXp(content)
  if (xp === 0) return 0

  const key = getMessageKey(content)
  if (window?.seen.has(key)) return 0

  if (!window) {
    const newWindow: XpWindow = {
      expiresAt: now + WINDOW_MS,
      remainingXp: WINDOW_XP,
      seen: new Set(),
    }

    windows.set(userId, newWindow)
    window = newWindow

    setTimeout(() => {
      if (windows.get(userId) === newWindow) windows.delete(userId)
    }, WINDOW_MS).unref()
  }

  const awarded = Math.min(xp, window.remainingXp)
  window.seen.add(key)
  window.remainingXp -= awarded

  return awarded
}

function getMessageKey(content: string): string {
  const tokens = content
    .normalize('NFC')
    .toLowerCase()
    .match(/<(?:@&?\d+|#\d+|a?:[a-z0-9_]+:\d+)>|[\p{L}\p{Nd}]+/gu)

  return (tokens ?? []).map((token) => (token.startsWith('<') ? token : token.replace(/(.)\1+/gu, '$1'))).join(' ')
}
