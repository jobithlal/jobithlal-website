/**
 * Create an admin account (or reset an existing one's password) from the server shell.
 *   npm run admin:create -- --email you@example.com --name "Jobith Lal" --role SUPER_ADMIN
 * The password is prompted for (never passed on the command line or stored in shell history).
 */
import "dotenv/config";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword, passwordProblem } from "../src/lib/auth/password";

function arg(name: string) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}

async function promptHidden(q: string) {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD; // for automated setups
  const rl = createInterface({ input: stdin, output: stdout, terminal: true });
  // Mask input
  (rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput = (s: string) => {
    if (s.includes(q)) stdout.write(s);
    else stdout.write("*");
  };
  const v = await rl.question(q);
  rl.close();
  stdout.write("\n");
  return v;
}

async function main() {
  const email = arg("email")?.toLowerCase();
  const name = arg("name") ?? "Administrator";
  const role = (arg("role") ?? "SUPER_ADMIN") as "SUPER_ADMIN" | "EDITOR" | "VIEWER";
  if (!email || !["SUPER_ADMIN", "EDITOR", "VIEWER"].includes(role)) {
    console.error('Usage: npm run admin:create -- --email you@example.com [--name "Your Name"] [--role SUPER_ADMIN|EDITOR|VIEWER]');
    process.exit(1);
  }
  const password = await promptHidden("Password (12+ chars): ");
  const problem = passwordProblem(password);
  if (problem) {
    console.error(problem);
    process.exit(1);
  }
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
  const passwordHash = await hashPassword(password);
  const user = await db.user.upsert({
    where: { email },
    create: { email, name, role, passwordHash, emailVerifiedAt: new Date() },
    update: { passwordHash, role, active: true, failedLoginCount: 0, lockedUntil: null },
  });
  await db.session.deleteMany({ where: { userId: user.id } });
  await db.auditLog.create({ data: { action: "auth.admin_cli.upsert", userId: user.id, details: { role } } });
  console.log(`✔ ${user.email} is a ${role}. Sign in at /admin/login`);
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
