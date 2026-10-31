import pg from "pg";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });

const databaseUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
const pool = new pg.Pool({ connectionString: databaseUrl });

try {
  const result = await pool.query("SELECT id, full_name, email, organization, status, submitted_at FROM inquiries ORDER BY submitted_at DESC LIMIT 1");
  console.log("Verified inquiry record in Neon database:");
  console.log(JSON.stringify(result.rows[0], null, 2));

  const stats = await pool.query(`
    SELECT
      (SELECT count(*) FROM services) AS services_count,
      (SELECT count(*) FROM faqs) AS faqs_count,
      (SELECT count(*) FROM business_settings) AS settings_count,
      (SELECT count(*) FROM inquiries) AS inquiries_count
  `);
  console.log("Neon database counts:");
  console.log(JSON.stringify(stats.rows[0], null, 2));
} finally {
  await pool.end();
}
