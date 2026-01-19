import type { Game, Prisma } from "database";

import { prisma } from "database";
import {
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  InteractionContextType,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";

import type { Command } from "..";

import { gameDetailsEmbedBuilder } from "../util/embedTemplates";
import { gameAutocomplete } from "../util/gameAutocomplete";

type GameWithGameResource = Prisma.GameGetPayload<{ include: { gameResource: true } }>;

const builder = new SlashCommandBuilder()
  .setName("removegame")
  .setDescription("Remove a game and all associated ratings.")
  .setContexts(InteractionContextType.Guild);

builder.addStringOption(option =>
  option.setName("game")
    .setDescription("The game to remove.")
    .setRequired(true)
    .setAutocomplete(true),
);

export const removeGame: Command = {
  autocomplete: gameAutocomplete,
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

    const gameNameOrID = interaction.options.getString("game");

    // Ensure required options are provided. This should never happen.
    if (!gameNameOrID) return;

    let game: GameWithGameResource | undefined;
    try {
      game = await prisma.game.delete({
        include: { gameResource: true },
        where: { id: gameNameOrID },
      });
      await interaction.reply(`${game.name} has been removed.`);
    } catch {
      const games = await prisma.game.findMany({
        include: { gameResource: true },
        where: { name: gameNameOrID },
      });

      game = games.shift();

      if (!game) {
        await interaction.reply({
          content: `Could not find game "${gameNameOrID}". Try selecting from the autocomplete options.`,
          flags: MessageFlags.Ephemeral,
        });
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
        embeds: [gameDetailsEmbedBuilder(game, "Remove this game?")],
        flags: MessageFlags.Ephemeral,
      });

      const removedGames: Game[] = [];
      while (true) {
        try {
          const removeChoice = await reply.awaitMessageComponent({
            filter: i => i.user.id === interaction.user.id, time: 30000,
          });

          if (removeChoice.customId === "yes") {
            await prisma.game.delete({ where: { id: game.id } });
            removedGames.push(game);
          }

          game = games.shift();
          if (!game) {
            let content = "Finished reviewing all games for removal!";
            if (removedGames.length > 0) {
              content += "\n\nRemoved games:";
              removedGames.forEach(g => content += `\n${g.name} - (Players: ${g.minPlayers} - ${g.maxPlayers})`);
            }

            await removeChoice.update({ components: [], content, embeds: [] });
            break;
          }

          await removeChoice.update({
            embeds: [gameDetailsEmbedBuilder(game, "Remove this game?")],
          });
        } catch {
          await reply.edit({
            components: [],
            content: "Removal timed out. Type `/removegame` again to resume.",
            embeds: [],
          });
          break;
        }
      }
    }
  },
};
