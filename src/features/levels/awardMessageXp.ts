import { calculateMessageXp } from './calculateMessageXp.ts'

import { addXp } from '#repositories/membersRepository'

const WINDOW_MS = 45_000
const WINDOW_XP = 100

interface XpWindow {
  expiresAt: number
  remainingXp: number
  seen: Set<string>
}

const windows = new Map<string, XpWindow>()
const pending = new Map<string, Promise<number>>()

export async function awardMessageXp(userId: string, content: string): Promise<number> {
  const previous = pending.get(userId)
  const current = (previous ?? Promise.resolve(0)).catch(() => 0).then(() => persistMessageXp(userId, content))

  pending.set(userId, current)

  try {
    return await current
  } finally {
    if (pending.get(userId) === current) pending.delete(userId)
  }
}

async function persistMessageXp(userId: string, content: string): Promise<number> {
  const now = performance.now()
  let window = windows.get(userId)

  if (window && now >= window.expiresAt) window = undefined
  if (window?.remainingXp === 0) return 0

  const xp = calculateMessageXp(content)
  if (xp === 0) return 0

  const key = getMessageKey(content)
  if (window?.seen.has(key)) return 0

  const awarded = Math.min(xp, window?.remainingXp ?? WINDOW_XP)

  await addXp(userId, awarded)

  if (!window) {
    const newWindow: XpWindow = {
      expiresAt: now + WINDOW_MS,
      remainingXp: WINDOW_XP,
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

  return awarded
}

function getMessageKey(content: string): string {
  const tokens = content
    .normalize('NFC')
    .toLowerCase()
    .match(/<(?:@&?\d+|#\d+|a?:[a-z0-9_]+:\d+)>|[\p{L}\p{Nd}]+/gu)

  return (tokens ?? []).map((token) => (token.startsWith('<') ? token : token.replace(/(.)\1+/gu, '$1'))).join(' ')
}
