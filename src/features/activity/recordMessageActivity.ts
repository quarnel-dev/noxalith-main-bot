import { addDailyActivityTokens } from '#repositories/activityRepository'

import { countActivityTokens } from './countActivityTokens.ts'
import { getActivityDay } from './activityDay.ts'

export async function recordMessageActivity(userId: string, content: string, sentAt: number): Promise<void> {
  const tokens = countActivityTokens(content)
  if (tokens === 0) return

  await addDailyActivityTokens(userId, getActivityDay(sentAt), tokens)
}
