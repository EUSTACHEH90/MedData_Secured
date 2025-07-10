import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.NEONDB_URL,
  ssl: { rejectUnauthorized: false },
});

process.on("SIGTERM", async () => {
  await pool.end();
});

export default pool;