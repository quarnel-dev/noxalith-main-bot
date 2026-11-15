import { dsConfig } from '#config/ds.config'

const dayFormatter = new Intl.DateTimeFormat('sv-SE', {
  timeZone: dsConfig.activity.timeZone,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

export function getActivityDay(timestamp: number = Date.now()): string {
  return dayFormatter.format(timestamp)
}

export function previousActivityDay(day: string): string {
  const date = new Date(`${day}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() - 1)
  return date.toISOString().slice(0, 10)
}
