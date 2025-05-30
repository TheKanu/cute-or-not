import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { findOrCreateCat, downloadImage } from './catService.js';
import { query, getClient } from './db.js';
import { generateUniqueName } from './nameGenerator.js';

// ES module path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Images directory path - using /images/cats as requested
const IMAGES_DIR = path.join(__dirname, '..', 'frontend', 'images', 'cats');

// Ensure images directory exists
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
  console.log('[VOTE SERVICE] Created images directory:', IMAGES_DIR);
}

/**
 * Process a vote for a cat image
 * Handles both new cats (first vote) and existing cats (subsequent votes)
 * @param {string} image_url - URL of the cat image being voted on
 * @param {boolean} is_cute - Whether the vote is "cute" (true) or "not cute" (false)
 * @returns {Promise<Object>} - Cat object with updated vote counts
 * @throws {Error} - If vote processing fails
 */
export async function saveVote(image_url, is_cute) {
  console.log(`[VOTE SERVICE] Processing vote for ${image_url} - cute: ${is_cute}`);
  
  // Use database transaction for data consistency
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    // Find or create the cat entry
    let cat = await findOrCreateCat(image_url);
    
    // Check if this is the first vote for this cat
    const isFirstVote = cat.cute_score === 0 && cat.total_votes === 0;
    
    if (isFirstVote) {
      console.log(`[VOTE SERVICE] First vote for cat ID ${cat.id} - initializing cat data`);
      
      // Download and save the image locally
      const imageBuffer = await downloadImage(image_url);
      const filename = `${cat.hash}.jpg`;
      const imagePath = path.join(IMAGES_DIR, filename);
      
      // Save image to disk
      fs.writeFileSync(imagePath, imageBuffer);
      console.log(`[VOTE SERVICE] Saved image to ${imagePath}`);
      
      // Generate the local URL path (served by Express static middleware)
      const localImageUrl = `/images/cats/${filename}`;
      
      // Generate a unique name for the cat
      const catName = await generateUniqueName();
      
      // Update cat with local image URL, name, and initial vote
      const updateResult = await client.query(
        `UPDATE cats
         SET image_url = $1,
             name = $2,
             cute_score = $3,
             total_votes = 1
         WHERE id = $4
         RETURNING *`,
        [localImageUrl, catName, is_cute ? 1 : 0, cat.id]
      );
      
      cat = updateResult.rows[0];
      console.log(`[VOTE SERVICE] Initialized cat "${catName}" with local image`);
      
    } else {
      // For existing cats, just increment the vote counters
      console.log(`[VOTE SERVICE] Adding vote to existing cat ID ${cat.id} (${cat.name})`);
      
      const newCuteScore = cat.cute_score + (is_cute ? 1 : 0);
      const newTotalVotes = cat.total_votes + 1;
      
      const updateResult = await client.query(
        `UPDATE cats
         SET cute_score = $1,
             total_votes = $2
         WHERE id = $3
         RETURNING *`,
        [newCuteScore, newTotalVotes, cat.id]
      );
      
      cat = updateResult.rows[0];
    }
    
    // Record the individual vote in the votes table
    await client.query(
      `INSERT INTO votes (cat_id, is_cute, created_at) 
       VALUES ($1, $2, NOW())`,
      [cat.id, is_cute]
    );
    
    // Commit the transaction
    await client.query('COMMIT');
    
    console.log(`[VOTE SERVICE] Successfully saved vote for "${cat.name}" - Total votes: ${cat.total_votes}`);
    
    // Return the updated cat data
    return {
      id: cat.id,
      name: cat.name,
      image_url: cat.image_url,
      cute_score: cat.cute_score,
      total_votes: cat.total_votes,
      cute_percentage: cat.total_votes > 0 
        ? Math.round((cat.cute_score / cat.total_votes) * 100) 
        : 0
    };
    
  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    console.error('[VOTE SERVICE ERROR] Failed to save vote:', error.message);
    throw error;
    
  } finally {
    // Always release the client back to the pool
    client.release();
  }
}

/**
 * Get vote statistics for a specific time period
 * @param {string} period - Time period ('day', 'week', 'month', 'year', 'all')
 * @returns {Promise<Object>} - Vote statistics
 */
export async function getVoteStatistics(period = 'all') {
  try {
    let whereClause = '';
    
    switch (period) {
      case 'day':
        whereClause = "WHERE v.created_at >= NOW() - INTERVAL '1 day'";
        break;
      case 'week':
        whereClause = "WHERE v.created_at >= NOW() - INTERVAL '1 week'";
        break;
      case 'month':
        whereClause = "WHERE v.created_at >= NOW() - INTERVAL '1 month'";
        break;
      case 'year':
        whereClause = "WHERE v.created_at >= NOW() - INTERVAL '1 year'";
        break;
      default:
        whereClause = '';
    }
    
    const result = await query(`
      SELECT 
        COUNT(DISTINCT v.cat_id) as unique_cats_voted,
        COUNT(v.id) as total_votes,
        SUM(CASE WHEN v.is_cute THEN 1 ELSE 0 END) as cute_votes,
        SUM(CASE WHEN NOT v.is_cute THEN 1 ELSE 0 END) as not_cute_votes
      FROM votes v
      ${whereClause}
    `);
    
    const stats = result.rows[0];
    
    return {
      period,
      uniqueCatsVoted: parseInt(stats.unique_cats_voted),
      totalVotes: parseInt(stats.total_votes),
      cuteVotes: parseInt(stats.cute_votes),
      notCuteVotes: parseInt(stats.not_cute_votes),
      cutePercentage: stats.total_votes > 0 
        ? Math.round((stats.cute_votes / stats.total_votes) * 100)
        : 0
    };
    
  } catch (error) {
    console.error('[VOTE SERVICE ERROR] Failed to get vote statistics:', error.message);
    throw error;
  }
}

/**
 * Clean up orphaned images (images on disk without corresponding database entries)
 * @returns {Promise<Object>} - Cleanup statistics
 */
export async function cleanupOrphanedImages() {
  try {
    console.log('[VOTE SERVICE] Starting orphaned image cleanup...');
    
    // Get all image files from disk
    const files = fs.readdirSync(IMAGES_DIR)
      .filter(file => file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.png'));
    
    // Get all hashes from database
    const dbResult = await query('SELECT hash FROM cats WHERE image_url LIKE $1', ['/images/cats/%']);
    const dbHashes = new Set(dbResult.rows.map(row => row.hash));
    
    let deletedCount = 0;
    const orphanedFiles = [];
    
    // Check each file
    for (const file of files) {
      const hash = path.basename(file, path.extname(file));
      
      if (!dbHashes.has(hash)) {
        orphanedFiles.push(file);
        const filePath = path.join(IMAGES_DIR, file);
        fs.unlinkSync(filePath);
        deletedCount++;
        console.log(`[VOTE SERVICE] Deleted orphaned image: ${file}`);
      }
    }
    
    console.log(`[VOTE SERVICE] Cleanup complete. Deleted ${deletedCount} orphaned images.`);
    
    return {
      totalFiles: files.length,
      orphanedFiles: orphanedFiles,
      deletedCount: deletedCount
    };
    
  } catch (error) {
    console.error('[VOTE SERVICE ERROR] Failed to cleanup orphaned images:', error.message);
    throw error;
  }
}