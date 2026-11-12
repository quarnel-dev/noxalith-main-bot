import { createEvent } from 'seyfert'

import { awardMessageXp } from '../features/levels/awardMessageXp.ts'

const guildId = process.env.DEV === 'true' ? process.env.GUILD_ID_DEV : process.env.GUILD_ID

export default createEvent({
  data: { name: 'messageCreate' },
  async run(message) {
    if (!guildId || message.guildId !== guildId || message.author.bot) return

    await awardMessageXp(message.author.id, message.content)
  },
})