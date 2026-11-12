import { MongoServerError } from 'mongodb'

import { dsConfig } from '#config/ds.config'
import { getDb } from '#core/database/mongo'
import { ensureMember, incrementReputation } from '#repositories/membersRepository'

interface ReputationPair {
  _id: string
  fromUserId: string
  toUserId: string
  lastGivenAt: Date
}

export async function giveReputation(fromUserId: string, toUserId: string): Promise<boolean> {
  await ensureMember(toUserId)

  const db = getDb()
  const pairs = db.collection<ReputationPair>('reputation')
  const pairId = `${fromUserId}:${toUserId}`
  const session = db.client.startSession()

  try {
    return await session.withTransaction(async () => {
      const pair = await pairs.findOne({ _id: pairId }, { session })
      const now = new Date()
      const cutoff = now.getTime() - dsConfig.reputation.pairCooldownMs

      if (pair && pair.lastGivenAt.getTime() > cutoff) return false

      await pairs.updateOne(
        { _id: pairId },
        {
          $setOnInsert: { fromUserId, toUserId },
          $set: { lastGivenAt: now },
        },
        { upsert: true, session }
      )

      await incrementReputation(toUserId, session)

      return true
    })
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) return false

    throw error
  } finally {
    await session.endSession()
  }
}
