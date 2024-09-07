import { SlashCommandBuilder } from "discord.js";

import { Command, prisma } from "..";

const builder = new SlashCommandBuilder().setName("listgames").setDescription("List all games added.");

export const listGames: Command = {
  builder,
  execute: async (interaction) => {
    const games = await prisma.game.findMany();

    const reply = `**Game List:**\n${games.map(game => `${game.name} - ${game.numPlayers} players`).join("\n")}`;
    await interaction.reply(reply);
  },
};
