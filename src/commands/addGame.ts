import { SlashCommandBuilder } from "discord.js";

import { Command, prisma, steam } from "..";

import { registerUser } from "../util/registerUser";

interface GameData {
  createdById: string;
  guildId: string;
  name: string;
  numPlayers: number;

  bannerImageURL?: string;
  description?: string;
  isFree?: boolean;
  gameURL?: string;
  released?: boolean;
  thumbnailImageURL?: string;
}

interface SteamGameDetails {
  capsule_image: string;
  is_free: boolean;
  header_image: string;
  release_date: { coming_soon: boolean };
  short_description: string;
}

const builder = new SlashCommandBuilder().setName("addgame").setDescription("Add a game to the database.");

builder.addStringOption(option =>
  option.setName("name")
    .setDescription("The name of the game to add.")
    .setRequired(true),
);

builder.addIntegerOption(option =>
  option.setName("numplayers")
    .setDescription("The number of players the game supports.")
    .setRequired(true)
    .setMinValue(2),
);

builder.addStringOption(option =>
  option.setName("url")
    .setDescription("A URL to the game. Steam store pages will pull information about the game."),
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
      await interaction.reply("This command can only be used in a server.");
      return;
    }

    const user = await registerUser(interaction.user);

    const gameData: GameData = { createdById: user.id, guildId, name, numPlayers };

    const url = interaction.options.getString("url");
    if (url) {
      gameData.gameURL = url;

      const steamGameId = url.match(/(?:https?:\/\/store\.steampowered\.com\/app\/)(\d+)/)?.[1];
      if (steamGameId) {
        try {
          const response = await steam.getGameDetails(steamGameId) as unknown as SteamGameDetails;

          gameData.description = response.short_description;
          gameData.isFree = response.is_free;
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

    const game = await prisma.game.create({ data: gameData });

    await interaction.reply({
      embeds: [{
        description: game.description ?? undefined,
        fields: [
          { inline: true, name: "Released", value: game.released ? "Yes" : "No" },
          { inline: true, name: "Is Free?", value: game.isFree ? "Yes" : "No" },
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
