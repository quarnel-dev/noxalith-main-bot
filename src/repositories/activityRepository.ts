import { getDb } from '#core/database/mongo'

interface DailyActivity {
  _id: string
  userId: string
  day: string
  tokens: number
}

export async function addDailyActivityTokens(userId: string, day: string, tokens: number): Promise<void> {
  await getDb()
    .collection<DailyActivity>('dailyActivity')
    .updateOne(
      { _id: `${day}:${userId}` },
      {
        $setOnInsert: { userId, day },
        $inc: { tokens },
      },
      { upsert: true }
    )
}

export async function findActiveUsers(day: string, threshold: number): Promise<string[]> {
  const records = await getDb()
    .collection<DailyActivity>('dailyActivity')
    .find({ day, tokens: { $gte: threshold } }, { projection: { _id: 0, userId: 1 } })
    .toArray()

  return records.map((record) => record.userId)
}
