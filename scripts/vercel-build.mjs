// Vercel build: apply database migrations and the (idempotent) seed when a database
// is connected, then build the site. Without DATABASE_URL it just builds.
import { execSync } from "node:child_process";

const run = (cmd) => execSync(cmd, { stdio: "inherit" });

if (process.env.DATABASE_URL) {
  console.log("▶ Applying database migrations…");
  run("npx prisma migrate deploy");
  console.log("▶ Seeding default content (never overwrites edits)…");
  run("npx prisma db seed");
} else {
  console.log("▶ No DATABASE_URL — building with built-in content only.");
}
run("npx next build");
