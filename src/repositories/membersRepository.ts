import { getDb } from '#core/database/mongo'

export interface MemberDocument {
  _id: string
  createdAt: Date
  levels?: {
    totalXp: number
  }
}

function membersCollection() {
  return getDb().collection<MemberDocument>('members')
}

export async function ensureMember(userId: string): Promise<void> {
  await membersCollection().updateOne({ _id: userId }, { $setOnInsert: { createdAt: new Date() } }, { upsert: true })
}

export function findMember(userId: string): Promise<MemberDocument | null> {
  return membersCollection().findOne({ _id: userId })
}

export async function addXp(userId: string, amount: number): Promise<void> {
  await membersCollection().updateOne(
    { _id: userId },
    {
      $setOnInsert: { createdAt: new Date() },
      $inc: { 'levels.totalXp': amount },
    },
    { upsert: true }
  )
}
