import { PrismaPg } from "@prisma/adapter-pg";
import { faker } from "@faker-js/faker";

import { GamePlatform, PrismaClient } from "../generated/prisma";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

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

  const steamIdGTFO = "493520";
  const gameResourceGTFO = await prisma.gameResource.upsert({
    create: {
      bannerImageURL:
        `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${steamIdGTFO}`
        + `/header.jpg?t=1728027032`,
      description:
        "GTFO is a hardcore cooperative horror shooter that throws you from gripping suspense to explosive action "
        + "in a heartbeat. Stealth, strategy, and teamwork are necessary to survive in your deadly, underground "
        + "prison. Work together or die together.",
      externalId: steamIdGTFO,
      platform: GamePlatform.STEAM,
      thumbnailImageURL:
        `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${steamIdGTFO}`
        + `/a90c1895f07c2ea0075f3295540701a17981a83a/capsule_231x87.jpg?t=1728027032`,
    },
    update: {},
    where: { externalIdPlatform: { externalId: steamIdGTFO, platform: GamePlatform.STEAM } },
  });

  const steamIdMonaco = "113020";
  const gameResourceMonaco = await prisma.gameResource.upsert({
    create: {
      bannerImageURL:
        `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${steamIdMonaco}`
        + `/header.jpg?t=1741126657`,
      description:
        "Monaco: What's Yours Is Mine is a single player or co-op heist game. "
        + "Assemble a crack team of thieves, case the joint, and pull off the perfect heist.",
      externalId: steamIdMonaco,
      platform: GamePlatform.STEAM,
      thumbnailImageURL:
        `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${steamIdMonaco}`
        + `/capsule_231x87.jpg?t=1741126657`,
    },
    update: {},
    where: { externalIdPlatform: { externalId: steamIdMonaco, platform: GamePlatform.STEAM } },
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
        createdById: faker.helpers.arrayElement(users).id,
        gameResourceId: gameResourceMonaco.id,
        gameURL: "https://store.steampowered.com/app/113020/Monaco_Whats_Yours_Is_Mine",
        guildId: faker.helpers.arrayElement(guildIds),
        maxPlayers: 4,
        name: "Monaco: What's Yours Is Mine",
      }, {
        createdById: faker.helpers.arrayElement(users).id,
        gameResourceId: gameResourceGTFO.id,
        gameURL: "https://store.steampowered.com/app/493520/GTFO",
        guildId: faker.helpers.arrayElement(guildIds),
        maxPlayers: 4,
        name: "GTFO",
      }, {
        createdById: faker.helpers.arrayElement(users).id,
        gameResourceId: gameResourceGTFO.id,
        gameURL: "https://store.steampowered.com/app/493520/GTFO",
        guildId: faker.helpers.arrayElement(guildIds),
        maxPlayers: 4,
        name: "GTFO (Duplicate)",
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
}).catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
