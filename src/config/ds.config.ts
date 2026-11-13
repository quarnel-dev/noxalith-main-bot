import { envConfig } from './env.config.ts'

interface ServerConfig {
  guildId: string
  ignoreChannels: readonly string[]
}

const servers = {
  dev: {
    guildId: envConfig.guildIds.dev,
    ignoreChannels: ['1487143783685554257'],
  },
  prod: {
    guildId: envConfig.guildIds.prod,
    ignoreChannels: ['1566458384872513646', '1566816052870910143', '1566458271500607590'],
  },
} as const satisfies Record<'dev' | 'prod', ServerConfig>

export const dsConfig = {
  ...servers[envConfig.isDev ? 'dev' : 'prod'],

  levels: {
    windowMs: 45_000,
    windowXp: 100,
    maxXpPerWord: 4,
    discordTokenXp: 1,
    firstLevelXp: 300,
    initialGrowthBonus: 0.2,
    growthDecay: 28.5,
  },

  reputation: {
    pairCooldownMs: 7 * 24 * 60 * 60 * 1_000,
  },
} as const
