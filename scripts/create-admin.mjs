#!/usr/bin/env node
/**
 * Secure administrator provisioning / password recovery CLI.
 *
 * Usage:
 *   node scripts/create-admin.mjs <email> <name> [password]
 *
 * - If no admin users exist, creates the OWNER account (same as /admin/login first-run setup).
 * - If the email already exists, resets that account's password and invalidates sessions.
 * - If admins exist but the email is new, creates a STAFF account (run only if you trust the operator).
 * - No default credentials are ever created; password is prompted when omitted.
 *
 * Requires DATABASE_URL in .env (loaded via dotenv).
 */
import { createHash, randomBytes, scrypt } from "node:crypto";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import pg from "pg";
import "dotenv/config";

const SCRYPT_OPTS = { N: 16384, r: 8, p: 1 };

function hashPassword(password) {
  const salt = randomBytes(16);
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, SCRYPT_OPTS, (err, key) => {
      if (err) reject(err);
      else resolve(`s2$${salt.toString("base64")}$${key.toString("base64")}`);
    });
  });
}

function strongEnough(password) {
  return password.length >= 12 && password.length <= 128 && /[a-zA-Z]/.test(password) && /\d/.test(password);
}

const [, , emailArg, nameArg, passwordArg] = process.argv;

if (!emailArg || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailArg)) {
  console.error("Usage: node scripts/create-admin.mjs <email> <name> [password]");
  process.exit(1);
}
const email = emailArg.trim().toLowerCase();
const name = (nameArg ?? "").trim();
if (!nameArg && !process.argv.includes("--reset-only")) {
  // allow reset-only runs without a name
}

/** Resolve credentials from the environment only — never from source code. */
const databaseUrl = process.env.NEON_DATABASE_URL ?? process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("No database URL available. Set NEON_DATABASE_URL or DATABASE_URL.");
  process.exit(1);
}
console.log(`Target database: ${databaseUrl.replace(/:[^:@]*@/, ":****@").split("?")[0]}`);

const rl = createInterface({ input, output });
let password = passwordArg;
if (!password) {
  password = await rl.question("Password (min 12 chars, letters + numbers): ");
  const confirm = await rl.question("Confirm password: ");
  if (password !== confirm) {
    console.error("Passwords do not match.");
    process.exit(1);
  }
}
rl.close();

if (!strongEnough(password)) {
  console.error("Password must be 12–128 characters and include letters and numbers.");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: databaseUrl });
try {
  const hash = await hashPassword(password);
  const existing = await pool.query("SELECT id, name FROM admin_users WHERE email = $1", [email]);

  if (existing.rows.length > 0) {
    const id = existing.rows[0].id;
    await pool.query("UPDATE admin_users SET password_hash = $1 WHERE id = $2", [hash, id]);
    await pool.query("DELETE FROM admin_sessions WHERE user_id = $1", [id]);
    await pool.query(
      "INSERT INTO audit_events (actor_id, action, entity, entity_id, metadata) VALUES ($1::uuid, 'admin.password_reset_via_cli', 'admin_user', $2, $3::jsonb)",
      [id, String(id), JSON.stringify({ via: "scripts/create-admin.mjs" })],
    );
    console.log(`Password updated for existing administrator ${email}. All sessions invalidated.`);
  } else {
    const adminCount = await pool.query("SELECT count(*)::int AS n FROM admin_users");
    const isFirst = adminCount.rows[0].n === 0;
    const displayName = name || email.split("@")[0];
    const role = isFirst ? "owner" : "staff";
    const inserted = await pool.query(
      "INSERT INTO admin_users (email, name, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id",
      [email, displayName, hash, role],
    );
    await pool.query(
      "INSERT INTO audit_events (actor_id, action, entity, entity_id, metadata) VALUES ($1::uuid, $2, 'admin_user', $3, $4::jsonb)",
      [inserted.rows[0].id, isFirst ? "admin.setup_via_cli" : "admin.staff_created_via_cli", String(inserted.rows[0].id), JSON.stringify({ via: "scripts/create-admin.mjs" })],
    );
    console.log(`Created ${role} account for ${email}. Sign in at /admin/login.`);
    console.log(createHash("sha256").update(`${email}|provisioned`).digest("hex").slice(0, 12));
  }
} finally {
  await pool.end();
}
