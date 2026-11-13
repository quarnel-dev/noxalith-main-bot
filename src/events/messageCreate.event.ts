import { createEvent } from 'seyfert'

import { dsConfig } from '#config/ds.config'

import { awardMessageXp } from '../features/levels/awardMessageXp.ts'

const ignoredChannelIds = new Set<string>(dsConfig.ignoreChannels)

export default createEvent({
  data: { name: 'messageCreate' },
  async run(message) {
    if (message.guildId !== dsConfig.guildId || message.author.bot) return
    if (ignoredChannelIds.has(message.channelId)) return

    await awardMessageXp(message.author.id, message.content)
  },
})
