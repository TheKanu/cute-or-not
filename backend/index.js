import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { query } from './db.js';
import { saveVote } from './voteService.js';

// Setup ES modules path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from project root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Initialize Express application
const app = express();

// Middleware setup
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Parse JSON request bodies

// Serve static files (frontend HTML/CSS/JS and cached images)
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));
app.get('/', (req, res) => res.sendFile(path.join(frontendPath, 'index.html')));
app.use('/images', express.static(path.join(__dirname, 'images')));

// Rate limiter for voting endpoint to prevent spam
// Allows 15 votes per minute per IP address
const voteLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 15, // Maximum 15 requests per window
  message: { error: 'Too many votes – please try again in a minute.' },
  standardHeaders: true, // Include rate limit info in response headers
  legacyHeaders: false, // Disable legacy X-RateLimit headers
});

// =============================================================================
// API ROUTES
// =============================================================================

/**
 * GET /api/cat
 * Fetches a random cat image URL from CATAAS (Cat As A Service)
 * Returns: { image_url: string }
 */
app.get('/api/cat', async (req, res) => {
  try {
    console.log('[API] Fetching random cat from CATAAS...');
    const catResponse = await fetch('https://cataas.com/cat?json=true');
    
    if (!catResponse.ok) {
      throw new Error('CATAAS service unavailable');
    }
    
    const data = await catResponse.json();
    
    // Ensure URL is absolute (CATAAS sometimes returns relative URLs)
    const imageUrl = data.url.startsWith('http')
      ? data.url
      : `https://cataas.com${data.url}`;
    
    console.log('[API] Successfully fetched cat:', imageUrl);
    res.json({ image_url: imageUrl });
    
  } catch (error) {
    console.error('[API ERROR] Failed to fetch cat:', error.message);
    res.status(500).json({ 
      error: 'Unable to fetch cat image. Please try again.' 
    });
  }
});

/**
 * POST /api/vote
 * Submits a vote for a cat image
 * Body: { image_url: string, is_cute: boolean }
 * Returns: { message: string, cat: object }
 */
app.post('/api/vote', voteLimiter, async (req, res) => {
  try {
    const { image_url, is_cute } = req.body;
    
    // Validate input parameters
    if (typeof image_url !== 'string' || !image_url.startsWith('https://')) {
      return res.status(400).json({ 
        error: 'Invalid image URL. Must be a valid HTTPS URL.' 
      });
    }
    
    if (typeof is_cute !== 'boolean') {
      return res.status(400).json({ 
        error: 'Invalid vote value. Must be true or false.' 
      });
    }
    
    console.log(`[API] Processing vote: ${image_url} - cute: ${is_cute}`);
    
    // Process the vote through vote service
    const cat = await saveVote(image_url, is_cute);
    
    console.log(`[API] Vote saved successfully for cat: ${cat.name}`);
    res.json({ 
      message: 'Vote saved successfully', 
      cat: cat 
    });
    
  } catch (error) {
    console.error('[API ERROR] Failed to save vote:', error.message);
    res.status(500).json({ 
      error: 'Unable to save vote. Please try again.' 
    });
  }
});

/**
 * GET /api/total-votes
 * Returns the total number of votes across all cats
 * Returns: { total_votes: number }
 */
app.get('/api/total-votes', async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT COALESCE(SUM(total_votes), 0)::int AS total_votes FROM cats;`
    );
    
    res.json({ total_votes: rows[0].total_votes });
    
  } catch (error) {
    console.error('[API ERROR] Failed to get total votes:', error.message);
    res.status(500).json({ error: 'Unable to fetch vote statistics.' });
  }
});

// =============================================================================
// LEADERBOARD ENDPOINTS
// =============================================================================

/**
 * GET /api/leaderboard (Legacy)
 * Returns top 10 cats by cute percentage with vote threshold
 * Returns: Array of cats with cute_pct and total_votes
 */
app.get('/api/leaderboard', async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT 
        name, 
        image_url,
        ROUND((cute_score::decimal / NULLIF(total_votes,0)) * 100)::int AS cute_pct,
        total_votes
      FROM cats
      WHERE total_votes > 0
      ORDER BY cute_pct DESC, total_votes DESC
      LIMIT 10;
    `);
    
    res.json(rows);
    
  } catch (error) {
    console.error('[API ERROR] Failed to fetch leaderboard:', error.message);
    res.status(500).json({ error: 'Unable to fetch leaderboard.' });
  }
});

/**
 * GET /api/leaderboard/top
 * Returns the cat with the most total votes (all-time champion)
 * Returns: Single cat object or null
 */
app.get('/api/leaderboard/top', async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT id, name, image_url, total_votes
      FROM cats
      WHERE total_votes > 0
      ORDER BY total_votes DESC
      LIMIT 1;
    `);
    
    res.json(rows[0] || null);
    
  } catch (error) {
    console.error('[API ERROR] Failed to fetch top cat:', error.message);
    res.status(500).json({ error: 'Unable to fetch top cat.' });
  }
});

/**
 * GET /api/leaderboard/year
 * Returns the cat with the most votes this calendar year
 * Returns: Cat object with votes_this_year field
 */
app.get('/api/leaderboard/year', async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT
        c.id,
        c.name,
        c.image_url,
        COUNT(v.*) AS votes_this_year
      FROM cats c
      LEFT JOIN votes v
        ON v.cat_id = c.id
        AND date_trunc('year', v.created_at) = date_trunc('year', NOW())
      GROUP BY c.id, c.name, c.image_url
      HAVING COUNT(v.*) > 0
      ORDER BY votes_this_year DESC
      LIMIT 1;
    `);
    
    res.json(rows[0] || null);
    
  } catch (error) {
    console.error('[API ERROR] Failed to fetch cat of the year:', error.message);
    res.status(500).json({ error: 'Unable to fetch cat of the year.' });
  }
});

/**
 * GET /api/leaderboard/month
 * Returns the cat with the most votes this calendar month
 * Returns: Cat object with votes_this_month field
 */
app.get('/api/leaderboard/month', async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT
        c.id,
        c.name,
        c.image_url,
        COUNT(v.*) AS votes_this_month
      FROM cats c
      LEFT JOIN votes v
        ON v.cat_id = c.id
        AND date_trunc('month', v.created_at) = date_trunc('month', NOW())
      GROUP BY c.id, c.name, c.image_url
      HAVING COUNT(v.*) > 0
      ORDER BY votes_this_month DESC
      LIMIT 1;
    `);
    
    res.json(rows[0] || null);
    
  } catch (error) {
    console.error('[API ERROR] Failed to fetch monthly cutest:', error.message);
    res.status(500).json({ error: 'Unable to fetch monthly cutest cat.' });
  }
});

/**
 * GET /api/leaderboard/day
 * Returns the cat with the most votes today
 * Returns: Cat object with votes_today field
 */
app.get('/api/leaderboard/day', async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT
        c.id,
        c.name,
        c.image_url,
        COUNT(v.*) AS votes_today
      FROM cats c
      LEFT JOIN votes v
        ON v.cat_id = c.id
        AND date_trunc('day', v.created_at) = date_trunc('day', NOW())
      GROUP BY c.id, c.name, c.image_url
      HAVING COUNT(v.*) > 0
      ORDER BY votes_today DESC
      LIMIT 1;
    `);
    
    res.json(rows[0] || null);
    
  } catch (error) {
    console.error('[API ERROR] Failed to fetch cat of the day:', error.message);
    res.status(500).json({ error: 'Unable to fetch cat of the day.' });
  }
});

/**
 * GET /api/leaderboard/random
 * Returns 5 randomly selected cats from the database
 * Returns: Array of 5 cat objects
 */
app.get('/api/leaderboard/random', async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT id, name, image_url, total_votes
      FROM cats
      WHERE total_votes > 0
      ORDER BY RANDOM()
      LIMIT 5;
    `);
    
    res.json(rows);
    
  } catch (error) {
    console.error('[API ERROR] Failed to fetch random cats:', error.message);
    res.status(500).json({ error: 'Unable to fetch random cats.' });
  }
});

// =============================================================================
// SEARCH AND INDIVIDUAL CAT ENDPOINTS
// =============================================================================

/**
 * GET /api/cat-search?q=<query>
 * Searches for cats by name using case-insensitive partial matching
 * Query params: q (search term)
 * Returns: Array of matching cats (max 10)
 */
app.get('/api/cat-search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ 
        error: 'Missing or invalid search query parameter.' 
      });
    }
    
    const { rows } = await query(`
      SELECT id, name, image_url, total_votes
      FROM cats
      WHERE name ILIKE $1 AND total_votes > 0
      ORDER BY total_votes DESC
      LIMIT 10;
    `, [`%${q.trim()}%`]);
    
    res.json(rows);
    
  } catch (error) {
    console.error('[API ERROR] Failed to search cats:', error.message);
    res.status(500).json({ error: 'Unable to perform search.' });
  }
});

/**
 * GET /api/cat/:id
 * Returns detailed information for a specific cat by ID
 * Path params: id (cat ID)
 * Returns: Single cat object or 404 if not found
 */
app.get('/api/cat/:id', async (req, res) => {
  try {
    const catId = parseInt(req.params.id);
    
    // Validate ID parameter
    if (isNaN(catId) || catId <= 0) {
      return res.status(400).json({ 
        error: 'Invalid cat ID. Must be a positive integer.' 
      });
    }
    
    const { rows } = await query(`
      SELECT id, name, image_url, total_votes, cute_score, created_at
      FROM cats
      WHERE id = $1
      LIMIT 1;
    `, [catId]);
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        error: 'Cat not found. It may have been removed or never existed.' 
      });
    }
    
    res.json(rows[0]);
    
  } catch (error) {
    console.error('[API ERROR] Failed to fetch cat details:', error.message);
    res.status(500).json({ error: 'Unable to fetch cat details.' });
  }
});

// =============================================================================
// SERVER STARTUP
// =============================================================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🐱 Cat Voting Server is running!`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown handler
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});