if (process.env.NODE_ENV === "development") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("dotenv").config();
}

import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  Client,
  Events,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
} from "discord.js";
import { PrismaClient } from "@prisma/client";
import SteamAPI from "steamapi";

import { commandMap } from "./commands";

export interface Command {
  autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>;
  builder: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

export const prisma = new PrismaClient();

export const steam = new SteamAPI(process.env.STEAM_API_KEY!);

const client = new Client({ intents: GatewayIntentBits.Guilds });

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Logged in as ${readyClient.user?.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isChatInputCommand()) {
    await commandMap[interaction.commandName].execute?.(interaction);
  } else if (interaction.isAutocomplete()) {
    await commandMap[interaction.commandName].autocomplete?.(interaction);
  }
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
