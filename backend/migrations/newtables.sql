/* 
-- Drop existing tables if needed
DROP TABLE IF EXISTS votes CASCADE;
DROP TABLE IF EXISTS cats CASCADE;
*/

-- Create cats table
CREATE TABLE cats (
  id SERIAL PRIMARY KEY,
  hash VARCHAR(64) UNIQUE NOT NULL,
  image_url TEXT NOT NULL,
  name VARCHAR(255),
  cute_score INTEGER DEFAULT 0,
  total_votes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on hash for faster lookups
CREATE INDEX idx_cats_hash ON cats(hash);
CREATE INDEX idx_cats_name ON cats(name);

-- Create votes table
CREATE TABLE votes (
  id SERIAL PRIMARY KEY,
  cat_id INTEGER NOT NULL REFERENCES cats(id) ON DELETE CASCADE,
  is_cute BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for time-based queries
CREATE INDEX idx_votes_created_at ON votes(created_at);
CREATE INDEX idx_votes_cat_id ON votes(cat_id);
CREATE INDEX idx_votes_cat_created ON votes(cat_id, created_at);