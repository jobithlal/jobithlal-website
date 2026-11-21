import { createHash, randomBytes } from "node:crypto";

/** 256-bit random token, URL-safe. Only its SHA-256 is ever stored. */
export function newToken() {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

/** Salted one-way IP fingerprint for inquiries and logs (raw IPs aren't stored). */
export function hashIp(ip: string) {
  const salt = process.env.AUTH_SECRET ?? "jobithlal";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}
