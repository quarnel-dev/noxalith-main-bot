export function createLogger(enabled: boolean) {
  const clock = Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  const cyan = '\x1b[36m'
  const red = '\x1b[31m'
  const reset = '\x1b[0m'

  function getPrefix() {
    return `[${clock.format(new Date())}] [core] `
  }

  return {
    info(message: string, ...details: string[]) {
      if (!enabled) return

      const prefix = getPrefix()
      const indent = ' '.repeat(prefix.length)
      const displayPrefix = process.stdout.isTTY ? `${cyan}${prefix}${reset}` : prefix

      const lines = [
        `${displayPrefix}${message}`,
        ...details.map((detail) => `${indent}${detail}`),
      ]

      console.info(lines.join('\n'))
    },

    error(message: string, error: unknown) {
      if (!enabled) return

      const prefix = getPrefix()
      const displayPrefix = process.stderr.isTTY ? `${red}${prefix}${reset}` : prefix

      console.error(`${displayPrefix}${message}`, error)
    },
  }
}

export type Logger = ReturnType<typeof createLogger>