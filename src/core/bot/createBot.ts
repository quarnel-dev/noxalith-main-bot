import { Client, Events, MessageFlags } from 'discord.js'
import type { ClientOptions } from 'discord.js'

import { loadCommands } from '../loadCommands.ts'

export interface CreateBotOptions {
  token: string
  guildId: string
  commandsDirectory: URL
  clientOptions: ClientOptions
}

export async function createBot(options: CreateBotOptions): Promise<Client<true>> {
  const commands = await loadCommands(options.commandsDirectory)
  const client = new Client(options.clientOptions)

  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand() || interaction.guildId !== options.guildId) return

    const command = commands.get(interaction.commandName)
    if (!command) return

    try {
      await command.execute(interaction)
    } catch (err) {
      console.error(`Command /${interaction.commandName} failed`, err)

      const content = 'Не удалось выполнить команду.'

      try {
        if (interaction.deferred && !interaction.replied) {
          await interaction.editReply(content)
        } else if (interaction.replied) {
          await interaction.followUp({ content, flags: MessageFlags.Ephemeral })
        } else {
          await interaction.reply({ content, flags: MessageFlags.Ephemeral })
        }
      } catch (err) {}
    }
  })

  const ready = new Promise<Client<true>>((resolve) => {
    client.once(Events.ClientReady, resolve)
  })

  try {
    await client.login(options.token)
    const readyClient = await ready

    await readyClient.application.commands.set(
      [...commands.values()].map((command) => command.data.toJSON()),
      options.guildId
    )

    return readyClient
  } catch (err) {
    await client.destroy()
    throw err
  }
}
