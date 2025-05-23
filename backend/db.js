import pg from 'pg';
import dotenv from 'dotenv';

// Load .env from project root
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { Pool } = pg;
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT
});

pool.on('connect', () => console.log('[DB] Connected'));
pool.on('error', err => console.error('[DB ERROR]', err));

export function query(text, params) {
  return pool.query(text, params);
}

export { pool };