if (process.env.NODE_ENV === "development") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("dotenv").config();
}

import { ChatInputCommandInteraction, Client, Events, GatewayIntentBits, REST, Routes, SlashCommandBuilder } from "discord.js"

import { addGame } from "./commands/addGame";

export interface Command {
  builder: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

const client = new Client({ intents: GatewayIntentBits.Guilds });

client.once(Events.ClientReady, readyClient => {
  console.log(`Logged in as ${readyClient.user?.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;
  await addGame.execute(interaction);
})

client.login(process.env.DISCORD_TOKEN);

const rest = new REST().setToken(process.env.DISCORD_TOKEN!);
(async () => {
  try {
    await rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID!), { body: [addGame.builder.toJSON()] });
    console.log("Successfully registered application commands.");
  } catch (error) {
    console.error(error);
  }
})();
