import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  ContainerBuilder,
  MessageFlags,
  Routes,
  SlashCommandBuilder,
  TextDisplayBuilder,
} from 'discord.js'
import type { Client } from 'discord.js'
import { icons } from '../config/icons.config.ts'
import { defineCommand } from '#core'

const refreshId = 'ping:refresh'

export default defineCommand({
  data: new SlashCommandBuilder().setName('ping').setDescription('Показывает задержку бота до Discord'),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral })

    let latency = await measureLatency(interaction.client)
    const message = await interaction.editReply({
      flags: MessageFlags.IsComponentsV2,
      components: [createCard(latency)],
    })

    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      filter: (button) => button.customId === refreshId && button.user.id === interaction.user.id,
      time: 120_000,
    })

    let refresh: Promise<void> | undefined

    collector.on('collect', async (button) => {
      if (refresh) {
        await button.deferUpdate().catch(console.error)
        return
      }

      refresh = (async () => {
        await button.deferUpdate()
        latency = await measureLatency(button.client)
        await button.editReply({ components: [createCard(latency)] })
      })()

      try {
        await refresh
      } catch (error) {
        console.error('Failed to refresh /ping', error)
      } finally {
        refresh = undefined
      }
    })

    collector.once('end', async () => {
      await refresh?.catch(() => {})

      try {
        await interaction.editReply({
          components: [createCard(latency, false)],
        })
      } catch (error) {
        console.error('Failed to remove /ping refresh button', error)
      }
    })
  },
})

async function measureLatency(client: Client) {
  const startedAt = performance.now()
  await client.rest.get(Routes.user())

  return {
    rest: performance.now() - startedAt,
    gateway: client.ws.ping,
  }
}

function createCard(latency: { gateway: number; rest: number }, showRefresh = true) {
  const card = new ContainerBuilder().addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      ['### Задержка до Discord', formatLatency('Gateway', latency.gateway), formatLatency('REST API', latency.rest)].join('\n')
    )
  )

  if (showRefresh) {
    card.addActionRowComponents(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId(refreshId).setLabel('Обновить').setStyle(ButtonStyle.Secondary)
      )
    )
  }

  return card
}

function formatLatency(label: string, ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) {
    return `**${label}**\n${icons.dotwhite} Ожидаю замер`
  }

  const rounded = Math.round(ms)
  const icon = rounded < 250 ? icons.dotgreen : rounded < 400 ? icons.dotyellow : icons.dotred

  return `**${label}**\n${icon} ${rounded} мс`
}
