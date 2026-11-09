import { defineEvent } from '#core'

import { awardMessageXp } from '../features/levels/awardMessageXp.ts'

const guildId = process.env.DEV === 'true' ? process.env.GUILD_ID_DEV : process.env.GUILD_ID

export default defineEvent({
  event: 'messageCreate',
  execute(message) {
    if (!guildId || message.guildId !== guildId || message.author.bot) return

    console.info(`[messageCreate] Получено сообщение ${message.id}: ${message.content}`)
    const xp = awardMessageXp(message.author.id, message.content)
    console.info(`[levels] ${message.id} → ${xp} XP начислено`)
  },
})
