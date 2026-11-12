import { getDb } from '#core/database/mongo'

export type GiveawayRequirement = string

export interface GiveawayDocument {
  _id: string
  guildId: string
  channelId: string
  prize: string
  endsAt: Date
  requirements: GiveawayRequirement[]
  status: 'open' | 'closed'
  participantIds: string[]
  winnerIds: string[]
}

type CreateGiveawayInput = Pick<GiveawayDocument, 'guildId' | 'channelId' | 'prize' | 'endsAt' | 'requirements'> & {
  messageId: string
}

function giveawaysCollection() {
  return getDb().collection<GiveawayDocument>('giveaways')
}

export async function createGiveaway(input: CreateGiveawayInput): Promise<void> {
  const { messageId, ...giveaway } = input

  await giveawaysCollection().insertOne({
    _id: messageId,
    ...giveaway,
    status: 'open',
    participantIds: [],
    winnerIds: [],
  })
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
