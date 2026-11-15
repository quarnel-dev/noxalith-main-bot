import { dsConfig } from '#config/ds.config'

import { addConversationBonusTokens } from '#repositories/activityRepository'
import { findConversationState, saveConversationState } from '#repositories/conversationRepository'

import { getActivityDay } from './activityDay.ts'

const discordToken = /<(?:@!?\d+|@&\d+|#\d+|a?:[a-zA-Z0-9_]+:\d+)>/g
const word = /\p{L}+/u

let queue: Promise<void> = Promise.resolve()

function hasWord(content: string): boolean {
  return word.test(content.replace(discordToken, ' '))
}

export function recordConversation(messageId: string, userId: string, content: string, sentAt: number): Promise<void> {
  const current = queue.catch(() => {}).then(() => processMessage(messageId, userId, content, sentAt))

  queue = current
  return current
}

async function processMessage(messageId: string, userId: string, content: string, sentAt: number): Promise<void> {
  const state = await findConversationState()
  const messageAt = new Date(sentAt)

  if (state && messageAt <= state.lastMessageAt) return

  const waiting = state?.pending && sentAt <= state.pending.expiresAt.getTime() ? state.pending : undefined

  if (waiting && userId !== waiting.userId && hasWord(content)) {
    await addConversationBonusTokens(
      waiting.userId,
      getActivityDay(sentAt),
      waiting.messageId,
      dsConfig.activity.conversationBonusTokens
    )

    await saveConversationState({
      _id: 'mainChat',
      lastMessageAt: messageAt,
    })
    return
  }

  if (!waiting && state && sentAt - state.lastMessageAt.getTime() >= dsConfig.activity.conversationSilenceMs) {
    await saveConversationState({
      _id: 'mainChat',
      lastMessageAt: messageAt,
      pending: {
        messageId,
        userId,
        startedAt: messageAt,
        expiresAt: new Date(sentAt + dsConfig.activity.conversationReplyMs),
      },
    })
    return
  }

  await saveConversationState({
    _id: 'mainChat',
    lastMessageAt: messageAt,
    pending: waiting,
  })
}
