import fetch from 'node-fetch';
import crypto from 'crypto';
import { query } from './db.js';

/**
 * Calculate SHA-256 hash of an image from URL
 * Used to detect duplicate images even if they have different URLs
 * @param {string} url - Image URL to hash
 * @returns {Promise<string>} - SHA-256 hash of the image
 * @throws {Error} - If image cannot be fetched
 */
export async function getImageHash(url) {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // Convert response to buffer
    const data = await response.arrayBuffer();
    
    // Calculate SHA-256 hash
    const hash = crypto
      .createHash('sha256')
      .update(Buffer.from(data))
      .digest('hex');
    
    console.log(`[CAT SERVICE] Generated hash for ${url}: ${hash.substring(0, 8)}...`);
    return hash;
    
  } catch (error) {
    console.error(`[CAT SERVICE ERROR] Failed to hash image from ${url}:`, error.message);
    throw new Error('Failed to fetch image for hashing');
  }
}

/**
 * Download an image from URL and return as Buffer
 * @param {string} url - Image URL to download
 * @returns {Promise<Buffer>} - Image data as Buffer
 * @throws {Error} - If image cannot be downloaded
 */
export async function downloadImage(url) {
  try {
    console.log(`[CAT SERVICE] Downloading image from ${url}`);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log(`[CAT SERVICE] Successfully downloaded image (${buffer.length} bytes)`);
    return buffer;
    
  } catch (error) {
    console.error(`[CAT SERVICE ERROR] Failed to download image from ${url}:`, error.message);
    throw new Error('Failed to download image');
  }
}

/**
 * Find existing cat by image hash or create a new entry
 * This prevents duplicate cats in the database even if the same image has different URLs
 * @param {string} image_url - URL of the cat image
 * @returns {Promise<Object>} - Cat object from database
 * @throws {Error} - If database operation fails
 */
export async function findOrCreateCat(image_url) {
  try {
    // First, calculate the hash of the image
    const hash = await getImageHash(image_url);
    
    // Check if a cat with this hash already exists
    const existingCat = await query(
      'SELECT * FROM cats WHERE hash = $1',
      [hash]
    );
    
    if (existingCat.rows.length > 0) {
      console.log(`[CAT SERVICE] Found existing cat with hash ${hash.substring(0, 8)}...`);
      return existingCat.rows[0];
    }
    
    // If not, create a new cat entry
    // Note: We initially only store the hash and original URL
    // The local image, name, and initial votes are added when the first vote is cast
    const newCat = await query(
      `INSERT INTO cats (hash, image_url, cute_score, total_votes) 
       VALUES ($1, $2, 0, 0) 
       RETURNING *`,
      [hash, image_url]
    );
    
    console.log(`[CAT SERVICE] Created new cat entry with ID ${newCat.rows[0].id}`);
    return newCat.rows[0];
    
  } catch (error) {
    console.error('[CAT SERVICE ERROR] Failed to find or create cat:', error.message);
    throw error;
  }
}

/**
 * Get a cat by its ID
 * @param {number} id - Cat ID
 * @returns {Promise<Object|null>} - Cat object or null if not found
 */
export async function getCatById(id) {
  try {
    const result = await query(
      'SELECT * FROM cats WHERE id = $1',
      [id]
    );
    
    return result.rows[0] || null;
    
  } catch (error) {
    console.error(`[CAT SERVICE ERROR] Failed to get cat by ID ${id}:`, error.message);
    throw error;
  }
}

/**
 * Update cat's local image URL after downloading
 * @param {number} id - Cat ID
 * @param {string} localImageUrl - Local URL path for the downloaded image
 * @returns {Promise<Object>} - Updated cat object
 */
export async function updateCatImageUrl(id, localImageUrl) {
  try {
    const result = await query(
      'UPDATE cats SET image_url = $1 WHERE id = $2 RETURNING *',
      [localImageUrl, id]
    );
    
    console.log(`[CAT SERVICE] Updated cat ${id} with local image URL: ${localImageUrl}`);
    return result.rows[0];
    
  } catch (error) {
    console.error(`[CAT SERVICE ERROR] Failed to update cat image URL:`, error.message);
    throw error;
  }
}