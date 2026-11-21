import "dotenv/config";
import { defineConfig } from "prisma/config";

// DATABASE_URL is only required for database commands (migrate, seed).
// `npm install` → `prisma generate` must work without it so the site can run before a database exists.
const url = process.env.DATABASE_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  ...(url ? { datasource: { url } } : {}),
});
