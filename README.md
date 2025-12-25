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

5. Create a `.env` file with the following content:

   ```bash
   DATABASE_URL="postgresql://postgres@localhost:5432/wswp?schema=public"
   DISCORD_CLIENT_ID=your-discord-client-id
   DISCORD_TOKEN=your-discord-client-token
   STEAM_API_KEY=your-steam-api-key
   ```

6. Sync database to Prisma schema

   ```bash
   pnpm db:sync
   ```

7. Generate Prisma types

   ```bash
   pnpm types:generate
   ```

8. Start the bot

   ```bash
   pnpm start:dev
   ```

## Development Commands

* `yarn build` - Build the project and output to the `./build` directory.
* `yarn db:generate` - Create a new migration based on the current Prisma schema.
* `yarn db:migrate` - Apply existing migrations to the database in order of creation.
* `yarn db:seed` - Seed the database with initial data as defined in `./prisma/seed.ts`.
* `yarn db:sync` - Sync the database schema to match the Prisma schema without running migrations.
* `yarn lint` - Lint the project using ESLint.
* `yarn start` - Run code currently built in the `./build` directory.
* `yarn start:dev` - Start the project in development mode with hot-reloading using `nodemon`.
* `yarn types:generate` - Generate TypeScript types from the Prisma schema. Useful anytime you change `./prisma/schema.prisma` or add TypeSQL files to `./prisma/sql`.
