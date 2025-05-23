BEGIN;

-- 1) Delete all vote records and reset the votes table’s serial/identity
TRUNCATE TABLE votes RESTART IDENTITY;

-- 2) Reset every cat’s scores
UPDATE cats
SET cute_score  = 0,
    total_votes = 0;

COMMIT;
