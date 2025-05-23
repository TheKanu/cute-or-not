import fetch from 'node-fetch';
import crypto from 'crypto';
import { query } from './db.js';

export async function getImageHash(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Bild konnte nicht geladen werden');
  const data = await res.arrayBuffer();
  return crypto.createHash('sha256').update(Buffer.from(data)).digest('hex');
}

export async function downloadImage(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Bild konnte nicht heruntergeladen werden');
  return Buffer.from(await res.arrayBuffer());
}

export async function findOrCreateCat(image_url) {
  const hash = await getImageHash(image_url);
  const { rows } = await query('SELECT * FROM cats WHERE hash = $1', [hash]);
  if (rows.length > 0) return rows[0];

  const insert = await query(
    'INSERT INTO cats (hash, image_url) VALUES ($1, $2) RETURNING *',
    [hash, image_url]
  );
  return insert.rows[0];
}
