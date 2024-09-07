import { User } from "discord.js";

import { prisma } from "..";

export const registerUser = async (user: User) => {
  const existingUser = await prisma.user.findUnique({ where: { discordId: user.id } });
  if (existingUser) return existingUser;

  return await prisma.user.create({ data: { discordId: user.id, discordName: user.displayName } });
};
