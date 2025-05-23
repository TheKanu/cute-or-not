import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const ADJ_PATH  = path.join(__dirname, 'names', 'adjectives.txt');
const NOUN_PATH = path.join(__dirname, 'names', 'nouns.txt');

function loadWords(filePath) {
  const list = fs.readFileSync(filePath, 'utf-8')
                 .split('\n')
                 .map(w => w.trim())
                 .filter(Boolean);
  if (list.length === 0) {
    throw new Error(`Wortliste leer oder nicht gefunden: ${filePath}`);
  }
  return list;
}

const adjectives = loadWords(ADJ_PATH);
const nouns      = loadWords(NOUN_PATH);

function generateCandidate() {
  const adj  = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adj} ${noun}`;
}

export async function generateUniqueName() {
  const maxAttempts = 1000;
  for (let i = 0; i < maxAttempts; i++) {
    const name = generateCandidate();
    const { rows } = await query('SELECT 1 FROM cats WHERE name = $1', [name]);
    if (rows.length === 0) {
      return name;
    }
  }
  throw new Error(`Keine einzigartigen Katzennamen nach ${maxAttempts} Versuchen gefunden.`);
}
