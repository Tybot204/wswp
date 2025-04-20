import {
  APIEmbed,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  InteractionContextType,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";

import { Prisma } from "@prisma/client";

import { Command, prisma } from "..";

import { gameAutocomplete } from "../util/gameAutocomplete";
import { registerUser } from "../util/registerUser";

type GameWithGameResource = Prisma.GameGetPayload<{ include: { gameResource: true } }>;

const gameEmbedBuilder = (game: GameWithGameResource): APIEmbed => {
  return {
    description: game.gameResource?.description ?? undefined,
    fields: [
      { inline: true, name: "Players", value: `${game.minPlayers} - ${game.maxPlayers}` },
      { inline: true, name: "Free?", value: game.free ? "Yes" : "No" },
    ],
    footer: { text: "Rate the game from 1 to 5." },
    image: game.gameResource?.bannerImageURL ? { url: game.gameResource?.bannerImageURL } : undefined,
    title: game.name,
    thumbnail: game.gameResource?.thumbnailImageURL
      ? { url: game.gameResource?.thumbnailImageURL }
      : undefined,
    url: game.gameURL ?? undefined,
  };
};

const builder = new SlashCommandBuilder()
  .setName("ratesinglegame")
  .setDescription("Rate a single game for your current user.")
  .setContexts(InteractionContextType.Guild);

builder.addStringOption(option =>
  option
    .setName("name")
    .setDescription("The name of the game to re-rate.")
    .setRequired(true)
    .setAutocomplete(true),
);

export const rateSingleGame: Command = {
  builder,
  execute: async (interaction) => {
    const guildId = interaction.guildId;
    if (!guildId) {
      await interaction.reply({
        content: "This command can only be used in a server.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const user = await registerUser(interaction.user);

    const name = await interaction.options.getString("name");
    if (!name) return;

    let game;
    try {
      game = await prisma.game.findUnique({
        where: { id: name },
        include: {
          gameResource: true,
          ratings: {
            select: { score: true },
            where: { user: { discordId: user.id } },
          },
        },
      });
    } catch {
      await interaction.reply({
        content: `Could not find game "${name}". Try selecting from the autocomplete options.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (!game) {
      await interaction.reply({ content: "Game not found.", flags: MessageFlags.Ephemeral });
      return;
    }

    const buttonOne = new ButtonBuilder()
      .setCustomId("1")
      .setLabel("1")
      .setStyle(ButtonStyle.Danger);
    const buttonTwo = new ButtonBuilder()
      .setCustomId("2")
      .setLabel("2")
      .setStyle(ButtonStyle.Secondary);
    const buttonThree = new ButtonBuilder()
      .setCustomId("3")
      .setLabel("3")
      .setStyle(ButtonStyle.Secondary);
    const buttonFour = new ButtonBuilder()
      .setCustomId("4")
      .setLabel("4")
      .setStyle(ButtonStyle.Secondary);
    const buttonFive = new ButtonBuilder()
      .setCustomId("5")
      .setLabel("5")
      .setStyle(ButtonStyle.Success);

    const reply = await interaction.reply({
      components: [
        {
          components: [
            buttonOne,
            buttonTwo,
            buttonThree,
            buttonFour,
            buttonFive,
          ],
          type: ComponentType.ActionRow,
        },
      ],
      embeds: [gameEmbedBuilder(game)],
      flags: MessageFlags.Ephemeral,
    });

    try {
      const ratingChoice = await reply.awaitMessageComponent({
        filter: i => i.user.id === interaction.user.id,
        time: 30000,
      });

      await prisma.rating.upsert({
        create: {
          gameId: game.id,
          score: parseInt(ratingChoice.customId),
          userId: user.id,
        },
        update: { score: parseInt(ratingChoice.customId) },
        where: { gameId_userId: { gameId: game.id, userId: user.id } },
      });

      if (ratingChoice.customId != null) {
        await ratingChoice.update({
          content: "Successfully rated game!",
          components: [],
          embeds: [],
        });
      }
    } catch {
      await reply.edit({
        content: "Rating timed out. Type `/ratesinglegame` again to resume.",
        components: [],
        embeds: [],
      });
    }
  },

  autocomplete: gameAutocomplete,
};
