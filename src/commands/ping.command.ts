import { Command, Declare, MessageFlags, type CommandContext } from 'seyfert'

import { buildPingCard } from '#features/ping/buildPingCard'
import { measurePing } from '#features/ping/measurePing'

@Declare({
  name: 'ping',
  description: 'Показывает задержку бота до Discord',
})
export default class PingCommand extends Command {
  async run(ctx: CommandContext) {
    await ctx.deferReply(true)

    const latency = await measurePing(ctx.client)

    await ctx.editResponse({
      flags: MessageFlags.IsComponentsV2,
      components: [buildPingCard(latency)],
    })
  }
}
