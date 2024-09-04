import { SlashCommandBuilder } from "discord.js";

import { Command } from "..";

const builder = new SlashCommandBuilder().setName("addgame").setDescription("Add a game to the database.");
builder.addStringOption(option => option.setName("name").setDescription("The name of the game to add."));

export const addGame: Command = {
  builder: new SlashCommandBuilder().setName("addgame").setDescription("Add a game to the database."),
  execute: async (interaction) => {
    await interaction.reply("Game added!");
  }
}
