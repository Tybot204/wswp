import { ButtonBuilder, ButtonStyle, ComponentType, SlashCommandBuilder } from "discord.js";

import { Command, prisma } from "..";

import { registerUser } from "../util/registerUser";

const builder = new SlashCommandBuilder().setName("rategames").setDescription("Rate all unrated games for your current user.");

export const rateGames: Command = {
  builder,
  execute: async (interaction) => {
    const user = await registerUser(interaction.user);
    const games = await prisma.game.findMany({ where: { ratings: { none: { userId: user.id } } } });

    const buttonOne = new ButtonBuilder().setCustomId("1").setLabel("1").setStyle(ButtonStyle.Danger);
    const buttonTwo = new ButtonBuilder().setCustomId("2").setLabel("2").setStyle(ButtonStyle.Secondary);
    const buttonThree = new ButtonBuilder().setCustomId("3").setLabel("3").setStyle(ButtonStyle.Secondary);
    const buttonFour = new ButtonBuilder().setCustomId("4").setLabel("4").setStyle(ButtonStyle.Secondary);
    const buttonFive = new ButtonBuilder().setCustomId("5").setLabel("5").setStyle(ButtonStyle.Success);

    let game = games.shift();

    if (!game) {
      await interaction.reply("No games to rate.");
      return;
    }

    const reply = await interaction.reply({
      components: [{ components: [buttonOne, buttonTwo, buttonThree, buttonFour, buttonFive], type: ComponentType.ActionRow }],
      content: `Please rate ${game.name}`,
      ephemeral: true,
    });

    while (true) {
      try {
        const ratingChoice = await reply.awaitMessageComponent({ filter: i => i.user.id === interaction.user.id, time: 15000 });

        await prisma.rating.create({ data: { gameId: game.id, score: parseInt(ratingChoice.customId), userId: user.id } });

        game = games.shift();
        if (!game) {
          await ratingChoice.update({ content: "Finished rating all games.", components: [] });
          break;
        }

        await ratingChoice.update({ content: `Please rate ${game.name}` });
      } catch {
        await reply.edit({ content: "Timed out. Run the /rategames command again to resume.", components: [] });
        break;
      }
    }
  },
};
