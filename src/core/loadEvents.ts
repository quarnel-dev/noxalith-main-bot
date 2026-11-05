import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { Events } from 'discord.js'
import type { ClientEvents } from 'discord.js'

import type { BotEvent } from '#core'

import type { Logger } from './logger.ts'

type LoadedEvent = {
  [Name in keyof ClientEvents]: BotEvent<Name>
}[keyof ClientEvents]

const eventNames = new Set<string>(Object.values(Events))

export async function loadEvents(directory: URL, logger: Logger): Promise<LoadedEvent[]> {
  const startedAt = performance.now()
  const directoryPath = fileURLToPath(directory)
  const events: LoadedEvent[] = []
  let currentPath = directoryPath

  logger.info('Поиск обработчиков событий', `Каталог: ${directoryPath}`)

  try {
    const entries = await readdir(directory, { recursive: true, withFileTypes: true })

    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.event.ts')) continue

      const filePath = join(entry.parentPath, entry.name)
      currentPath = filePath

      const { default: handler }: { default?: LoadedEvent } = await import(pathToFileURL(filePath).href)

      if (
        !handler ||
        typeof handler.event !== 'string' ||
        !eventNames.has(handler.event) ||
        typeof handler.execute !== 'function'
      ) {
        throw new Error(`Invalid event export in ${filePath}`)
      }

      events.push(handler)
      logger.info(`Загружен обработчик ${handler.event}`, `Файл: ${filePath}`)
    }
  } catch (error) {
    logger.error(`Не удалось загрузить обработчики событий (${currentPath})`, error)
    throw error
  }

  logger.info(
    'Загрузка обработчиков событий завершена',
    `Обработчиков: ${events.length}`,
    `Время: ${Math.round(performance.now() - startedAt)} мс`
  )

  return events
}
