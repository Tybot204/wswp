# What Should We Play?

[![CircleCI](https://dl.circleci.com/status-badge/img/gh/Tybot204/wswp/tree/main.svg?style=svg)](https://dl.circleci.com/status-badge/redirect/gh/Tybot204/wswp/tree/main)

A simple Discord bot to help you find what game to play with your friends. Allows rating of games and selects the best game based on the list of players present.

## Development Setup

1. Install [pnpm standalone (or system package manager)](https://pnpm.io/installation#using-a-standalone-script)

   **NOTE:** Do not install via NPM package manager. This project uses pnpm to manage Node versions.

2. Install PostgreSQL

3. Install dependencies

   ```bash
   pnpm install
   ```

4. Create a database

   ```bash
   psql -U postgres -c "CREATE DATABASE wswp"
   ```

5. Create a `.env` file in `.packages/database` with the following content:

   ```bash
   DATABASE_URL="postgresql://postgres@localhost:5432/wswp?schema=public"
   ```

6. Create a `.env` file in `./apps/discord` with the following content:

   ```bash
   DATABASE_URL="postgresql://postgres@localhost:5432/wswp?schema=public"
   DISCORD_CLIENT_ID=your-discord-client-id
   DISCORD_TOKEN=your-discord-client-token
   STEAM_API_KEY=your-steam-api-key
   ```

7. Sync database to Prisma schema and generate Prisma types

   ```bash
   pnpm dev:setup
   ```

8. Start the bot

   ```bash
   cd ./apps/discord
   pnpm start:dev
   ```

## Development Commands

### Root Commands

* `pnpm dev:setup` - Sync the database to the Prisma schema and generate Prisma types.
* `pnpm lint` - Lint the project using ESLint.
* `pnpm validate` - Validate TypeScript code without emitting output.

### Discord App Commands

* `pnpm build` - Build the project and output to the `./apps/discord/build` directory.
* `pnpm start` - Run the project currently built in the `./apps/discord/build` directory.
* `pnpm start:dev` - Start the project in development mode with hot-reloading using `tsx`.

### Database Package Commands

* `pnpm build` - Build the project and output to the `./packages/database/build` directory.
* `pnpm db:deploy` - Deploy database migrations to the database.
* `pnpm db:generate` - Generate TypeScript types from the Prisma schema. Useful anytime you change `./packages/database/prisma/schema.prisma` or add TypeSQL files to `./packages/database/prisma/sql`.
* `pnpm db:migrate` - Create a new migration based on the current Prisma schema.
* `pnpm db:seed` - Seed the database with initial data as defined in `./packages/database/prisma/seed.ts`.
* `pnpm db:studio` - Open Prisma Studio to interact with the database through a web interface.
* `pnpm db:sync` - Sync the database schema to match the Prisma schema without running migrations.
