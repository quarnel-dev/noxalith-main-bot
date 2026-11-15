import { getDb } from '#core/database/mongo'

export interface ConversationState {
  _id: 'mainChat'
  lastMessageAt: Date
  pending?: {
    messageId: string
    userId: string
    startedAt: Date
    expiresAt: Date
  }
}

function conversationCollection() {
  return getDb().collection<ConversationState>('conversationState')
}

export function findConversationState(): Promise<ConversationState | null> {
  return conversationCollection().findOne({ _id: 'mainChat' })
}

export async function saveConversationState(state: ConversationState): Promise<void> {
  await conversationCollection().replaceOne({ _id: 'mainChat' }, state, { upsert: true })
}
