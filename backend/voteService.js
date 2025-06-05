import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { findOrCreateCat, downloadImage } from './catService.js';
import { query } from './db.js';
import { generateUniqueName } from './nameGenerator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const imagesDir = path.join(__dirname, 'images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

export async function saveVote(image_url, is_cute) {
  console.log('[saveVote] ➡️ Vote received for:', image_url, '– cute?', is_cute);

  // 1) Cat holen oder neu anlegen
  let cat = await findOrCreateCat(image_url);

  // 2) Erster Vote?
  const isNew = cat.cute_score === 0 && cat.total_votes === 0;
  if (isNew) {
    console.log('[saveVote] ✨ First vote for cat ID', cat.id);

    // a) Bild herunterladen & speichern
    const buffer = await downloadImage(image_url);
    const filename = `${cat.hash}.jpg`;
    const savePath = path.join(imagesDir, filename);
    fs.writeFileSync(savePath, buffer);
    const localUrl = `/images/${filename}`;

    // b) Namen generieren
    const name = await generateUniqueName();

    // c) Cat-Tabelle initial updaten
    const insertRes = await query(
      `UPDATE cats
          SET image_url   = $1,
              name        = $2,
              cute_score  = 1,
              total_votes = 1
        WHERE id = $3
        RETURNING *`,
      [localUrl, name, cat.id]
    );
    cat = insertRes.rows[0];

    // d) Vote in votes-Tabelle schreiben
    console.log('[saveVote] 📥 Inserting vote record for new cat ID', cat.id);
    await query(
      `INSERT INTO votes (cat_id, is_cute) VALUES ($1, $2)`,
      [cat.id, is_cute]
    );

    return {
      id: cat.id,
      name: cat.name,
      image_url: cat.image_url,
      cute_score: cat.cute_score,
      total_votes: cat.total_votes
    };
  }

  // 3) Folge-Vote: Zähler erhöhen
  console.log('[saveVote] 🔄 Incrementing vote for existing cat ID', cat.id);
  const newCute = cat.cute_score + (is_cute ? 1 : 0);
  const newTotal = cat.total_votes + 1;
  const updateRes = await query(
    `UPDATE cats
        SET cute_score  = $1,
            total_votes = $2
      WHERE id = $3
      RETURNING *`,
    [newCute, newTotal, cat.id]
  );
  cat = updateRes.rows[0];

  // d) Vote in votes-Tabelle schreiben
  console.log('[saveVote] 📥 Inserting vote record for existing cat ID', cat.id);
  await query(
    `INSERT INTO votes (cat_id, is_cute) VALUES ($1, $2)`,
    [cat.id, is_cute]
  );

  return {
    id: cat.id,
    name: cat.name,
    image_url: cat.image_url,
    cute_score: cat.cute_score,
    total_votes: cat.total_votes
  };
}