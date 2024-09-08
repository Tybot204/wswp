import { APIEmbedField, SlashCommandBuilder } from "discord.js";

import { Command, prisma } from "..";

const builder = new SlashCommandBuilder().setName("whatshouldweplay").setDescription("Give me a game to play with the given people.");
builder.addStringOption(option => option.setName("players").setDescription("Names of the players participating."));

export const whatShouldWePlay: Command = {
  builder,
  execute: async (interaction) => {
    const rawPlayers = interaction.options.getString("players");
    const matchedPlayers = rawPlayers?.match(/<@[^&]([^>]+)/g);

    if (!matchedPlayers) {
      await interaction.reply("You need to provide a list of players.");
      return;
    }

    const guild = interaction.guild;
    if (!guild) {
      await interaction.reply("This command can only be used in a server.");
      return;
    }

    const discordMembers = await Promise.all(matchedPlayers.map(player => guild.members.fetch(player.slice(2))));

    const totalRatings = await prisma.rating.groupBy({
      _avg: { score: true },
      by: "gameId",
      orderBy: { _avg: { score: "desc" } },
      take: 1,
      where: {
        game: { numPlayers: { gte: matchedPlayers.length } },
        user: { discordId: { in: discordMembers.map(member => member.user.id) } },
      },
    });

    if (totalRatings[0]._avg.score === null) {
      await interaction.reply("No ratings found for the given number of players.");
      return;
    }

    const game = await prisma.game.findUnique({ where: { id: totalRatings[0].gameId } });
    if (!game) {
      await interaction.reply("Game not found. This is a bug if you are reading this.");
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
    fields.push({ inline: true, name: "Average Rating:", value: totalRatings[0]._avg.score?.toString() });
    fields.push({ inline: true, name: "Number of Players:", value: game.numPlayers.toString() });

    let ratingValues = "";
    discordMembers.forEach((member) => {
      const user = users.find(u => u.discordId === member.user.id);
      const score = userRatings.find(rating => rating.userId === user?.id)?._sum.score;
      ratingValues += `${score ?? "?"}: <@${member.user.id}>\n`;
    });
    fields.push({ name: "Your Ratings:", value: ratingValues });

    const numExtraGames = await prisma.game.count({ where: { numPlayers: { lt: matchedPlayers.length } } });
    const footerText = numExtraGames == 1 ? "1 game that supports fewer players." : `${numExtraGames} games that support fewer players.`;

    await interaction.reply({
      embeds: [{
        description: game.description ?? undefined,
        fields,
        image: game.bannerImageURL ? { url: game.bannerImageURL } : undefined,
        footer: numExtraGames > 0 ? { text: footerText } : undefined,
        title: game.name,
        thumbnail: game.thumbnailImageURL ? { url: game.thumbnailImageURL } : undefined,
        url: game.gameURL ?? undefined,
      }],
    });
  },
};
