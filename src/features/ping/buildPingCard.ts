import { Container, TextDisplay, ActionRow, Button, ButtonStyle } from 'seyfert'
import { icons } from '#config/icons.config'

export const PING_REFRESH_ID = 'ping:refresh'

export function buildPingCard(latency: { gateway: number; rest: number }): Container {
  return new Container().addComponents(
    new TextDisplay().setContent(
      ['### Задержка до Discord', formatLatency('Gateway', latency.gateway), formatLatency('REST API', latency.rest)].join('\n')
    ),
    new ActionRow<Button>().setComponents([
      new Button().setCustomId(PING_REFRESH_ID).setLabel('Обновить').setStyle(ButtonStyle.Secondary),
    ])
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
