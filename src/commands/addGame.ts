import { SlashCommandBuilder } from "discord.js";

import { Command, prisma } from "..";

import { registerUser } from "../util/registerUser";

const builder = new SlashCommandBuilder().setName("addgame").setDescription("Add a game to the database.");
builder.addStringOption(option => option.setName("name").setDescription("The name of the game to add."));
builder.addIntegerOption(option => option.setName("numplayers").setDescription("The number of players the game supports."));

export const addGame: Command = {
  builder,
  execute: async (interaction) => {
    const name = interaction.options.getString("name");
    if (!name) {
      await interaction.reply("You must provide a name for the game.");
      return;
    };

    const numPlayers = interaction.options.getInteger("numplayers");
    if (!numPlayers) {
      await interaction.reply("You must provide the number of players the game supports.");
      return;
    };

    const user = await registerUser(interaction.user);
    await prisma.game.create({ data: { name, numPlayers, createdById: user.id } });

    await interaction.reply(`${name} added!`);
  },
};
