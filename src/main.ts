import { Client, GatewayIntentBits, Events } from 'discord.js'

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
})

client.once(Events.ClientReady, (client) => {
  console.log(`Bot ready: ${client.user.tag}`)
})

await client.login(process.env.DISCORD_TOKEN)
