import { Client, Events, MessageFlags } from 'discord.js'
import type { ClientOptions } from 'discord.js'

import { createLogger } from '../logger.ts'

import { loadCommands } from '../loadCommands.ts'
import { loadEvents } from '../loadEvents.ts'

export interface CreateBotOptions {
  token: string
  guildId: string
  commandsDirectory: URL
  eventsDirectory?: URL
  clientOptions: ClientOptions
  logs: boolean
}

export async function createBot(options: CreateBotOptions): Promise<Client<true>> {
  const logger = createLogger(options.logs)
  const commands = await loadCommands(options.commandsDirectory, logger)
  const events = options.eventsDirectory ? await loadEvents(options.eventsDirectory, logger) : []

  const client = new Client(options.clientOptions)

  for (const handler of events) {
    client.on(handler.event, async (...args) => {
      const execute = handler.execute as (...eventArgs: typeof args) => void | Promise<void>

      try {
        await execute(...args)
      } catch (error) {
        logger.error(`Ошибка обработчика события ${handler.event}`, error)
      }
    })
  }

  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand() || interaction.guildId !== options.guildId) return

    const name = `/${interaction.commandName}`
    const command = commands.get(interaction.commandName)

    if (!command) {
      logger.info(`Получен вызов ${name}, но команды нет в реестре`)
      return
    }

    const startedAt = performance.now()
    logger.info(`Выполняется команда ${name}`)

    try {
      await command.execute(interaction)

      logger.info(`Команда ${name} выполнена`, `Время: ${Math.round(performance.now() - startedAt)} мс`)
    } catch (error) {
      logger.error(`Не удалось выполнить команду ${name}`, error)

      const content = 'Не удалось выполнить команду.'

      try {
        if (interaction.deferred && !interaction.replied) {
          await interaction.editReply(content)
        } else if (interaction.replied) {
          await interaction.followUp({ content, flags: MessageFlags.Ephemeral })
        } else {
          await interaction.reply({ content, flags: MessageFlags.Ephemeral })
        }
      } catch (replyError) {
        logger.error(`Не удалось отправить ответ об ошибке команды ${name}`, replyError)
      }
    }
  })

  const ready = new Promise<Client<true>>((resolve) => {
    client.once(Events.ClientReady, resolve)
  })

  try {
    logger.info('Подключение к Discord')
    await client.login(options.token)

    const readyClient = await ready
    const guild = readyClient.guilds.cache.get(options.guildId)
    const server = guild ? `${guild.name} (${guild.id})` : options.guildId
    logger.info(`Бот подключён как ${readyClient.user.tag}`)

    logger.info('Регистрация slash-команд', `Сервер: ${options.guildId}`, `Команд: ${commands.size}`)

    await readyClient.application.commands.set(
      [...commands.values()].map((command) => command.data.toJSON()),
      options.guildId
    )

    logger.info(`Зарегистрировано slash-команд: ${commands.size}`)
    logger.info(`Бот ${readyClient.user.tag} запущен`, `Сервер: ${server}`)
    return readyClient
  } catch (error) {
    logger.error('Не удалось запустить бота', error)

    try {
      await client.destroy()
    } catch (destroyError) {
      logger.error('Не удалось закрыть клиент Discord после ошибки запуска', destroyError)
    }

    throw error
  }
}
