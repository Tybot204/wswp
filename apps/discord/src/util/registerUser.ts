import { prisma } from "database";
import { type User } from "discord.js";

export const registerUser = async (user: User) => {
  const existingUser = await prisma.user.findUnique({ where: { discordId: user.id } });
  if (existingUser) return existingUser;

  return await prisma.user.create({ data: { discordId: user.id } });
};
