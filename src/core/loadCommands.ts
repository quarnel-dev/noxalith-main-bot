import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL, fileURLToPath } from 'node:url'

import type { Logger } from './logger.ts'

import type { SlashCommand } from '#core'

export async function loadCommands(directory: URL, logger: Logger): Promise<Map<string, SlashCommand>> {
  const startedAt = performance.now()
  const directoryPath = fileURLToPath(directory)
  const commands = new Map<string, SlashCommand>()
  let currentPath = directoryPath

  logger.info('Поиск slash-команд', `Каталог: ${directoryPath}`)

  try {
    const entries = await readdir(directory, { recursive: true, withFileTypes: true })

    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.command.ts')) continue

      const filePath = join(entry.parentPath, entry.name)
      currentPath = filePath

      const { default: command }: { default?: SlashCommand } = await import(pathToFileURL(filePath).href)

      if (!command || typeof command.data?.toJSON !== 'function' || typeof command.execute !== 'function') {
        throw new Error(`Invalid command export in ${filePath}`)
      }

      const { name } = command.data.toJSON()

      if (commands.has(name)) {
        throw new Error(`Duplicate slash command /${name} in ${filePath}`)
      }

      commands.set(name, command)
      logger.info(`Загружена команда /${name}`, `Файл: ${filePath}`)
    }
  } catch (error) {
    logger.error(`Не удалось загрузить команды (${currentPath})`, error)
    throw error
  }

  logger.info(
    'Загрузка slash-команд завершена',
    `Команд: ${commands.size}`,
    `Время: ${Math.round(performance.now() - startedAt)} мс`
  )

  return commands
}
