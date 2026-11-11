import { config } from 'seyfert'

const token = process.env.DISCORD_TOKEN

if (!token) throw new Error('Missing DISCORD_TOKEN')

export default config.bot({
  token,
  intents: ['Guilds', 'GuildMessages', 'MessageContent'],
  locations: {
    base: 'dist',
  },
})
