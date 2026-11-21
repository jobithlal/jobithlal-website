// Vercel build: apply database migrations and the (idempotent) seed when a database
// is connected, then build the site. Without DATABASE_URL it just builds.
import { execSync } from "node:child_process";

const run = (cmd, env = process.env) => execSync(cmd, { stdio: "inherit", env });

if (process.env.DATABASE_URL) {
  // Migrations need a direct connection; Neon's pooled URL (PgBouncer) can't hold migration locks.
  const direct = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  const migrateEnv = { ...process.env, DATABASE_URL: direct };
  console.log("▶ Applying database migrations…");
  run("npx prisma migrate deploy", migrateEnv);
  console.log("▶ Seeding default content (never overwrites edits)…");
  run("npx prisma db seed", migrateEnv);
} else {
  console.log("▶ No DATABASE_URL — building with built-in content only.");
}
run("npx next build");
