if (process.env.NODE_ENV === "development") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("dotenv").config();
}

import { PrismaClient } from "@prisma/client";
import { ChatInputCommandInteraction, Client, Events, GatewayIntentBits, REST, Routes, SlashCommandBuilder } from "discord.js";

import { commandMap } from "./commands";

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
  if (interaction.isChatInputCommand()) {
    const command: Command | undefined = commandMap[interaction.commandName];
    if (!command) return;

    await command.execute(interaction);
  }
  // } else if (interaction.isButton()) {
  //   console.log(interaction);
  // }
});

client.login(process.env.DISCORD_TOKEN);

// Register all application commands
const rest = new REST().setToken(process.env.DISCORD_TOKEN!);
(async () => {
  try {
    await rest.put(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID!),
      { body: Object.values(commandMap).map(command => command.builder.toJSON()) },
    );
    console.log("Successfully registered application commands.");
  } catch (error) {
    console.error(error);
  }
})();
