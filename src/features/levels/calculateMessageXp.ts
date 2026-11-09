const MAX_XP_PER_WORD = 4
const MAX_XP_PER_MESSAGE = 20

const wordCharacter = /[\p{L}\p{Nd}]/u
const discordToken = /<(?:@&?\d+|#\d+|a?:[a-zA-Z0-9_]+:\d+)>/g

export function calculateMessageXp(content: string): number {
  let xp = 0

  const text = content
    .replace(discordToken, () => {
      xp += 1
      return ' '
    })
    .normalize('NFC')
    .toLowerCase()

  if (xp >= MAX_XP_PER_MESSAGE) return MAX_XP_PER_MESSAGE

  let wordXp = 0
  let previous = ''

  for (const char of text) {
    if (!wordCharacter.test(char)) {
      wordXp = 0
      previous = ''
      continue
    }

    if (char === previous || wordXp === MAX_XP_PER_WORD) continue

    previous = char
    wordXp += 1
    xp += 1

    if (xp === MAX_XP_PER_MESSAGE) break
  }

  return xp
}
