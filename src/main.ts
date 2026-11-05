import { GatewayIntentBits } from 'discord.js'
import { createBot } from '#core'

const token = process.env.DISCORD_TOKEN
const guildIdKey = process.env.DEV === 'true' ? 'GUILD_ID_DEV' : 'GUILD_ID'
const guildId = process.env[guildIdKey]

if (!token) throw new Error('Missing DISCORD_TOKEN')
if (!guildId) throw new Error(`Missing ${guildIdKey}`)

const client = await createBot({
  logs: true,
  token,
  guildId,
  commandsDirectory: new URL('./commands/', import.meta.url),
  eventsDirectory: new URL('./events/', import.meta.url),
  clientOptions: {
    intents: [GatewayIntentBits.Guilds],
  },
})
