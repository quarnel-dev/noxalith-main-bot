import { ComponentCommand, type ComponentContext } from 'seyfert'
import { buildPingCard, PING_REFRESH_ID } from '#features/ping/buildPingCard'
import { measurePing } from '#features/ping/measurePing'

export default class PingRefresh extends ComponentCommand {
  componentType = 'Button' as const

  filter(ctx: ComponentContext<'Button'>) {
    return ctx.customId === PING_REFRESH_ID
  }

  async run(ctx: ComponentContext<'Button'>) {
    await ctx.deferUpdate()

    const latency = await measurePing(ctx.client)

    await ctx.interaction.editResponse({
      components: [buildPingCard(latency)],
    })
  }
}