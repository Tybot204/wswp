import {
  APIEmbed,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  InteractionContextType,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";

import { Command, prisma } from "..";
import {
  getGamesByAvgRating,
  getRatedGamesByAvgRating,
  getRatedGamesByAvgRatingCount,
} from "../../generated/prisma/sql";

const builder = new SlashCommandBuilder()
  .setName("listgames")
  .setDescription("List all games added.")
  .setContexts(InteractionContextType.Guild);

builder.addStringOption(option =>
  option.setName("ratedby")
    .setDescription("Filter games to those rated by these users.")
    .setRequired(false),
);

const contentBuilder = (totalGames: number, page: number): string => {
  const maxPage = Math.ceil(totalGames / 5);
  return `Searching all games...\n\nTotal games found: ${totalGames}\nDisplaying page ${page} of ${maxPage}:\n‎`;
};

const gameEmbedBuilder = async (game: getGamesByAvgRating.Result): Promise<APIEmbed> => {
  return {
    fields: [
      {
        inline: true,
        name: "Rating (Average)",
        value: game.avg_score?.toFixed(2) || "No ratings yet",
      },
      { inline: true, name: "Players", value: `${game.min_players} - ${game.max_players}` },
    ],
    title: game.name,
    url: game.game_url ?? undefined,
  };
};

export const listGames: Command = {
  builder,
  execute: async (interaction) => {
    const guildId = interaction.guildId;
    const guild = interaction.guild;
    if (!guildId || !guild) {
      await interaction.reply({ content: "This command can only be used in a server.", flags: MessageFlags.Ephemeral });
      return;
    };

    const rawUsers = interaction.options.getString("ratedby");
    const matchedUsers = rawUsers?.match(/<@[^&]([^>]+)/g);

    let games: getGamesByAvgRating.Result[] = [];
    let userIds: string[] = [];
    if (matchedUsers) {
      const discordMembers = await Promise.all(matchedUsers.map(player => guild.members.fetch(player.slice(2))));
      userIds = discordMembers.map(member => member.user.id);

      games = await prisma.$queryRawTyped(getRatedGamesByAvgRating(guildId, userIds, 1));
    } else {
      games = await prisma.$queryRawTyped(getGamesByAvgRating(guildId, 1));
    }

    if (games.length === 0) {
      await interaction.reply({
        content: "No games found. Type `/addgame` to add one!", flags: MessageFlags.Ephemeral,
      });
      return;
    };

    const totalGames = userIds.length === 0
      ? await prisma.game.count({ where: { guildId } })
      : Number((await prisma.$queryRawTyped(getRatedGamesByAvgRatingCount(guildId, userIds)))[0].count);

    const buttonBack = new ButtonBuilder()
      .setCustomId("back")
      .setEmoji({ name: "⬅️" })
      .setLabel("Back")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true);
    const buttonNext = new ButtonBuilder()
      .setCustomId("next")
      .setEmoji({ name: "➡️" })
      .setLabel("Next")
      .setStyle(ButtonStyle.Primary);

    const nextGame = games[5];
    if (nextGame) games.pop();

    if (!nextGame) buttonNext.setDisabled(true);

    const reply = await interaction.reply({
      content: contentBuilder(totalGames, 1),
      components: [{ components: [buttonBack, buttonNext], type: ComponentType.ActionRow }],
      embeds: await Promise.all(games.map(game => gameEmbedBuilder(game))),
      flags: MessageFlags.Ephemeral,
    });

    let currentPage = 1;
    while (true) {
      try {
        const listChoice = await reply.awaitMessageComponent({
          filter: i => i.user.id === interaction.user.id, time: 30000,
        });

        currentPage = listChoice.customId === "next" ? currentPage + 1 : currentPage - 1;

        if (matchedUsers) {
          games = await prisma.$queryRawTyped(getRatedGamesByAvgRating(guildId, userIds, currentPage));
        } else {
          games = await prisma.$queryRawTyped(getGamesByAvgRating(guildId, currentPage));
        }

        const nextGame = games[5];
        if (nextGame) games.pop();

        buttonBack.setDisabled(currentPage <= 1);
        buttonNext.setDisabled(!nextGame);

        await listChoice.update({
          content: contentBuilder(totalGames, currentPage),
          components: [{ components: [buttonBack, buttonNext], type: ComponentType.ActionRow }],
          embeds: await Promise.all(games.map(game => gameEmbedBuilder(game))),
        });
      } catch {
        await reply.edit({ content: "List timed out. Type `/listgames` again to restart.", components: [] });
        break;
      }
    }
  },
};
