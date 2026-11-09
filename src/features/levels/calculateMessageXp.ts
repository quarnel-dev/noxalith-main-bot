const MAX_XP_PER_WORD = 4
const MAX_XP_PER_MESSAGE = 20

const wordCharacter = /[\p{L}\p{Nd}]/u

export function calculateMessageXp(content: string): number {
  let xp = 0
  let wordXp = 0
  let previous = ''

  for (const char of content.normalize('NFC').toLowerCase()) {
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
