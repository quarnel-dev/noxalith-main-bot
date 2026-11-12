import { Client, type ParseClient } from 'seyfert'

import { dsConfig } from '#config/ds.config'
import { envConfig } from '#config/env.config'

import { closeMongo, connectMongo } from '#core/database/mongo'

declare module 'seyfert' {
  interface SeyfertRegistry {
    client: ParseClient<Client<true>>
  }
}

const { guildId } = dsConfig
const client = new Client()

await connectMongo(envConfig.mongoUri)
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
