import { prisma } from "..";

export const registerUser = async (discordId: string, discordName: string) => {
  const existingUser = await prisma.user.findUnique({ where: { discordId } });
  if (existingUser) return;

  await prisma.user.create({ data: { discordId, discordName } });
};
