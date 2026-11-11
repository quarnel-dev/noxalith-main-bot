import { Client, type ParseClient } from 'seyfert'

declare module 'seyfert' {
  interface SeyfertRegistry {
    client: ParseClient<Client<true>>
  }
}

const client = new Client()

await client.start()
