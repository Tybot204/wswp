import { APIEmbed, ButtonBuilder, ButtonStyle, ComponentType, SlashCommandBuilder } from "discord.js";

import { Game } from "@prisma/client";

import { Command, prisma } from "..";

const gameEmbedBuilder = (game: Game): APIEmbed => {
  return {
    description: game.description ?? undefined,
    fields: [
      { inline: true, name: "Number of players", value: game.numPlayers.toString() },
      { inline: true, name: "Is free?", value: game.isFree ? "Yes" : "No" },
    ],
    footer: { text: "Remove this game?" },
    image: game.bannerImageURL ? { url: game.bannerImageURL } : undefined,
    title: game.name,
    thumbnail: game.thumbnailImageURL ? { url: game.thumbnailImageURL } : undefined,
    url: game.gameURL ?? undefined,
  };
};

const builder = new SlashCommandBuilder()
  .setName("removegame")
  .setDescription("Remove a game and all associated ratings.");

builder.addStringOption(option =>
  option.setName("game")
    .setDescription("The game to remove.")
    .setRequired(true)
    .setAutocomplete(true),
);

export const removeGame: Command = {
  builder,
  execute: async (interaction) => {
    const guildId = interaction.guildId;
    if (!guildId) {
      await interaction.reply("This command can only be used in a server.");
      return;
    }

    const gameNameOrID = interaction.options.getString("game");

    // Ensure required options are provided. This should never happen.
    if (!gameNameOrID) return;

    let game: Game | undefined;
    try {
      game = await prisma.game.delete({ where: { id: gameNameOrID } });
      await interaction.reply(`${game.name} has been removed.`);
    } catch {
      const games = await prisma.game.findMany({ where: { name: gameNameOrID } });

      game = games.shift();

      if (!game) {
        await interaction.reply(`Could not find game "${gameNameOrID}". Try selecting from the autocomplete options.`);
        return;
      }

      if (games.length === 0) {
        await prisma.game.delete({ where: { id: game.id } });
        await interaction.reply(`${game.name} has been removed.`);
        return;
      }

      const buttonNo = new ButtonBuilder().setCustomId("no").setLabel("No").setStyle(ButtonStyle.Danger);
      const buttonYes = new ButtonBuilder().setCustomId("yes").setLabel("Yes").setStyle(ButtonStyle.Success);

      const reply = await interaction.reply({
        components: [{ components: [buttonNo, buttonYes], type: ComponentType.ActionRow }],
        content: "Multiple games by that name found. Remove this game?",
        embeds: [gameEmbedBuilder(game)],
        ephemeral: true,
      });

      const removedGames: Game[] = [];
      while (true) {
        try {
          const removeChoice = await reply.awaitMessageComponent({ filter: i => i.user.id === interaction.user.id, time: 30000 });

          if (removeChoice.customId === "yes") {
            await prisma.game.delete({ where: { id: game.id } });
            removedGames.push(game);
          }

          game = games.shift();
          if (!game) {
            let content = "Finished reviewing all games for removal!";
            if (removedGames.length > 0) {
              content += "\n\nRemoved games:";
              removedGames.forEach(g => content += `\n${g.name} - ${g.numPlayers} Players`);
            }

            await removeChoice.update({ content, components: [], embeds: [] });
            return;
          }

          await removeChoice.update({ embeds: [gameEmbedBuilder(game)] });
        } catch {
          await reply.edit({ content: "Removal timed out. Type `/removegame` again to resume.", components: [], embeds: [] });
          return;
        }
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

    await interaction.respond(games.map(game => ({ name: `${game.name} - ${game.numPlayers} Players`, value: game.id })));
  },
};
