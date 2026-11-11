import { Client, type ParseClient } from 'seyfert'

declare module 'seyfert' {
  interface SeyfertRegistry {
    client: ParseClient<Client<true>>
  }
}

const guildIdKey = process.env.DEV === 'true' ? 'GUILD_ID_DEV' : 'GUILD_ID'
const guildId = process.env[guildIdKey]

if (!guildId) throw new Error(`Missing ${guildIdKey}`)

const client = new Client()

await client.start()

const commands = client.commands.values

for (const command of commands) {
  command.guildId = [guildId]
}

await client.proxy
  .applications(client.applicationId)
  .guilds(guildId)
  .commands.put({
    body: commands.map((command) => command.toJSON()),
  })
