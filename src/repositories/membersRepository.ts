import type { ClientSession } from 'mongodb'

import { getDb } from '#core/database/mongo'

export interface MemberDocument {
  _id: string
  createdAt: Date
  levels?: {
    totalXp: number
  }
  reputation?: number
  activeMemberUntil?: Date
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

export async function addXp(userId: string, amount: number): Promise<number> {
  const previous = await membersCollection().findOneAndUpdate(
    { _id: userId },
    {
      $setOnInsert: { createdAt: new Date() },
      $inc: { 'levels.totalXp': amount },
    },
    {
      upsert: true,
      returnDocument: 'before',
      projection: { 'levels.totalXp': 1 },
    }
  )

  return previous?.levels?.totalXp ?? 0
}

export async function incrementReputation(userId: string, session: ClientSession): Promise<void> {
  const result = await membersCollection().updateOne({ _id: userId }, { $inc: { 'reputation.total': 1 } }, { session })

  if (result.matchedCount === 0) {
    throw new Error(`Member ${userId} was not found`)
  }
}

export async function setActiveMemberUntil(userId: string, until: Date): Promise<void> {
  await membersCollection().updateOne(
    { _id: userId },
    {
      $setOnInsert: { createdAt: new Date() },
      $set: { activeMemberUntil: until },
    },
    { upsert: true }
  )
}

export function findMembersWithExpiredActiveRole(now: Date): Promise<MemberDocument[]> {
  return membersCollection()
    .find({ activeMemberUntil: { $lte: now } })
    .toArray()
}

export async function clearActiveMemberUntil(userId: string): Promise<void> {
  await membersCollection().updateOne({ _id: userId }, { $unset: { activeMemberUntil: '' } })
}
