import { InteractionContextType, MessageFlags, SlashCommandBuilder } from "discord.js";

import { Command, prisma, steam } from "..";
import { GamePlatform, Prisma } from "../../generated/prisma";
import { gameDetailsEmbedBuilder } from "../util/embedTemplates";
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
  option.setName("maxplayers")
    .setDescription("The maximum number of players the game supports.")
    .setRequired(true)
    .setMinValue(1),
);

builder.addIntegerOption(option =>
  option.setName("minplayers")
    .setDescription("The minimum number of players the game supports.")
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
    const maxPlayers = interaction.options.getInteger("maxplayers");

    // Ensure required options are provided. This should never happen.
    if (!name || !maxPlayers) return;

    const guildId = interaction.guildId;
    if (!guildId) {
      await interaction.reply({ content: "This command can only be used in a server.", flags: MessageFlags.Ephemeral });
      return;
    }

    const user = await registerUser(interaction.user);

    const gameData: Prisma.GameCreateInput = {
      createdBy: { connect: { id: user.id } },
      guildId,
      maxPlayers,
      minPlayers: interaction.options.getInteger("minplayers") ?? 1,
      name,
    };

    const url = interaction.options.getString("url");
    if (url) {
      gameData.gameURL = url;

      const steamGameId = parseInt(url.match(/(?:https?:\/\/store\.steampowered\.com\/app\/)(\d+)/)?.[1] || "");
      if (steamGameId) {
        const gameResource = await prisma.gameResource.findUnique({
          where: { externalIdPlatform: { externalId: steamGameId.toString(), platform: GamePlatform.STEAM } },
        });

        if (gameResource) {
          gameData.gameResource = { connect: { id: gameResource.id } };
          gameData.free = gameResource.free;
          gameData.released = gameResource.released;
        } else {
          try {
            const response = await steam.getGameDetails(steamGameId) as unknown as SteamGameDetails;

            gameData.gameResource = {
              create: {
                bannerImageURL: response.header_image,
                description: response.short_description,
                externalId: steamGameId.toString(),
                free: response.is_free,
                platform: GamePlatform.STEAM,
                released: !response.release_date.coming_soon,
                thumbnailImageURL: response.capsule_image,
              },
            };
            gameData.free = response.is_free;
            gameData.released = !response.release_date.coming_soon;
          } catch {
            // Do nothing. Steam integration is for bonus information and is not required.
            // TODO: Should we alert the user that the Steam integration failed?
            //       What if they provided a non-Steam URL?
          }
        }
      }
    }

    // Override Steam integration data if user provided released or free
    const released = interaction.options.getBoolean("released");
    if (released !== null) gameData.released = released;

    const free = interaction.options.getBoolean("free");
    if (free !== null) gameData.free = free;

    const game = await prisma.game.create({ data: gameData, include: { gameResource: true } });

    await interaction.reply({
      embeds: [gameDetailsEmbedBuilder(game, "Game successfully added.")],
    });
  },
};
