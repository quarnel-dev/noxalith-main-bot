import { defineEvent } from '#core'

const guildId = process.env.DEV === 'true' ? process.env.GUILD_ID_DEV : process.env.GUILD_ID

export default defineEvent({
  event: 'messageCreate',
  execute(message) {
    if (!guildId || message.guildId !== guildId || message.author.bot) return

    console.info(`[messageCreate] Получено сообщение ${message.id}: ${message.content}`)
  },
})
