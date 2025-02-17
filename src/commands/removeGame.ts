import { InteractionContextType, SlashCommandBuilder } from "discord.js";

import { Command, prisma } from "..";

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
  builder,
  execute: async (interaction) => {
    const guildId = interaction.guildId;
    if (!guildId) {
      await interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });
      return;
    }

    const id = interaction.options.getString("game");

    // Ensure required options are provided. This should never happen.
    if (!id) return;

    let game;
    try {
      game = await prisma.game.delete({ where: { id } });
    } catch {
      await interaction.reply({ content: `Could not find game "${id}". Try selecting from the autocomplete options.`, ephemeral: true });
      return;
    }

    await interaction.reply(`${game.name} has been removed.`);
  },
  autocomplete: async (interaction) => {
    const guildId = interaction.guildId;
    if (!guildId) return;

    const focusedValue = interaction.options.getFocused();
    const games = await prisma.game.findMany({
      where: { guildId, name: { contains: focusedValue, mode: "insensitive" } },
    });

    await interaction.respond(games.map(game => ({ name: game.name, value: game.id })));
  },
};
