import { readFile } from 'node:fs/promises'

import { AttachmentBuilder, Command, Declare, Options, SubCommand, createStringOption } from 'seyfert'
import type { CommandContext } from 'seyfert'

import { buildGiveawayCard } from '#features/giveaways/buildGiveawayCard'
import { giveawayPrizeChoices, getGiveawayPrize } from '#features/giveaways/giveawayPrizes'
import { giveawayRequirementChoices, getGiveawayRule } from '#features/giveaways/giveawayRequirements'
import { createGiveaway } from '#repositories/giveawayRepository'

const options = {
  prize: createStringOption({
    description: 'Шаблон приза',
    required: true,
    choices: giveawayPrizeChoices,
  }),
  duration: createStringOption({
    description: 'Срок розыгрыша, например 30m, 6h или 14d',
    required: true,
  }),
  text: createStringOption({
    description: 'Название или описание приза на карточке',
    max_length: 256,
  }),
  requirements: createStringOption({
    description: 'Условие участия',
    choices: giveawayRequirementChoices,
  }),
}

const durationUnits = {
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
} as const

function parseEndsAt(duration: string): Date | null {
  const match = /^([1-9]\d*)(m|h|d)$/.exec(duration.trim().toLowerCase())
  if (!match) return null

  const unit = match[2] as keyof typeof durationUnits
  const endsAt = new Date(Date.now() + Number(match[1]) * durationUnits[unit])

  return Number.isNaN(endsAt.getTime()) ? null : endsAt
}

@Declare({
  name: 'start',
  description: 'Запустить розыгрыш в этом канале',
})
@Options(options)
class GiveawayStartCommand extends SubCommand {
  async run(ctx: CommandContext<typeof options>) {
    await ctx.deferReply(true)

    const guildId = ctx.guildId
    if (!guildId || !ctx.member?.permissions.strictHas('Administrator')) {
      await ctx.editResponse({ content: 'Запустить розыгрыш может только администратор' })
      return
    }

    const prizeId = ctx.options.prize
    const prizeText = ctx.options.text?.trim() ?? ''
    const endsAt = parseEndsAt(ctx.options.duration)
    const requirementId = ctx.options.requirements
    const prizeTemplate = getGiveawayPrize(prizeId)

    if (!prizeTemplate) {
      await ctx.editResponse({ content: 'Этот шаблон приза недоступен' })
      return
    }

    if (prizeTemplate.requiresText && !prizeText) {
      await ctx.editResponse({ content: 'Укажи название приза в поле `text`' })
      return
    }

    if (!endsAt) {
      await ctx.editResponse({ content: 'Укажи срок в формате `30m`, `6h` или `14d`' })
      return
    }

    if (requirementId && !getGiveawayRule(requirementId)) {
      await ctx.editResponse({ content: 'Это условие участия недоступно' })
      return
    }

    const giveaway = {
      prizeId,
      prizeText,
      endsAt,
      requirements: requirementId ? [requirementId] : [],
    }

    try {
      const card = buildGiveawayCard(giveaway, true)
      const attachment = prizeTemplate.attachment
      const files = attachment
        ? [new AttachmentBuilder().setName(attachment.name).setFile('buffer', await readFile(attachment.path))]
        : []

      const message = await ctx.client.messages.write(ctx.channelId, {
        ...card,
        files,
      })

      await createGiveaway({
        ...giveaway,
        messageId: message.id,
        guildId,
        channelId: ctx.channelId,
      })

      await ctx.client.messages.edit(message.id, ctx.channelId, buildGiveawayCard(giveaway, false))
    } catch (error) {
      ctx.client.logger.error('Не удалось запустить розыгрыш', error)
      await ctx.editResponse({ content: 'Не удалось открыть приём заявок' })
      return
    }

    await ctx.editResponse({ content: 'Розыгрыш запущен' })
  }
}

@Declare({
  name: 'giveaway',
  description: 'Управление розыгрышами',
  defaultMemberPermissions: ['Administrator'],
})
@Options([GiveawayStartCommand])
export default class GiveawayCommand extends Command {}
