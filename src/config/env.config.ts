function requireEnv(name: string): string {
  const value = process.env[name]?.trim()

  if (!value) {
    throw new Error(`Обязательная переменная окружения ${name} не задана`)
  }

  return value
}

const isDev = process.env.DEV === 'true'

export const envConfig = {
  isDev,
  guildId: requireEnv(isDev ? 'GUILD_ID_DEV' : 'GUILD_ID'),
  mongoUri: requireEnv(isDev ? 'MONGODB_URI_DEV' : 'MONGODB_URI'),
} as const
