import { MediaGallery, MediaGalleryItem, TextDisplay } from 'seyfert'

import type { GiveawayPrize } from '../giveawayPrizes.ts'

const banner = {
  name: 'nitro.png',
  path: new URL('../../../../assets/giveaways/discordnitro.png', import.meta.url),
}

const prizeName = 'Discord Nitro Full на 1 месяц'

export const nitroPrize = {
  id: 'nitro',
  label: 'Discord Nitro',
  prizeName,
  attachment: banner,

  render(card, text) {
    const gallery = new MediaGallery().addItems(
      new MediaGalleryItem().setMedia(`attachment://${banner.name}`).setDescription('Баннер розыгрыша Discord Nitro')
    )

    card.addComponents(gallery, new TextDisplay().setContent(`## Розыгрыш Discord Nitro\n**Приз:** ${prizeName}`))
  },
} satisfies GiveawayPrize
