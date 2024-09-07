if (process.env.NODE_ENV === "development") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("dotenv").config();
}

import { PrismaClient } from "@prisma/client";
import { ChatInputCommandInteraction, Client, Events, GatewayIntentBits, REST, Routes, SlashCommandBuilder } from "discord.js";

import { addGame } from "./commands/addGame";
import { listGames } from "./commands/listGames";

import { registerUser } from "./util/registerUser";

export interface Command {
  builder: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

export const prisma = new PrismaClient();

const client = new Client({ intents: GatewayIntentBits.Guilds });

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Logged in as ${readyClient.user?.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = interaction.commandName;
  switch (command) {
    case "addgame":
      await registerUser(interaction.user.id, interaction.user.displayName);
      await addGame.execute(interaction);
      break;
    case "listgames":
      await listGames.execute(interaction);
      break;
    default:
      break;
  };
});

client.login(process.env.DISCORD_TOKEN);

// Register all application commands
const rest = new REST().setToken(process.env.DISCORD_TOKEN!);
(async () => {
  try {
    await rest.put(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID!),
      { body: [addGame.builder.toJSON(), listGames.builder.toJSON()] },
    );
    console.log("Successfully registered application commands.");
  } catch (error) {
    console.error(error);
  }
})();
