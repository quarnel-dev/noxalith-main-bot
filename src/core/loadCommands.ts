import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

import type { SlashCommand } from '#core'

export async function loadCommands(directory: URL): Promise<Map<string, SlashCommand>> {
  const entries = await readdir(directory, { recursive: true, withFileTypes: true })
  const commands = new Map<string, SlashCommand>()

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.command.ts')) continue

    const filePath = join(entry.parentPath, entry.name)
    const { default: command }: { default?: SlashCommand } = await import(pathToFileURL(filePath).href)

    if (!command || typeof command.data?.toJSON !== 'function' || typeof command.execute !== 'function') {
      throw new Error(`Invalid command export in ${filePath}`)
    }

    const { name } = command.data.toJSON()

    if (commands.has(name)) {
      throw new Error(`Duplicate slash command /${name} in ${filePath}`)
    }

    commands.set(name, command)
  }

  return commands
}
