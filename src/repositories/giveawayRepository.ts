import { randomInt } from 'node:crypto'

import { getDb } from '#core/database/mongo'

export type GiveawayRequirement = string

export interface GiveawayDocument {
  _id: string
  guildId: string
  channelId: string
  prize?: string
  prizeId?: string
  prizeText?: string
  organizerId?: string
  resultPending?: boolean
  endsAt: Date
  requirements: GiveawayRequirement[]
  status: 'draft' | 'open' | 'closed' | 'cancelled'
  participantIds: string[]
  winnerIds: string[]
}

type CreateGiveawayInput = Pick<GiveawayDocument, 'guildId' | 'channelId' | 'endsAt' | 'requirements'> & {
  messageId: string
  prizeId: string
  prizeText: string
  organizerId: string
}

function giveawaysCollection() {
  return getDb().collection<GiveawayDocument>('giveaways')
}

export async function createGiveaway(input: CreateGiveawayInput): Promise<void> {
  const { messageId, ...giveaway } = input

  await giveawaysCollection().insertOne({
    _id: messageId,
    ...giveaway,
    status: 'draft',
    participantIds: [],
    winnerIds: [],
  })
}

export async function openGiveaway(messageId: string): Promise<void> {
  await giveawaysCollection().updateOne({ _id: messageId, status: 'draft' }, { $set: { status: 'open' } })
}

export async function cancelDraftGiveaway(messageId: string): Promise<void> {
  await giveawaysCollection().updateOne({ _id: messageId, status: 'draft' }, { $set: { status: 'cancelled' } })
}

export function findGiveawaysToOpen(guildId: string): Promise<GiveawayDocument[]> {
  return giveawaysCollection().find({ guildId, status: 'draft' }).toArray()
}

export function findGiveaway(messageId: string): Promise<GiveawayDocument | null> {
  return giveawaysCollection().findOne({ _id: messageId })
}

export async function addGiveawayParticipant(messageId: string, userId: string): Promise<'joined' | 'alreadyJoined' | 'closed'> {
  const previous = await giveawaysCollection().findOneAndUpdate(
    {
      _id: messageId,
      status: 'open',
      endsAt: { $gt: new Date() },
    },
    { $addToSet: { participantIds: userId } },
    { returnDocument: 'before' }
  )

  if (!previous) return 'closed'
  return previous.participantIds.includes(userId) ? 'alreadyJoined' : 'joined'
}

export function findGiveawaysToFinish(guildId: string): Promise<GiveawayDocument[]> {
  return giveawaysCollection()
    .find({
      guildId,
      $or: [
        { status: 'open', endsAt: { $lte: new Date() } },
        { status: 'closed', resultPending: true },
      ],
    })
    .toArray()
}

export async function drawGiveawayWinner(giveaway: GiveawayDocument, mode: 'finish' | 'reroll'): Promise<boolean> {
  const candidates = giveaway.participantIds.filter((id) => !giveaway.winnerIds.includes(id))

  if (mode === 'reroll' && candidates.length === 0) return false

  const winnerIds = [...giveaway.winnerIds]
  if (candidates.length > 0) {
    winnerIds.push(candidates[randomInt(candidates.length)]!)
  }

  const result = await giveawaysCollection().updateOne(
    {
      _id: giveaway._id,
      status: mode === 'finish' ? 'open' : 'closed',
      endsAt: { $lte: new Date() },
      resultPending: { $ne: true },
      participantIds: giveaway.participantIds,
      winnerIds: giveaway.winnerIds,
    },
    { $set: { status: 'closed', winnerIds, resultPending: true } }
  )

  return result.modifiedCount === 1
}

export async function markGiveawayResultPublished(giveaway: GiveawayDocument): Promise<void> {
  await giveawaysCollection().updateOne(
    {
      _id: giveaway._id,
      status: 'closed',
      winnerIds: giveaway.winnerIds,
      resultPending: true,
    },
    { $set: { resultPending: false } }
  )
}
