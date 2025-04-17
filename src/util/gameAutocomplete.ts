import { AutocompleteInteraction } from "discord.js";

import { prisma } from "..";

export const gameAutocomplete = async (interaction: AutocompleteInteraction) => {
  const guildId = interaction.guildId;
  if (!guildId) return;

  const focusedValue = interaction.options.getFocused();
  const games = await prisma.game.findMany({
    orderBy: { name: "asc" },
    take: 25,
    where: { guildId, name: { contains: focusedValue, mode: "insensitive" } },
  });

  await interaction.respond(games.map(game => ({
    name: `${game.name} - (Players: ${game.numPlayers})`, value: game.id,
  })));
};
