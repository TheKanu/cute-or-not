import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

import { query } from './db.js';
import { saveVote } from './voteService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
app.use(cors());
app.use(express.json());

// Serve frontend & images
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));
app.get('/', (req, res) => res.sendFile(path.join(frontendPath, 'index.html')));
app.use('/images', express.static(path.join(__dirname, 'images')));

// Rate limiter for votes (15 per minute per IP)
const voteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  message: { error: 'Too many votes – try again in a minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 1) Fetch random cat URL
app.get('/api/cat', async (req, res) => {
  try {
    const catResp = await fetch('https://cataas.com/cat?json=true');
    if (!catResp.ok) throw new Error('CATAAS JSON nicht verfügbar');
    const data = await catResp.json();
    const imageUrl = data.url.startsWith('http')
      ? data.url
      : `https://cataas.com${data.url}`;
    res.json({ image_url: imageUrl });
  } catch (err) {
    console.error('[CATAAS ERROR]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 2) Submit a vote
app.post('/api/vote', voteLimiter, async (req, res) => {
  try {
    const { image_url, is_cute } = req.body;
    if (typeof image_url !== 'string' || !image_url.startsWith('https://')) {
      return res.status(400).json({ error: 'Ungültige Bild-URL' });
    }
    const cat = await saveVote(image_url, is_cute);
    res.json({ message: 'Vote gespeichert', cat });
  } catch (err) {
    console.error('[VOTE ERROR]', err.message);
    res.status(500).json({ error: 'Fehler beim Speichern des Votes' });
  }
});

// 3) Legacy leaderboard
app.get('/api/leaderboard', async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT name, image_url,
              ROUND((cute_score::decimal / NULLIF(total_votes,0))*100)::int AS cute_pct,
              total_votes
       FROM cats
       WHERE total_votes > 0
       ORDER BY cute_pct DESC, total_votes DESC
       LIMIT 10;`
    );
    res.json(rows);
  } catch (err) {
    console.error('[LEADERBOARD ERROR]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 4) Total votes
app.get('/api/total-votes', async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT COALESCE(SUM(total_votes), 0)::int AS total_votes
       FROM cats;`
    );
    res.json({ total_votes: rows[0].total_votes });
  } catch (err) {
    console.error('[TOTAL-VOTES ERROR]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 5) Top Cutest Cat (all time)
app.get('/api/leaderboard/top', async (req, res) => {
  const { rows } = await query(
    `SELECT id, name, image_url, total_votes
     FROM cats
     ORDER BY total_votes DESC
     LIMIT 1;`
  );
  res.json(rows[0] || null);
});

// 6) Cat of the Year (votes this year)
app.get('/api/leaderboard/year', async (req, res) => {
  const { rows } = await query(
    `SELECT
       c.id,
       c.name,
       c.image_url,
       COUNT(v.*) AS votes_this_year
     FROM cats c
     LEFT JOIN votes v
       ON v.cat_id = c.id
       AND date_trunc('year', v.created_at) = date_trunc('year', NOW())
     GROUP BY c.id, c.name, c.image_url
     ORDER BY votes_this_year DESC
     LIMIT 1;`
  );
  res.json(rows[0] || null);
});

// 7) Monthly Cutest (votes this month)
app.get('/api/leaderboard/month', async (req, res) => {
  const { rows } = await query(
    `SELECT
       c.id,
       c.name,
       c.image_url,
       COUNT(v.*) AS votes_this_month
     FROM cats c
     LEFT JOIN votes v
       ON v.cat_id = c.id
       AND date_trunc('month', v.created_at) = date_trunc('month', NOW())
     GROUP BY c.id, c.name, c.image_url
     ORDER BY votes_this_month DESC
     LIMIT 1;`
  );
  res.json(rows[0] || null);
});

// 8) Cat of the Day (votes today)
app.get('/api/leaderboard/day', async (req, res) => {
  const { rows } = await query(
    `SELECT
       c.id,
       c.name,
       c.image_url,
       COUNT(v.*) AS votes_today
     FROM cats c
     LEFT JOIN votes v
       ON v.cat_id = c.id
       AND date_trunc('day', v.created_at) = date_trunc('day', NOW())
     GROUP BY c.id, c.name, c.image_url
     ORDER BY votes_today DESC
     LIMIT 1;`
  );
  res.json(rows[0] || null);
});

// 9) 5 Random Cats
app.get('/api/leaderboard/random', async (req, res) => {
  const { rows } = await query(
    `SELECT id, name, image_url, total_votes
     FROM cats
     ORDER BY RANDOM()
     LIMIT 5;`
  );
  res.json(rows);
});

// 10) Search by name
app.get('/api/cat-search', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Missing query' });
  const { rows } = await query(
    `SELECT id, name, image_url, total_votes
     FROM cats
     WHERE name ILIKE $1
     ORDER BY total_votes DESC
     LIMIT 10;`,
    [`%${q}%`]
  );
  res.json(rows);
});

// 11) Get cat by ID (detail page)
app.get('/api/cat/:id', async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT id, name, image_url, total_votes
       FROM cats
       WHERE id = $1
       LIMIT 1;`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Cat not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('[GET CAT ERROR]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🐱 Server läuft auf http://localhost:${PORT}`));