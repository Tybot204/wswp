import {
  APIEmbed,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  SlashCommandBuilder,
} from "discord.js";

import { Game } from "@prisma/client";

import { Command, prisma } from "..";

import { registerUser } from "../util/registerUser";

const gameEmbedBuilder = (game: Game): APIEmbed => {
  return {
    description: game.description ?? undefined,
    fields: [
      {
        inline: true,
        name: "Number of players",
        value: game.numPlayers.toString(),
      },
      { inline: true, name: "Is free?", value: game.isFree ? "Yes" : "No" },
    ],
    footer: { text: "Rate the game from 1 to 5." },
    image: game.bannerImageURL ? { url: game.bannerImageURL } : undefined,
    title: game.name,
    thumbnail: game.thumbnailImageURL
      ? { url: game.thumbnailImageURL }
      : undefined,
    url: game.gameURL ?? undefined,
  };
};

const builder = new SlashCommandBuilder()
  .setName("ratesinglegame")
  .setDescription("Rate a single game for your current user.");

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
      await interaction.reply("This command can only be used in a server.");
      return;
    }

    const user = await registerUser(interaction.user);

    const name = await interaction.options.getString("name");
    if (!name) return;

    let game;
    try {
      const game = await prisma.game.findUnique({
        where: { id: name },
        include: {
          ratings: {
            select: { score: true },
            where: { user: { discordId: user.id } },
          },
        },
      });
    } catch {
      await interaction.reply(`Could not find game "${id}". Try selecting from the autocomplete options.`);
      return;
    }

    if (!game) {
      await interaction.reply("Game not found.");
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
      ephemeral: true,
    });

    while (true) {
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
        break;
      }
    }
  },

  autocomplete: async (interaction) => {
    const guildId = interaction.guildId;
    if (!guildId) return;

    const focusedValue = interaction.options.getFocused();
    const games = await prisma.game.findMany({
      where: { guildId, name: { contains: focusedValue, mode: "insensitive" } },
    });

    await interaction.respond(
      games.map(game => ({ name: game.name, value: game.id })),
    );
  },
};
