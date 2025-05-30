import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { query } from './db.js';
import { saveVote } from './voteService.js';
import { getCatImage } from './catService.js';

// ES modules path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from project root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Initialize Express application
const app = express();
const PORT = process.env.PORT || 3000;

// =============================================================================
// MIDDLEWARE CONFIGURATION
// =============================================================================

// Enable CORS for cross-origin requests
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Serve static files from frontend directory
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));

// Serve cached cat images
app.use('/images', express.static(path.join(__dirname, '..', 'frontend', 'images')));

// =============================================================================
// RATE LIMITING MIDDLEWARE
// =============================================================================

/**
 * Simple in-memory rate limiter to prevent vote spam
 * Allows 15 votes per minute per IP address
 */
const voteTracking = new Map();

function rateLimiter(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 15;
  
  // Get or create tracking data for this IP
  if (!voteTracking.has(ip)) {
    voteTracking.set(ip, []);
  }
  
  const requests = voteTracking.get(ip);
  
  // Remove requests outside the current window
  const validRequests = requests.filter(timestamp => now - timestamp < windowMs);
  
  if (validRequests.length >= maxRequests) {
    return res.status(429).json({ 
      error: 'Too many votes - please try again in a minute.' 
    });
  }
  
  // Add current request timestamp
  validRequests.push(now);
  voteTracking.set(ip, validRequests);
  
  next();
}

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  const windowMs = 60 * 1000;
  
  voteTracking.forEach((requests, ip) => {
    const validRequests = requests.filter(timestamp => now - timestamp < windowMs);
    if (validRequests.length === 0) {
      voteTracking.delete(ip);
    } else {
      voteTracking.set(ip, validRequests);
    }
  });
}, 5 * 60 * 1000);

// =============================================================================
// ROUTES
// =============================================================================

/**
 * GET /
 * Serve the main voting interface
 */
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

/**
 * GET /api/cat
 * Fetches a random cat image URL from CATAAS (Cat As A Service)
 * @returns {Object} { image_url: string }
 */
app.get('/api/cat', async (req, res) => {
  try {
    console.log('[API] Fetching random cat image...');
    
    const imageUrl = await getCatImage();
    
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
 * Submit a vote for a cat image
 * @body { image_url: string, is_cute: boolean }
 * @returns {Object} { message: string, cat: Object }
 */
app.post('/api/vote', rateLimiter, async (req, res) => {
  try {
    const { image_url, is_cute } = req.body;
    
    // Validate input
    if (!image_url || typeof image_url !== 'string') {
      return res.status(400).json({ 
        error: 'Invalid image URL provided.' 
      });
    }
    
    if (typeof is_cute !== 'boolean') {
      return res.status(400).json({ 
        error: 'Vote must be true (cute) or false (not cute).' 
      });
    }
    
    console.log(`[API] Processing vote: ${image_url} - cute: ${is_cute}`);
    
    // Process the vote
    const cat = await saveVote(image_url, is_cute);
    
    console.log(`[API] Vote saved for cat: ${cat.name}`);
    res.json({ 
      message: 'Vote saved successfully', 
      cat 
    });
    
  } catch (error) {
    console.error('[API ERROR] Failed to save vote:', error);
    res.status(500).json({ 
      error: 'Unable to save vote. Please try again.' 
    });
  }
});

/**
 * GET /api/total-votes
 * Get the total number of votes across all cats
 * @returns {Object} { total_votes: number }
 */
app.get('/api/total-votes', async (req, res) => {
  try {
    const result = await query(
      'SELECT COALESCE(SUM(total_votes), 0)::int AS total_votes FROM cats'
    );
    
    res.json({ total_votes: result.rows[0].total_votes });
    
  } catch (error) {
    console.error('[API ERROR] Failed to get total votes:', error);
    res.status(500).json({ error: 'Unable to fetch vote count.' });
  }
});

// =============================================================================
// LEADERBOARD ENDPOINTS
// =============================================================================

/**
 * GET /api/leaderboard/top
 * Get the all-time most voted cat
 * @returns {Object} Cat with most total votes
 */
app.get('/api/leaderboard/top', async (req, res) => {
  try {
    const result = await query(`
      SELECT id, name, image_url, total_votes
      FROM cats
      WHERE total_votes > 0
      ORDER BY total_votes DESC
      LIMIT 1
    `);
    
    res.json(result.rows[0] || null);
    
  } catch (error) {
    console.error('[API ERROR] Failed to fetch top cat:', error);
    res.status(500).json({ error: 'Unable to fetch top cat.' });
  }
});

/**
 * GET /api/leaderboard/year
 * Get the cat with most votes this year
 * @returns {Object} Cat with votes_this_year count
 */
app.get('/api/leaderboard/year', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        c.id, 
        c.name, 
        c.image_url,
        COUNT(v.id)::int AS votes_this_year
      FROM cats c
      INNER JOIN votes v ON v.cat_id = c.id
      WHERE EXTRACT(YEAR FROM v.created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
      GROUP BY c.id
      ORDER BY votes_this_year DESC
      LIMIT 1
    `);
    
    res.json(result.rows[0] || null);
    
  } catch (error) {
    console.error('[API ERROR] Failed to fetch cat of the year:', error);
    res.status(500).json({ error: 'Unable to fetch cat of the year.' });
  }
});

/**
 * GET /api/leaderboard/month
 * Get the cat with most votes this month
 * @returns {Object} Cat with votes_this_month count
 */
app.get('/api/leaderboard/month', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        c.id, 
        c.name, 
        c.image_url,
        COUNT(v.id)::int AS votes_this_month
      FROM cats c
      INNER JOIN votes v ON v.cat_id = c.id
      WHERE DATE_TRUNC('month', v.created_at) = DATE_TRUNC('month', CURRENT_DATE)
      GROUP BY c.id
      ORDER BY votes_this_month DESC
      LIMIT 1
    `);
    
    res.json(result.rows[0] || null);
    
  } catch (error) {
    console.error('[API ERROR] Failed to fetch monthly cutest:', error);
    res.status(500).json({ error: 'Unable to fetch monthly cutest.' });
  }
});

/**
 * GET /api/leaderboard/day
 * Get the cat with most votes today
 * @returns {Object} Cat with votes_today count
 */
app.get('/api/leaderboard/day', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        c.id, 
        c.name, 
        c.image_url,
        COUNT(v.id)::int AS votes_today
      FROM cats c
      INNER JOIN votes v ON v.cat_id = c.id
      WHERE DATE(v.created_at) = CURRENT_DATE
      GROUP BY c.id
      ORDER BY votes_today DESC
      LIMIT 1
    `);
    
    res.json(result.rows[0] || null);
    
  } catch (error) {
    console.error('[API ERROR] Failed to fetch cat of the day:', error);
    res.status(500).json({ error: 'Unable to fetch cat of the day.' });
  }
});

/**
 * GET /api/leaderboard/random
 * Get 5 random cats that have received votes
 * @returns {Array} Array of 5 random cats
 */
app.get('/api/leaderboard/random', async (req, res) => {
  try {
    const result = await query(`
      SELECT id, name, image_url, total_votes
      FROM cats
      WHERE total_votes > 0
      ORDER BY RANDOM()
      LIMIT 5
    `);
    
    res.json(result.rows);
    
  } catch (error) {
    console.error('[API ERROR] Failed to fetch random cats:', error);
    res.status(500).json({ error: 'Unable to fetch random cats.' });
  }
});

// =============================================================================
// SEARCH AND INDIVIDUAL CAT ENDPOINTS
// =============================================================================

/**
 * GET /api/cat-search?q=searchterm
 * Search for cats by name
 * @query {string} q - Search term
 * @returns {Array} Matching cats (max 10)
 */
app.get('/api/cat-search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string' || q.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Please provide a search term.' 
      });
    }
    
    const searchTerm = q.trim();
    const result = await query(`
      SELECT id, name, image_url, total_votes
      FROM cats
      WHERE name ILIKE $1 AND total_votes > 0
      ORDER BY total_votes DESC
      LIMIT 10
    `, [`%${searchTerm}%`]);
    
    res.json(result.rows);
    
  } catch (error) {
    console.error('[API ERROR] Failed to search cats:', error);
    res.status(500).json({ error: 'Unable to search cats.' });
  }
});

/**
 * GET /api/cat/:id
 * Get details for a specific cat
 * @param {number} id - Cat ID
 * @returns {Object} Cat details
 */
app.get('/api/cat/:id', async (req, res) => {
  try {
    const catId = parseInt(req.params.id);
    
    if (isNaN(catId) || catId <= 0) {
      return res.status(400).json({ 
        error: 'Invalid cat ID.' 
      });
    }
    
    const result = await query(
      'SELECT * FROM cats WHERE id = $1',
      [catId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Cat not found.' 
      });
    }
    
    res.json(result.rows[0]);
    
  } catch (error) {
    console.error('[API ERROR] Failed to fetch cat:', error);
    res.status(500).json({ error: 'Unable to fetch cat details.' });
  }
});

// =============================================================================
// SERVER STARTUP
// =============================================================================

app.listen(PORT, () => {
  console.log('🐱 Cat Voting Server Started!');
  console.log(`📍 Server running at: http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`⏰ Started at: ${new Date().toLocaleString()}`);
  console.log('-------------------------------------------');
});

// Graceful shutdown handlers
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down...');
  process.exit(0);
});