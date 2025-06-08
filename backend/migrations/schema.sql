-- Migration to fix existing database issues

-- 1. First, let's check what we have
SELECT 'Checking broken image URLs...' as status;
SELECT COUNT(*) as broken_urls FROM cats WHERE image_url = '/images/cats/\1';

-- 2. Fix broken image URLs (reconstruct from hash)
-- WICHTIG: Hier war der Fehler - es wurde '/images/' statt '/images/cats/' verwendet
UPDATE cats 
SET image_url = '/images/cats/' || hash || '.jpg'
WHERE image_url = '/images/cats/\1' 
  AND hash IS NOT NULL 
  AND hash != '';

-- 2b. ZUSÄTZLICH: Korrigiere auch falsche URLs die bereits in /images/ statt /images/cats/ sind
UPDATE cats 
SET image_url = '/images/cats/' || SUBSTRING(image_url FROM '/images/(.+\.jpg)$')
WHERE image_url LIKE '/images/%.jpg' 
  AND image_url NOT LIKE '/images/cats/%'
  AND hash IS NOT NULL 
  AND hash != '';

-- 3. Add missing constraints to cats table
ALTER TABLE cats 
  ALTER COLUMN hash SET NOT NULL;

-- Add UNIQUE constraint on hash (nur wenn noch nicht vorhanden)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'cats_hash_unique'
  ) THEN
    ALTER TABLE cats ADD CONSTRAINT cats_hash_unique UNIQUE (hash);
  END IF;
END $$;

-- 4. Fix votes table
-- Make cat_id NOT NULL
DELETE FROM votes WHERE cat_id IS NULL;  -- Remove any orphaned votes first
ALTER TABLE votes 
  ALTER COLUMN cat_id SET NOT NULL;

-- Change created_at to timestamptz for consistency
ALTER TABLE votes 
  ALTER COLUMN created_at TYPE timestamp with time zone;

-- 5. Add performance indexes (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_cats_hash ON cats(hash);
CREATE INDEX IF NOT EXISTS idx_cats_name ON cats(name);
CREATE INDEX IF NOT EXISTS idx_cats_total_votes ON cats(total_votes DESC);
CREATE INDEX IF NOT EXISTS idx_votes_created_at ON votes(created_at);
CREATE INDEX IF NOT EXISTS idx_votes_cat_id ON votes(cat_id);
CREATE INDEX IF NOT EXISTS idx_votes_cat_created ON votes(cat_id, created_at);

-- 6. Verify the fixes
SELECT 'After fixes - Broken URLs remaining:' as status;
SELECT COUNT(*) as broken_urls FROM cats WHERE image_url = '/images/cats/\1';

SELECT 'URLs in wrong directory:' as status;
SELECT COUNT(*) as wrong_dir FROM cats 
WHERE image_url LIKE '/images/%.jpg' 
  AND image_url NOT LIKE '/images/cats/%';

SELECT 'Sample of fixed cats:' as status;
SELECT id, name, image_url, hash FROM cats WHERE hash IS NOT NULL LIMIT 5;

-- 7. Show final structure
\d cats
\d votes