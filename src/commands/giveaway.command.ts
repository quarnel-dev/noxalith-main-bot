import { readFile } from 'node:fs/promises'

import { AttachmentBuilder, Command, Declare, Options, SubCommand, createStringOption } from 'seyfert'
import type { CommandContext } from 'seyfert'

import { buildGiveawayCard } from '#features/giveaways/buildGiveawayCard'
import { giveawayPrizeChoices, getGiveawayPrize } from '#features/giveaways/giveawayPrizes'
import { giveawayRequirementChoices, getGiveawayRule } from '#features/giveaways/giveawayRequirements'
import { createGiveaway, openGiveaway } from '#repositories/giveawayRepository'

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

    let messageId: string

    try {
      const attachment = prizeTemplate.attachment
      const files = attachment
        ? [new AttachmentBuilder().setName(attachment.name).setFile('buffer', await readFile(attachment.path))]
        : []

      const message = await ctx.client.messages.write(ctx.channelId, {
        ...buildGiveawayCard(giveaway, true),
        files,
      })

      messageId = message.id
    } catch (error) {
      ctx.client.logger.error('Не удалось опубликовать карточку розыгрыша', error)
      await ctx.editResponse({ content: 'Не удалось создать розыгрыш' })
      return
    }

    try {
      await createGiveaway({
        ...giveaway,
        messageId,
        guildId,
        channelId: ctx.channelId,
        organizerId: ctx.author.id,
      })
    } catch (error) {
      ctx.client.logger.error(`Не удалось записать розыгрыш ${messageId}`, error)

      try {
        await ctx.client.messages.delete(messageId, ctx.channelId)
      } catch (cleanupError) {
        ctx.client.logger.error(`Не удалось удалить неактивную карточку ${messageId}`, cleanupError)
      }

      await ctx.editResponse({ content: 'Не удалось создать розыгрыш' })
      return
    }

    try {
      await ctx.client.messages.edit(messageId, ctx.channelId, buildGiveawayCard(giveaway, false))
      await openGiveaway(messageId)

      await ctx.editResponse({ content: 'Розыгрыш запущен' })
    } catch (error) {
      ctx.client.logger.error(`Не удалось сразу открыть розыгрыш ${messageId}`, error)
      await ctx.editResponse({
        content: 'Карточка создана, но приём заявок пока не открыт. Бот повторит попытку автоматически',
      })
    }
  }
}

@Declare({
  name: 'giveaway',
  description: 'Управление розыгрышами',
  defaultMemberPermissions: ['Administrator'],
})
@Options([GiveawayStartCommand])
export default class GiveawayCommand extends Command {}
