import { Prisma } from "database";
import { type APIEmbed } from "discord.js";

type GameWithGameResource = Prisma.GameGetPayload<{ include: { gameResource: true } }>;
type RatingScore = Prisma.RatingGetPayload<{ select: { score: true } }>;

export const gameDetailsEmbedBuilder = (game: GameWithGameResource, footerText?: string): APIEmbed => {
  return {
    description: game.gameResource?.description ?? undefined,
    fields: [
      { inline: true, name: "Released?", value: game.released ? "Yes" : "No" },
      { inline: true, name: "Free?", value: game.free ? "Yes" : "No" },
      { inline: true, name: "Players", value: `${game.minPlayers} - ${game.maxPlayers}` },
    ],
    footer: footerText ? { text: footerText } : undefined,
    image: game.gameResource?.bannerImageURL ? { url: game.gameResource?.bannerImageURL } : undefined,
    thumbnail: game.gameResource?.thumbnailImageURL ? { url: game.gameResource?.thumbnailImageURL } : undefined,
    title: game.name,
    url: game.gameURL ?? undefined,
  };
};

export const gameRatingEmbedBuilder = (
  game: GameWithGameResource,
  rating?: RatingScore,
  footerText = "Rate the game from 1 to 5.",
) => {
  const embed = gameDetailsEmbedBuilder(game, footerText);
  embed.fields?.push({ name: "Your Rating", value: rating?.score.toString() ?? "Not rated" });
  return embed;
};
