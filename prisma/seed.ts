import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

const NUM_USERS = 10;
const NUM_GUILDS = 3;
const NUM_RANDOM_GAMES = 10;
const NUM_RATINGS_PER_USER = 5;

(async () => {
  const users = await prisma.user.createManyAndReturn({
    data: [...Array(NUM_USERS)].map(() => {
      return { discordId: faker.string.numeric(18) };
    }),
  });

  const guildIds = [...Array(NUM_GUILDS)].map(() => {
    return faker.string.numeric(18);
  });

  const games = await prisma.game.createManyAndReturn({
    data: [
      ...[...Array(NUM_RANDOM_GAMES)].map(() => {
        return {
          createdById: faker.helpers.arrayElement(users).id,
          guildId: faker.helpers.arrayElement(guildIds),
          maxPlayers: faker.number.int({ min: 1, max: 16 }),
          name: faker.commerce.productName(),
        };
      }),
      {
        bannerImageURL: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/113020/header.jpg?t=1741126657",
        createdById: faker.helpers.arrayElement(users).id,
        description: "Monaco: What's Yours Is Mine is a single player or co-op heist game. Assemble a crack team of thieves, case the joint, and pull off the perfect heist.",
        gameURL: "https://store.steampowered.com/app/113020/Monaco_Whats_Yours_Is_Mine",
        guildId: faker.helpers.arrayElement(guildIds),
        maxPlayers: 4,
        name: "Monaco: What's Yours Is Mine",
        thumbnailImageURL: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/113020/capsule_231x87.jpg?t=1741126657",
      }, {
        bannerImageURL: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/493520/header.jpg?t=1728027032",
        createdById: faker.helpers.arrayElement(users).id,
        description: "GTFO is a hardcore cooperative horror shooter that throws you from gripping suspense to explosive action in a heartbeat. Stealth, strategy, and teamwork are necessary to survive in your deadly, underground prison. Work together or die together.",
        gameURL: "https://store.steampowered.com/app/493520/GTFO",
        guildId: faker.helpers.arrayElement(guildIds),
        maxPlayers: 4,
        name: "GTFO",
        thumbnailImageURL: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/493520/a90c1895f07c2ea0075f3295540701a17981a83a/capsule_231x87.jpg?t=1728027032",
      }, {
        bannerImageURL: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/493520/header.jpg?t=1728027032",
        createdById: faker.helpers.arrayElement(users).id,
        description: "GTFO is a hardcore cooperative horror shooter that throws you from gripping suspense to explosive action in a heartbeat. Stealth, strategy, and teamwork are necessary to survive in your deadly, underground prison. Work together or die together.",
        gameURL: "https://store.steampowered.com/app/493520/GTFO",
        guildId: faker.helpers.arrayElement(guildIds),
        maxPlayers: 4,
        name: "GTFO (Duplicate)",
        thumbnailImageURL: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/493520/a90c1895f07c2ea0075f3295540701a17981a83a/capsule_231x87.jpg?t=1728027032",
      }, {
        createdById: faker.helpers.arrayElement(users).id,
        guildId: faker.helpers.arrayElement(guildIds),
        maxPlayers: 16,
        name: "Minecraft",
      },
    ],
    select: { id: true },
  });

  await prisma.rating.createMany({
    data: [...[...Array(NUM_USERS / 2)].map((_, i) => {
      const usedGames: { id: string }[] = [];
      return [...Array(NUM_RATINGS_PER_USER)].map(() => {
        const game = faker.helpers.arrayElement(games.filter(game => !usedGames.includes(game)));
        usedGames.push(game);
        return {
          gameId: game.id,
          score: faker.number.int({ min: 1, max: 5 }),
          userId: users[i].id,
        };
      });
    })].flat(),
  });
})().then(async () => {
  await prisma.$disconnect();
})
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
