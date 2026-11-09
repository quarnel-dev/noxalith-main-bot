import { defineEvent } from '#core'

import { calculateMessageXp } from '../features/levels/calculateMessageXp.ts'

const guildId = process.env.DEV === 'true' ? process.env.GUILD_ID_DEV : process.env.GUILD_ID

export default defineEvent({
  event: 'messageCreate',
  execute(message) {
    if (!guildId || message.guildId !== guildId || message.author.bot) return

    console.info(`[messageCreate] Получено сообщение ${message.id}: ${message.content}`)
    const xp = calculateMessageXp(message.content)
    console.info(`[levels] ${message.id} → ${xp} XP за текст`)
  },
})
