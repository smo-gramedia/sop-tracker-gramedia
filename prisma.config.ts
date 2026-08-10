import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  datasource: {
    url: env("DATABASE_URL"),
    shadowDatabaseUrl: env("DATABASE_URL_SHADOW")
  },
  migrations: {
    seed: "tsx prisma/seed.ts"
  }
});