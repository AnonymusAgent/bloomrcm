import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";

/**
 * Pure, dependency-free security primitives.
 * Password hashing uses Node's built-in scrypt (no native modules).
 * Format: s2$<saltB64>$<hashB64>  (N=16384, r=8, p=1)
 */

const SCRYPT_OPTS = { N: 16384, r: 8, p: 1 } as const;
const KEYLEN = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, KEYLEN, SCRYPT_OPTS, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
  return `s2$${salt.toString("base64")}$${key.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const [version, saltB64, hashB64] = stored.split("$");
    if (version !== "s2" || !saltB64 || !hashB64) return false;
    const salt = Buffer.from(saltB64, "base64");
    const expected = Buffer.from(hashB64, "base64");
    const key = await new Promise<Buffer>((resolve, reject) => {
      scrypt(password, salt, KEYLEN, SCRYPT_OPTS, (err, derivedKey) => {
        if (err) reject(err);
        else resolve(derivedKey);
      });
    });
    return expected.length === key.length && timingSafeEqual(expected, key);
  } catch {
    return false;
  }
}

/** Cryptographically random URL-safe token (sessions, reset links). */
export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

/** SHA-256 hex digest — used to store tokens/sessions as hashes only. */
export function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/**
 * Hash an IP address with a server-side salt so raw IPs are never stored.
 * Falls back to a static dev salt when ADMIN_SESSION_SECRET is unset.
 */
export function hashIp(ip: string): string {
  const salt = process.env.ADMIN_SESSION_SECRET ?? "dev-only-salt-change-me";
  return createHash("sha256").update(`${salt}|${ip}`).digest("hex").slice(0, 40);
}

/** Dedup fingerprint for contact submissions (email+message, salted). */
export function dedupeHash(email: string, message: string): string {
  const salt = process.env.ADMIN_SESSION_SECRET ?? "dev-only-salt-change-me";
  return createHash("sha256").update(`${salt}|dedupe|${email}|${message.trim().toLowerCase()}`).digest("hex");
}

/** True when a count is still within the allowed rate limit. */
export function withinLimit(count: number, limit: number): boolean {
  return count >= 0 && count <= limit && Number.isInteger(count) && Number.isInteger(limit) && limit > 0;
}
