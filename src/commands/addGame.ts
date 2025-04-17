import { InteractionContextType, MessageFlags, SlashCommandBuilder } from "discord.js";

import { Prisma } from "@prisma/client";

import { Command, prisma, steam } from "..";

import { registerUser } from "../util/registerUser";

interface SteamGameDetails {
  capsule_image: string;
  is_free: boolean;
  header_image: string;
  release_date: { coming_soon: boolean };
  short_description: string;
}

const builder = new SlashCommandBuilder()
  .setName("addgame")
  .setDescription("Add a game to the database.")
  .setContexts(InteractionContextType.Guild);

builder.addStringOption(option =>
  option.setName("name")
    .setDescription("The name of the game to add.")
    .setRequired(true),
);

builder.addIntegerOption(option =>
  option.setName("numplayers")
    .setDescription("The number of players the game supports.")
    .setRequired(true)
    .setMinValue(1),
);

builder.addStringOption(option =>
  option.setName("url")
    .setDescription("A URL to the game. Steam store pages will pull information about the game."),
);

builder.addBooleanOption(option =>
  option.setName("released")
    .setDescription("Whether the game has been released. (Overrides Steam URL integration)"),
);

builder.addBooleanOption(option =>
  option.setName("free")
    .setDescription("Whether the game is free to play. (Overrides Steam URL integration)"),
);

export const addGame: Command = {
  builder,
  execute: async (interaction) => {
    const name = interaction.options.getString("name");
    const numPlayers = interaction.options.getInteger("numplayers");

    // Ensure required options are provided. This should never happen.
    if (!name || !numPlayers) return;

    const guildId = interaction.guildId;
    if (!guildId) {
      await interaction.reply({ content: "This command can only be used in a server.", flags: MessageFlags.Ephemeral });
      return;
    }

    const user = await registerUser(interaction.user);

    const gameData: Prisma.GameCreateInput = { createdBy: { connect: { id: user.id } }, guildId, name, numPlayers };

    const url = interaction.options.getString("url");
    if (url) {
      gameData.gameURL = url;

      const steamGameId = parseInt(url.match(/(?:https?:\/\/store\.steampowered\.com\/app\/)(\d+)/)?.[1] || "");
      if (steamGameId) {
        try {
          const response = await steam.getGameDetails(steamGameId) as unknown as SteamGameDetails;

          gameData.description = response.short_description;
          gameData.free = response.is_free;
          gameData.released = !response.release_date.coming_soon;
          gameData.bannerImageURL = response.header_image;
          gameData.thumbnailImageURL = response.capsule_image;
        } catch {
          // Do nothing. Steam integration is for bonus information and is not required.
          // TODO: Should we alert the user that the Steam integration failed?
          //       What if they provided a non-Steam URL?
        }
      }
    }

    // Override Steam integration data if user provided released or free
    const released = interaction.options.getBoolean("released");
    if (released !== null) gameData.released = released;

    const free = interaction.options.getBoolean("free");
    if (free !== null) gameData.free = free;

    const game = await prisma.game.create({ data: gameData });

    await interaction.reply({
      embeds: [{
        description: game.description ?? undefined,
        fields: [
          { inline: true, name: "Released?", value: game.released ? "Yes" : "No" },
          { inline: true, name: "Free?", value: game.free ? "Yes" : "No" },
          { inline: true, name: "Number of Players", value: game.numPlayers.toString() },
        ],
        footer: { text: "Game successfully added." },
        image: game.bannerImageURL ? { url: game.bannerImageURL } : undefined,
        title: game.name,
        thumbnail: game.thumbnailImageURL ? { url: game.thumbnailImageURL } : undefined,
        url: game.gameURL ?? undefined,
      }],
    });
  },
};
