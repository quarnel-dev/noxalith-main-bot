import type { CommandContext } from 'seyfert'

export async function measurePing(client: CommandContext['client']) {
  const startedAt = performance.now()
  await client.proxy.users('@me').get()

  return {
    rest: performance.now() - startedAt,
    gateway: client.gateway.latency,
  }
}
