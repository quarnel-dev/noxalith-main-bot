import type { ClientEvents } from 'discord.js'

export interface BotEvent<Name extends keyof ClientEvents> {
  event: Name
  execute(...args: ClientEvents[Name]): void | Promise<void>
}

export function defineEvent<Name extends keyof ClientEvents>(handler: BotEvent<Name>): BotEvent<Name> {
  return handler
}
