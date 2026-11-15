import { createEvent } from 'seyfert'

import { dsConfig } from '#config/ds.config'

import { awardMessageXp } from '#features/levels/awardMessageXp'
import { recordMessageActivity } from '#features/activity/recordMessageActivity'
import { recordConversation } from '#features/activity/recordConversation'

const ignoredChannelIds = new Set<string>(dsConfig.ignoreChannels)

export default createEvent({
  data: { name: 'messageCreate' },
  async run(message, client) {
    if (message.guildId !== dsConfig.guildId || message.author.bot) return
    if (ignoredChannelIds.has(message.channelId)) return

    const sentAt = message.timestamp ?? Date.now()

    const [level] = await Promise.all([
      awardMessageXp(message.author.id, message.content),

      recordMessageActivity(message.author.id, message.content, message.timestamp ?? Date.now()).catch((error) => {
        client.logger.error('Не удалось записать активность участника', error)
      }),

      message.channelId === dsConfig.mainChatChannelId
        ? recordConversation(message.id, message.author.id, message.content, sentAt).catch((error) => {
            client.logger.error('Не удалось обработать начало разговора', error)
          })
        : Promise.resolve(),
    ])

    if (level === null) return

    const notice = await client.messages.write(message.channelId, {
      content: `🎉 <@${message.author.id}>, у тебя теперь уровень **${level}**!`,
      allowed_mentions: { parse: [], users: [message.author.id] },
    })

    setTimeout(() => {
      void client.messages.delete(notice.id, message.channelId).catch((error) => {
        client.logger.debug('Не удалось удалить оповещение об уровне', error)
      })
    }, 120_000).unref()
  },
})
