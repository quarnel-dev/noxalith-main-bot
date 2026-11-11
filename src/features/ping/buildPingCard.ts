import { Container, TextDisplay } from 'seyfert'
import { icons } from '#config/icons.config'

export function buildPingCard(latency: { gateway: number; rest: number }): Container {
  return new Container().addComponents(
    new TextDisplay().setContent(
      ['### Задержка до Discord', formatLatency('Gateway', latency.gateway), formatLatency('REST API', latency.rest)].join('\n')
    )
  )
}

function formatLatency(label: string, ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) {
    return `**${label}**\n${icons.dotwhite} Ожидаю замер`
  }

  const rounded = Math.round(ms)
  const icon = rounded < 250 ? icons.dotgreen : rounded < 400 ? icons.dotyellow : icons.dotred

  return `**${label}**\n${icon} ${rounded} мс`
}
