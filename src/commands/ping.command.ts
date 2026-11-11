import { Command, Declare, MessageFlags, type CommandContext } from 'seyfert'

@Declare({
  name: 'ping',
  description: 'Показывает задержку бота до Discord',
})
export default class PingCommand extends Command {
  async run(ctx: CommandContext) {
    await ctx.write({
      content: 'Pong!',
      flags: MessageFlags.Ephemeral,
    })
  }
}
