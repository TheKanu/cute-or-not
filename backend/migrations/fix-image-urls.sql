-- Fix Image URL Issues - Comprehensive Solution
-- Run this to fix all image URL problems

-- 1. Show current state
SELECT 'Current Image URL Status:' as info;
SELECT 
    COUNT(*) FILTER (WHERE image_url LIKE '/images/cats/%') as correct_urls,
    COUNT(*) FILTER (WHERE image_url LIKE '/images/%.jpg' AND image_url NOT LIKE '/images/cats/%') as wrong_directory,
    COUNT(*) FILTER (WHERE image_url = '/images/cats/\1') as broken_urls,
    COUNT(*) FILTER (WHERE image_url NOT LIKE '/images/%') as external_urls,
    COUNT(*) as total_cats
FROM cats;

-- 2. Show sample of problematic URLs
SELECT 'Sample of problematic URLs:' as info;
SELECT id, name, image_url, hash 
FROM cats 
WHERE image_url LIKE '/images/%.jpg' 
  AND image_url NOT LIKE '/images/cats/%'
LIMIT 10;

-- 3. Fix all broken URLs (regex capture group issues)
UPDATE cats 
SET image_url = '/images/cats/' || hash || '.jpg'
WHERE image_url = '/images/cats/\1' 
  AND hash IS NOT NULL 
  AND hash != '';

-- 4. Fix URLs in wrong directory (/images/ -> /images/cats/)
UPDATE cats 
SET image_url = '/images/cats/' || SUBSTRING(image_url FROM '/images/([^/]+\.jpg)$')
WHERE image_url ~ '^/images/[^/]+\.jpg$'  -- Match /images/xxx.jpg but not /images/cats/xxx.jpg
  AND hash IS NOT NULL 
  AND hash != '';

-- 5. Fix any remaining issues by reconstructing from hash
UPDATE cats 
SET image_url = '/images/cats/' || hash || '.jpg'
WHERE (
    image_url IS NULL 
    OR image_url = '' 
    OR image_url NOT LIKE '/images/cats/%.jpg'
  )
  AND hash IS NOT NULL 
  AND hash != ''
  AND image_url LIKE '/images/%';  -- Only fix local images, not external URLs

-- 6. Verify the fixes
SELECT 'After fixes:' as info;
SELECT 
    COUNT(*) FILTER (WHERE image_url LIKE '/images/cats/%') as correct_urls,
    COUNT(*) FILTER (WHERE image_url LIKE '/images/%.jpg' AND image_url NOT LIKE '/images/cats/%') as wrong_directory,
    COUNT(*) FILTER (WHERE image_url = '/images/cats/\1') as broken_urls,
    COUNT(*) FILTER (WHERE image_url NOT LIKE '/images/%') as external_urls,
    COUNT(*) as total_cats
FROM cats;

-- 7. Show sample of fixed URLs
SELECT 'Sample of fixed URLs:' as info;
SELECT id, name, image_url, hash 
FROM cats 
WHERE image_url LIKE '/images/cats/%'
ORDER BY id DESC
LIMIT 10;

-- 8. Create a function to ensure correct image URLs going forward
CREATE OR REPLACE FUNCTION ensure_correct_image_url()
RETURNS TRIGGER AS $$
BEGIN
    -- If image_url starts with /images/ but not /images/cats/, fix it
    IF NEW.image_url ~ '^/images/[^/]+\.jpg$' THEN
        NEW.image_url := '/images/cats/' || SUBSTRING(NEW.image_url FROM '/images/([^/]+\.jpg)$');
    END IF;
    
    -- If image_url is a regex capture reference, reconstruct from hash
    IF NEW.image_url = '/images/cats/\1' AND NEW.hash IS NOT NULL THEN
        NEW.image_url := '/images/cats/' || NEW.hash || '.jpg';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Create trigger to auto-fix URLs on insert/update
DROP TRIGGER IF EXISTS fix_image_url_trigger ON cats;
CREATE TRIGGER fix_image_url_trigger
BEFORE INSERT OR UPDATE OF image_url ON cats
FOR EACH ROW
EXECUTE FUNCTION ensure_correct_image_url();

-- 10. Test the trigger
SELECT 'Testing trigger with problematic URL:' as info;
-- This should auto-correct to /images/cats/testhash.jpg
UPDATE cats 
SET image_url = '/images/testhash.jpg' 
WHERE id = (SELECT id FROM cats LIMIT 1);

SELECT id, image_url 
FROM cats 
WHERE id = (SELECT id FROM cats LIMIT 1);