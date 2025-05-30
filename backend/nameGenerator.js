import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from './db.js';

// ES module path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths to word list files
const ADJECTIVES_PATH = path.join(__dirname, 'names', 'adjectives.txt');
const NOUNS_PATH = path.join(__dirname, 'names', 'nouns.txt');

/**
 * Load words from a text file (one word per line)
 * @param {string} filePath - Path to the word list file
 * @returns {string[]} - Array of words
 * @throws {Error} - If file is empty or cannot be read
 */
function loadWords(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const words = content
      .split('\n')
      .map(word => word.trim())
      .filter(word => word.length > 0); // Remove empty lines
    
    if (words.length === 0) {
      throw new Error(`Word list is empty: ${filePath}`);
    }
    
    console.log(`[NAME GENERATOR] Loaded ${words.length} words from ${path.basename(filePath)}`);
    return words;
    
  } catch (error) {
    console.error(`[NAME GENERATOR ERROR] Failed to load words from ${filePath}:`, error.message);
    throw error;
  }
}

// Load word lists at startup
let adjectives = [];
let nouns = [];

try {
  adjectives = loadWords(ADJECTIVES_PATH);
  nouns = loadWords(NOUNS_PATH);
} catch (error) {
  console.error('[NAME GENERATOR ERROR] Failed to initialize word lists:', error.message);
  // Fallback word lists if files cannot be loaded
  adjectives = ['Fluffy', 'Cute', 'Sleepy', 'Playful', 'Curious', 'Silly', 'Brave', 'Gentle'];
  nouns = ['Whiskers', 'Paws', 'Mittens', 'Shadow', 'Tiger', 'Luna', 'Felix', 'Mochi'];
}

/**
 * Generate a random cat name by combining an adjective and a noun
 * @returns {string} - Random cat name (e.g., "Fluffy Whiskers")
 */
function generateRandomName() {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adjective} ${noun}`;
}

/**
 * Generate a unique cat name that doesn't exist in the database
 * @param {number} maxAttempts - Maximum number of attempts before giving up
 * @returns {Promise<string>} - Unique cat name
 * @throws {Error} - If unable to generate unique name after max attempts
 */
export async function generateUniqueName(maxAttempts = 1000) {
  console.log('[NAME GENERATOR] Generating unique cat name...');
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const candidateName = generateRandomName();
    
    // Check if this name already exists in the database
    const existing = await query(
      'SELECT 1 FROM cats WHERE name = $1 LIMIT 1',
      [candidateName]
    );
    
    if (existing.rows.length === 0) {
      console.log(`[NAME GENERATOR] Generated unique name: "${candidateName}" (attempt ${attempt})`);
      return candidateName;
    }
    
    // Log every 100 attempts to track progress
    if (attempt % 100 === 0) {
      console.log(`[NAME GENERATOR] Still searching for unique name... (attempt ${attempt})`);
    }
  }
  
  // If we've exhausted all attempts, throw an error
  throw new Error(`Unable to generate unique cat name after ${maxAttempts} attempts. Consider adding more words to the word lists.`);
}

/**
 * Get statistics about available name combinations
 * @returns {Object} - Statistics object
 */
export function getNameStatistics() {
  const totalCombinations = adjectives.length * nouns.length;
  return {
    adjectiveCount: adjectives.length,
    nounCount: nouns.length,
    totalCombinations,
    adjectivesPath: ADJECTIVES_PATH,
    nounsPath: NOUNS_PATH
  };
}

/**
 * Reload word lists from files (useful for hot-reloading during development)
 * @returns {boolean} - True if successful, false otherwise
 */
export function reloadWordLists() {
  try {
    adjectives = loadWords(ADJECTIVES_PATH);
    nouns = loadWords(NOUNS_PATH);
    console.log('[NAME GENERATOR] Successfully reloaded word lists');
    return true;
  } catch (error) {
    console.error('[NAME GENERATOR ERROR] Failed to reload word lists:', error.message);
    return false;
  }
}