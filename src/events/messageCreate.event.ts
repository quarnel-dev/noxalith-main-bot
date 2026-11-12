import { createEvent } from 'seyfert'

import { dsConfig } from '#config/ds.config'

import { awardMessageXp } from '../features/levels/awardMessageXp.ts'

export default createEvent({
  data: { name: 'messageCreate' },
  async run(message) {
    if (message.guildId !== dsConfig.guildId || message.author.bot) return

    await awardMessageXp(message.author.id, message.content)
  },
})
