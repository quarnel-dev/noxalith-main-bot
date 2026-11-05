import type { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'

export interface SlashCommand {
  data: Pick<SlashCommandBuilder, 'toJSON'>
  execute(interaction: ChatInputCommandInteraction): Promise<void>
}

export function defineCommand(command: SlashCommand): SlashCommand {
  return command
}
