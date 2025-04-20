import { APIEmbed } from "discord.js";

import { Prisma } from "@prisma/client";

type GameWithGameResource = Prisma.GameGetPayload<{ include: { gameResource: true } }>;

export const gameDetailsEmbedBuilder = (game: GameWithGameResource): APIEmbed => {
  return {
    description: game.gameResource?.description ?? undefined,
    fields: [
      { inline: true, name: "Released?", value: game.released ? "Yes" : "No" },
      { inline: true, name: "Free?", value: game.free ? "Yes" : "No" },
      { inline: true, name: "Players", value: `${game.minPlayers} - ${game.maxPlayers}` },
    ],
    image: game.gameResource?.bannerImageURL ? { url: game.gameResource?.bannerImageURL } : undefined,
    title: game.name,
    thumbnail: game.gameResource?.thumbnailImageURL ? { url: game.gameResource?.thumbnailImageURL } : undefined,
    url: game.gameURL ?? undefined,
  };
};
