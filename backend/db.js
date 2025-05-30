import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from project root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// PostgreSQL connection pool configuration
const { Pool } = pg;
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
  // Connection pool settings for better performance
  max: 20,                    // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,   // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection cannot be established
});

// Connection event handlers
pool.on('connect', () => {
  console.log('[DATABASE] ✅ Successfully connected to PostgreSQL');
});

pool.on('error', (err) => {
  console.error('[DATABASE ERROR] ❌ Unexpected error on idle client:', err);
  // Don't exit the application on idle client errors
});

/**
 * Execute a SQL query with optional parameters
 * @param {string} text - SQL query string
 * @param {Array} params - Query parameters (optional)
 * @returns {Promise<pg.QueryResult>} - Query result
 */
export function query(text, params) {
  return pool.query(text, params);
}

/**
 * Get a client from the pool for transactions
 * @returns {Promise<pg.PoolClient>} - Database client
 */
export async function getClient() {
  return await pool.connect();
}

/**
 * Gracefully shut down the database connection pool
 * @returns {Promise<void>}
 */
export async function closePool() {
  await pool.end();
  console.log('[DATABASE] 🛑 Connection pool closed');
}

// Export the pool for advanced use cases
export { pool };