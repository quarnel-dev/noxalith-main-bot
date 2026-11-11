import { Client, type ParseClient } from 'seyfert'

import { closeMongo, connectMongo } from '#core/database/mongo'

declare module 'seyfert' {
  interface SeyfertRegistry {
    client: ParseClient<Client<true>>
  }
}

const guildIdKey = process.env.DEV === 'true' ? 'GUILD_ID_DEV' : 'GUILD_ID'
const guildId = process.env[guildIdKey]

const mongoUriKey = process.env.DEV === 'true' ? 'MONGODB_URI_DEV' : 'MONGODB_URI'
const mongoUri = process.env[mongoUriKey]

if (!guildId) throw new Error(`Missing ${guildIdKey}`)
if (!mongoUri) throw new Error(`Missing ${mongoUriKey}`)

const client = new Client()

await connectMongo(mongoUri)
console.info('[MongoDB] Connected')

try {
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
} catch (error) {
  await closeMongo().catch((closeError) => {
    console.error('[MongoDB] Failed to close connection', closeError)
  })
  throw error
}
