import { APIEmbedField, InteractionContextType, MessageFlags, SlashCommandBuilder } from "discord.js";

import { Command, prisma } from "..";

const builder = new SlashCommandBuilder()
  .setName("whatshouldweplay")
  .setDescription("Give me a game to play with the given people.")
  .setContexts(InteractionContextType.Guild);

builder.addStringOption(option =>
  option.setName("players")
    .setDescription("Names of the players participating.")
    .setRequired(true),
);

builder.addBooleanOption(option =>
  option.setName("ignoremaxplayers")
    .setDescription("Ignore max player constraints when searching for a game."),
);

export const whatShouldWePlay: Command = {
  builder,
  execute: async (interaction) => {
    const rawPlayers = interaction.options.getString("players");
    const ignoreMaxPlayers = interaction.options.getBoolean("ignoremaxplayers");
    const matchedPlayers = rawPlayers?.match(/<@[^&]([^>]+)/g);

    if (!matchedPlayers) {
      await interaction.reply("You need to provide a list of players.");
      return;
    }

    const guild = interaction.guild;
    if (!guild) {
      await interaction.reply({
        content: "This command can only be used in a server.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const discordMembers = await Promise.all(matchedPlayers.map(player => guild.members.fetch(player.slice(2))));

    const totalRatings = await prisma.rating.groupBy({
      _avg: { score: true },
      by: "gameId",
      orderBy: { _avg: { score: "desc" } },
      take: 1,
      where: {
        game: {
          maxPlayers: ignoreMaxPlayers ? undefined : { gte: matchedPlayers.length },
          minPlayers: { lte: matchedPlayers.length },
          released: true,
        },
        user: { discordId: { in: discordMembers.map(member => member.user.id) } },
      },
    });

    if (totalRatings[0]._avg.score === null) {
      await interaction.reply({
        content: "No ratings found for the given number of players.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const game = await prisma.game.findUnique({
      include: { gameResource: true },
      where: { id: totalRatings[0].gameId },
    });
    if (!game) {
      await interaction.reply({ content: "Something went wrong... Please try again.", flags: MessageFlags.Ephemeral });
      return;
    }

    const userRatings = await prisma.rating.groupBy({
      _sum: { score: true },
      by: "userId",
      where: { gameId: game.id, user: { discordId: { in: discordMembers.map(member => member.user.id) } } },
    });
    const users = await prisma.user.findMany(
      { where: { discordId: { in: discordMembers.map(member => member.user.id) } } },
    );

    const fields: APIEmbedField[] = [];
    if (game.gameURL) fields.push({ name: "URL:", value: game.gameURL });
    fields.push({ inline: true, name: "Rating (Average)", value: totalRatings[0]._avg.score?.toFixed(2) });
    fields.push({ inline: true, name: "Free?", value: game.free ? "Yes" : "No" });
    fields.push({ inline: true, name: "Players", value: `${game.minPlayers} - ${game.maxPlayers}` });

    let ratingValues = "";
    discordMembers.forEach((member) => {
      const user = users.find(u => u.discordId === member.user.id);
      const score = userRatings.find(rating => rating.userId === user?.id)?._sum.score;
      ratingValues += `${score ?? "?"}: <@${member.user.id}>\n`;
    });
    fields.push({ name: "Your Ratings:", value: ratingValues });

    const numSmallerGames = await prisma.game.count({ where: { maxPlayers: { lt: matchedPlayers.length } } });
    const numLargerGames = await prisma.game.count({ where: { minPlayers: { gt: matchedPlayers.length } } });
    let footerText: string | undefined = undefined;
    if (numSmallerGames > 0) {
      footerText = `There are ${numSmallerGames} game${numSmallerGames === 1 ? "" : "s"} that support fewer players.`;
    }
    if (numLargerGames > 0) {
      if (numSmallerGames > 0) footerText += "\n";
      footerText = `There are ${numLargerGames} game${numLargerGames === 1 ? "" : "s"} that support more players.`;
    }

    await interaction.reply({
      embeds: [{
        description: game.gameResource?.description ?? undefined,
        fields,
        image: game.gameResource?.bannerImageURL ? { url: game.gameResource?.bannerImageURL } : undefined,
        footer: footerText ? { text: footerText } : undefined,
        title: game.name,
        thumbnail: game.gameResource?.thumbnailImageURL ? { url: game.gameResource?.thumbnailImageURL } : undefined,
        url: game.gameURL ?? undefined,
      }],
    });
  },
};
