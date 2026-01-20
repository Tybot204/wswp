import type { APIEmbedField } from "discord.js";

import { getWhatShouldWePlay, prisma } from "database";
import {
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  InteractionContextType,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";

import type { Command } from "..";

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

builder.addBooleanOption(option =>
  option.setName("ignoreminplayers")
    .setDescription("Ignore min player constraints when searching for a game."),
);

export const whatShouldWePlay: Command = {
  builder,
  execute: async (interaction) => {
    const rawPlayers = interaction.options.getString("players");
    const ignoreMaxPlayers = interaction.options.getBoolean("ignoremaxplayers");
    const ignoreMinPlayers = interaction.options.getBoolean("ignoreminplayers");
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

    const games = await prisma.$queryRawTyped(
      getWhatShouldWePlay(
        guild.id,
        discordMembers.map(member => member.user.id),
        !!ignoreMaxPlayers,
        !!ignoreMinPlayers,
        1,
      ),
    );

    let game = games.shift();
    if (!game) {
      await interaction.reply({ content: "No games found. Add one with `/addgame`.", flags: MessageFlags.Ephemeral });
      return;
    }

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

    if (games.length === 0) buttonNext.setDisabled(true);

    const userRatings = await prisma.rating.groupBy({
      _sum: { score: true },
      by: "userId",
      where: { gameId: game.id, user: { discordId: { in: discordMembers.map(member => member.user.id) } } },
    });
    const users = await prisma.user.findMany(
      { where: { discordId: { in: discordMembers.map(member => member.user.id) } } },
    );

    const fields: APIEmbedField[] = [];
    if (game.game_url) fields.push({ name: "URL:", value: game.game_url });
    fields.push({ inline: true, name: "Rating (Average)", value: game.avg_score?.toFixed(2) ?? "0" });
    fields.push({ inline: true, name: "Free?", value: game.free ? "Yes" : "No" });
    fields.push({ inline: true, name: "Players", value: `${game.min_players} - ${game.max_players}` });

    let ratingValues = "";
    discordMembers.forEach((member) => {
      const user = users.find(u => u.discordId === member.user.id);
      const score = userRatings.find(rating => rating.userId === user?.id)?._sum.score;
      ratingValues += `${score ?? "?"}: <@${member.user.id}>\n`;
    });
    fields.push({ name: "Your Ratings:", value: ratingValues });

    const numSmallerGames = await prisma.game.count({
      where: { guildId: guild.id, maxPlayers: { lt: matchedPlayers.length } },
    });
    const numLargerGames = await prisma.game.count({
      where: { guildId: guild.id, minPlayers: { gt: matchedPlayers.length } },
    });
    let footerText: string | undefined = undefined;
    if (numSmallerGames > 0) {
      footerText = `There are ${numSmallerGames} game${numSmallerGames === 1 ? "" : "s"} that support fewer players.`;
    }
    if (numLargerGames > 0) {
      if (numSmallerGames > 0) footerText += "\n";
      footerText = `There are ${numLargerGames} game${numLargerGames === 1 ? "" : "s"} that support more players.`;
    }

    const reply = await interaction.reply({
      components: [{ components: [buttonBack, buttonNext], type: ComponentType.ActionRow }],
      embeds: [{
        description: game.description ?? undefined,
        fields,
        footer: footerText ? { text: footerText } : undefined,
        image: game.banner_image_url ? { url: game.banner_image_url } : undefined,
        thumbnail: game.thumbnail_image_url ? { url: game.thumbnail_image_url } : undefined,
        title: game.name,
        url: game.game_url ?? undefined,
      }],
    });

    let currentPage = 1;
    while (true) {
      try {
        const choice = await reply.awaitMessageComponent({
          filter: i => i.user.id === interaction.user.id, time: 30000,
        });

        currentPage = choice.customId === "next" ? currentPage + 1 : currentPage - 1;

        const games = await prisma.$queryRawTyped(
          getWhatShouldWePlay(
            guild.id,
            discordMembers.map(member => member.user.id),
            !!ignoreMaxPlayers,
            !!ignoreMinPlayers,
            currentPage,
          ),
        );

        const nextGame = games.shift();
        game = nextGame ?? game;

        buttonBack.setDisabled(currentPage <= 1);
        buttonNext.setDisabled(games.length === 0);

        const userRatings = await prisma.rating.groupBy({
          _sum: { score: true },
          by: "userId",
          where: { gameId: game.id, user: { discordId: { in: discordMembers.map(member => member.user.id) } } },
        });
        const users = await prisma.user.findMany(
          { where: { discordId: { in: discordMembers.map(member => member.user.id) } } },
        );

        const fields: APIEmbedField[] = [];
        if (game.game_url) fields.push({ name: "URL:", value: game.game_url });
        fields.push({ inline: true, name: "Rating (Average)", value: game.avg_score?.toFixed(2) ?? "0" });
        fields.push({ inline: true, name: "Free?", value: game.free ? "Yes" : "No" });
        fields.push({ inline: true, name: "Players", value: `${game.min_players} - ${game.max_players}` });

        let ratingValues = "";
        discordMembers.forEach((member) => {
          const user = users.find(u => u.discordId === member.user.id);
          const score = userRatings.find(rating => rating.userId === user?.id)?._sum.score;
          ratingValues += `${score ?? "?"}: <@${member.user.id}>\n`;
        });
        fields.push({ name: "Your Ratings:", value: ratingValues });

        await choice.update({
          components: [{ components: [buttonBack, buttonNext], type: ComponentType.ActionRow }],
          embeds: [{
            description: game.description ?? undefined,
            fields,
            footer: footerText ? { text: footerText } : undefined,
            image: game.banner_image_url ? { url: game.banner_image_url } : undefined,
            thumbnail: game.thumbnail_image_url ? { url: game.thumbnail_image_url } : undefined,
            title: game.name,
            url: game.game_url ?? undefined,
          }],
        });
      } catch {
        await reply.edit({ components: [] });
        break;
      }
    }
  },
};
