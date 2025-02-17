import { InteractionContextType, SlashCommandBuilder } from "discord.js";

import { Command, prisma } from "..";

const builder = new SlashCommandBuilder()
  .setName("listgames")
  .setDescription("List all games added.")
  .setContexts(InteractionContextType.Guild);

export const listGames: Command = {
  builder,
  execute: async (interaction) => {
    const guildId = interaction.guildId;
    if (!guildId) {
      await interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });
      return;
    }

    const games = await prisma.game.findMany({ where: { guildId } });

    const reply = `**Game List:**\n${games.map(game => `${game.name} - ${game.numPlayers} players`).join("\n")}`;
    await interaction.reply(reply);
  },
};
