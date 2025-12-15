import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  datasource: { url: process.env.DATABASE_URL || "" },
  migrations: {
    path: "prisma/migrations",
    seed: "ts-node prisma/seed.ts",
  },
  schema: "prisma/schema.prisma",
});
