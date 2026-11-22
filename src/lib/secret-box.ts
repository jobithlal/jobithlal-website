import "server-only";
import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";

/**
 * Encrypts small secrets (API keys) before they are stored in the database.
 * AES-256-GCM with a key derived from AUTH_SECRET, so a database dump alone
 * does not reveal them. Format: v1.<iv>.<tag>.<ciphertext> (base64url).
 */

export function secretBoxReady() {
  return (process.env.AUTH_SECRET ?? "").length >= 32;
}

function key() {
  if (!secretBoxReady()) throw new Error("AUTH_SECRET (32+ characters) must be set to store API keys.");
  return Buffer.from(hkdfSync("sha256", process.env.AUTH_SECRET!, "jobithlal", "integration-secrets:v1", 32));
}

export function seal(plain: string) {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return ["v1", iv.toString("base64url"), c.getAuthTag().toString("base64url"), enc.toString("base64url")].join(".");
}

/** Returns null if the value can't be decrypted (e.g. AUTH_SECRET was changed). */
export function open(sealed: string): string | null {
  try {
    const [v, iv, tag, data] = sealed.split(".");
    if (v !== "v1") return null;
    const d = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64url"));
    d.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([d.update(Buffer.from(data, "base64url")), d.final()]).toString("utf8");
  } catch {
    return null;
  }
}
