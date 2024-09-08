import { APIEmbed, ButtonBuilder, ButtonStyle, ComponentType, SlashCommandBuilder } from "discord.js";

import { Game } from "@prisma/client";

import { Command, prisma } from "..";

import { registerUser } from "../util/registerUser";

const gameEmbedBuilder = (game: Game): APIEmbed => {
  return {
    description: game.description ?? undefined,
    fields: [
      { inline: true, name: "Number of players", value: game.numPlayers.toString() },
      { inline: true, name: "Is free?", value: game.isFree ? "Yes" : "No" },
    ],
    footer: { text: "Rate the game from 1 to 5." },
    image: game.bannerImageURL ? { url: game.bannerImageURL } : undefined,
    title: game.name,
    thumbnail: game.thumbnailImageURL ? { url: game.thumbnailImageURL } : undefined,
    url: game.gameURL ?? undefined,
  };
};

const builder = new SlashCommandBuilder().setName("rategames").setDescription("Rate all unrated games for your current user.");

builder.addBooleanOption(option => option.setName("all").setDescription("Rate all games again and replace existing ratings."));

export const rateGames: Command = {
  builder,
  execute: async (interaction) => {
    const guildId = interaction.guildId;
    if (!guildId) {
      await interaction.reply("This command can only be used in a server.");
      return;
    }

    const user = await registerUser(interaction.user);

    const rateAll = interaction.options.getBoolean("all") ?? false;
    const gameWhere = rateAll ? { guildId } : { guildId, ratings: { none: { userId: user.id } } };
    const games = await prisma.game.findMany({ where: gameWhere });

    const buttonOne = new ButtonBuilder().setCustomId("1").setLabel("1").setStyle(ButtonStyle.Danger);
    const buttonTwo = new ButtonBuilder().setCustomId("2").setLabel("2").setStyle(ButtonStyle.Secondary);
    const buttonThree = new ButtonBuilder().setCustomId("3").setLabel("3").setStyle(ButtonStyle.Secondary);
    const buttonFour = new ButtonBuilder().setCustomId("4").setLabel("4").setStyle(ButtonStyle.Secondary);
    const buttonFive = new ButtonBuilder().setCustomId("5").setLabel("5").setStyle(ButtonStyle.Success);

    let game = games.shift();

    if (!game) {
      await interaction.reply("No new games to rate.");
      return;
    }

    const reply = await interaction.reply({
      components: [{ components: [buttonOne, buttonTwo, buttonThree, buttonFour, buttonFive], type: ComponentType.ActionRow }],
      embeds: [gameEmbedBuilder(game)],
      ephemeral: true,
    });

    while (true) {
      try {
        const ratingChoice = await reply.awaitMessageComponent({ filter: i => i.user.id === interaction.user.id, time: 30000 });

        await prisma.rating.upsert({
          create: { gameId: game.id, score: parseInt(ratingChoice.customId), userId: user.id },
          update: { score: parseInt(ratingChoice.customId) },
          where: { gameId_userId: { gameId: game.id, userId: user.id } },
        });

        game = games.shift();
        if (!game) {
          await ratingChoice.update({ content: "Finished rating all games!", components: [], embeds: [] });
          break;
        }

        await ratingChoice.update({ embeds: [gameEmbedBuilder(game)] });
      } catch {
        await reply.edit({ content: "Rating timed out. Type `/rategames` again to resume.", components: [], embeds: [] });
        break;
      }
    }
  },
};
