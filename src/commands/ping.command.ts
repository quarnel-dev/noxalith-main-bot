import { Routes, SlashCommandBuilder, MessageFlags, ContainerBuilder, TextDisplayBuilder } from 'discord.js'
import { icons } from '../config/icons.config.ts'
import { defineCommand } from '#core'

export default defineCommand({
  data: new SlashCommandBuilder().setName('ping').setDescription('Показывает задержку бота до Discord'),
  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral })

    const startedAt = performance.now()
    await interaction.client.rest.get(Routes.user())
    const restMs = Math.round(performance.now() - startedAt)

    const card = new ContainerBuilder().addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        ['### Пинг Discord', formatLatency('Gateway', interaction.client.ws.ping), formatLatency('REST API', restMs)].join('\n')
      )
    )

    await interaction.editReply({
      flags: MessageFlags.IsComponentsV2,
      components: [card],
    })
  },
})

function formatLatency(label: string, ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) {
    return `**${label}**\n${icons.dotwhite} Ожидаю замер`
  }

  const rounded = Math.round(ms)
  const icon = rounded < 250 ? icons.dotgreen : rounded < 400 ? icons.dotyellow : icons.dotred

  return `**${label}**\n${icon} ${rounded} мс`
}
