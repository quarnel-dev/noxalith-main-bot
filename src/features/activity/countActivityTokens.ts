const discordMarkup = /<(?:@!?\d+|@&\d+|#\d+|a?:[a-z0-9_]+:\d+)>/g
const parts = /[\p{L}\p{Nd}]+|[^\p{L}\p{Nd}\s\p{Pd}]/gu
const word = /^[\p{L}\p{Nd}]+$/u

export function countActivityTokens(content: string): number {
  const text = content.normalize('NFC').toLowerCase().replace(discordMarkup, ' ')
  let total = 0
  let previousWord = ''

  for (const [part] of text.matchAll(parts)) {
    if (!word.test(part)) {
      previousWord = ''
      continue
    }

    if (part === previousWord) continue

    total += new Set(part).size
    previousWord = part
  }

  return total
}
