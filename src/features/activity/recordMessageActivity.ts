import { addDailyActivityTokens } from '#repositories/activityRepository'

import { countActivityTokens } from './countActivityTokens.ts'

const dayFormatter = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Europe/Moscow',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

export async function recordMessageActivity(userId: string, content: string, sentAt: number): Promise<void> {
  const tokens = countActivityTokens(content)
  if (tokens === 0) return

  await addDailyActivityTokens(userId, dayFormatter.format(sentAt), tokens)
}
