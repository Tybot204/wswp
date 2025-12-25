if (process.env.NODE_ENV === "development") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("dotenv").config();
}

import { PrismaPg } from "@prisma/adapter-pg";
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
import SteamAPI from "steamapi";

import { PrismaClient } from "../generated/prisma";
import { commandMap } from "./commands";

console.log(process.env.NODE_ENV);
console.log(process.env.DATABASE_URL);

export interface Command {
  autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>;
  builder: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
export const prisma = new PrismaClient({ adapter });

export const steam = new SteamAPI(process.env.STEAM_API_KEY ?? false);

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

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
const rest = new REST().setToken(process.env.DISCORD_TOKEN ?? "");
(async () => {
  try {
    await rest.put(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID ?? ""),
      { body: Object.values(commandMap).map(command => command.builder.toJSON()) },
    );
    console.log("Successfully registered application commands.");
  } catch (error) {
    console.error(error);
  }
})();
