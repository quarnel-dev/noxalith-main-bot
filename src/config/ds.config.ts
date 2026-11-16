import { envConfig } from './env.config.ts'

interface ServerConfig {
  ignoreChannels: readonly string[]
  activeMemberRoleId: string
  mainChatChannelId: string
}

const servers = {
  dev: {
    ignoreChannels: ['1487143783685554257'],
    activeMemberRoleId: '1571433087051501588',
    mainChatChannelId: '1486724978178261105',
  },
  prod: {
    ignoreChannels: ['1566458384872513646', '1566816052870910143', '1566458271500607590'],
    activeMemberRoleId: '1566466063309209620',
    mainChatChannelId: '1566458324868931634',
  },
} as const satisfies Record<'dev' | 'prod', ServerConfig>

export const dsConfig = {
  ...servers[envConfig.isDev ? 'dev' : 'prod'],
  guildId: envConfig.guildId,

  levels: {
    windowMs: 45_000,
    windowXp: 100,
    maxXpPerWord: 4,
    discordTokenXp: 1,
    firstLevelXp: 300,
    initialGrowthBonus: 0.2,
    growthDecay: 28.5,
  },

  activity: {
    dayMs: 86_400_000,
    checkIntervalMs: 60_000,
    dailyTokenThreshold: 500,
    roleDurationDays: 3,
    timeZone: 'Europe/Moscow',
    conversationSilenceMs: 20 * 60_000,
    conversationReplyMs: 15 * 60_000,
    conversationBonusTokens: 20,
  },

  reputation: {
    pairCooldownMs: 7 * 24 * 60 * 60 * 1_000,
  },
} as const
