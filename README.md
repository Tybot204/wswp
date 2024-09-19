# What Should We Play?

[![CircleCI](https://dl.circleci.com/status-badge/img/gh/Tybot204/wswp/tree/main.svg?style=svg)](https://dl.circleci.com/status-badge/redirect/gh/Tybot204/wswp/tree/main)

A simple Discord bot to help you find what game to play with your friends. Allows rating of games and selects the best game based on the list of players present.

## Development Setup

1. Install Node (see .nvmrc for current version)

2. Install Yarn Classic

3. Install PostgreSQL

4. Install dependencies

   ```bash
   yarn
   ```

5. Generate Prisma types

   ```bash
   yarn prisma generate
   ```

6. Create a database

   ```bash
   psql -U postgres -c "CREATE DATABASE wswp"
   ```

7. Create a `.env` file with the following content:

   ```bash
   DATABASE_URL="postgresql://postgres@localhost:5432/wswp"
   DISCORD_CLIENT_ID=your-discord-client-id
   DISCORD_TOKEN=your-discord-client-token
   ```

8. Migrate the database

   ```bash
   yarn prisma migrate dev
   ```

9. Build the project
  
    ```bash
    yarn build
    ```

10. Start the bot

    ```bash
    yarn start
    ```

## Development Commands

* `yarn lint` - Lint the project using ESLint.
* `yarn build` - Build the project and output to the `./build` directory.
* `yarn start` - Run code currently built in the `./build` directory.
* `yarn prisma generate` - Generate Prisma types. Useful anytime you change `./prisma/schema.prisma`.
* `yarn prisma migrate dev` - Run the existing migrations against the database and generate a new migration if new changes exist.
