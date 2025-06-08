-- Rename specific cats that got inappropriate names from the name generator
-- Run this with: psql -U your_user -d cute_or_not -f rename-specific-cats.sql

-- First, let's see what names these cats currently have
SELECT 'Current names of cats to be renamed:' as info;
SELECT id, name, hash, total_votes 
FROM cats 
WHERE hash IN (
    '8eb883a329397ae7223af9f359e925cd729ab61eeb95fc5c3e78068b5d6d327d',
    '944480b603b7c7dbada258e20bf97c2e765d01cc9d655c1ef59472a7738aab10',
    'c059cc0d2ae528881bfa754e8ef274ad8fe8a3cf46c595cfcaf924f9d9e8d983'
);

-- Update the cats with new, appropriate names
-- Feel free to change these names to whatever you prefer!

UPDATE cats 
SET name = 'Fluffy McFlufferson de Fluff'
WHERE hash = '8eb883a329397ae7223af9f359e925cd729ab61eeb95fc5c3e78068b5d6d327d';

UPDATE cats 
SET name = 'Sir Whiskers von Purrington III'
WHERE hash = '944480b603b7c7dbada258e20bf97c2e765d01cc9d655c1ef59472a7738aab10';

UPDATE cats 
SET name = 'Princess Purrfect von Cuddlefluff'
WHERE hash = 'c059cc0d2ae528881bfa754e8ef274ad8fe8a3cf46c595cfcaf924f9d9e8d983';

-- Verify the changes
SELECT 'Updated names:' as info;
SELECT id, name, hash, total_votes 
FROM cats 
WHERE hash IN (
    '8eb883a329397ae7223af9f359e925cd729ab61eeb95fc5c3e78068b5d6d327d',
    '944480b603b7c7dbada258e20bf97c2e765d01cc9d655c1ef59472a7738aab10',
    'c059cc0d2ae528881bfa754e8ef274ad8fe8a3cf46c595cfcaf924f9d9e8d983'
);

-- Alternative: Interactive rename script
-- Uncomment below if you want to see current names and decide on new ones manually

/*
\echo 'Cat 1 (hash ending ...d327d):'
SELECT name FROM cats WHERE hash = '8eb883a329397ae7223af9f359e925cd729ab61eeb95fc5c3e78068b5d6d327d';
\prompt 'Enter new name for Cat 1: ' new_name_1
UPDATE cats SET name = :'new_name_1' WHERE hash = '8eb883a329397ae7223af9f359e925cd729ab61eeb95fc5c3e78068b5d6d327d';

\echo 'Cat 2 (hash ending ...aab10):'
SELECT name FROM cats WHERE hash = '944480b603b7c7dbada258e20bf97c2e765d01cc9d655c1ef59472a7738aab10';
\prompt 'Enter new name for Cat 2: ' new_name_2
UPDATE cats SET name = :'new_name_2' WHERE hash = '944480b603b7c7dbada258e20bf97c2e765d01cc9d655c1ef59472a7738aab10';

\echo 'Cat 3 (hash ending ...d983):'
SELECT name FROM cats WHERE hash = 'c059cc0d2ae528881bfa754e8ef274ad8fe8a3cf46c595cfcaf924f9d9e8d983';
\prompt 'Enter new name for Cat 3: ' new_name_3
UPDATE cats SET name = :'new_name_3' WHERE hash = 'c059cc0d2ae528881bfa754e8ef274ad8fe8a3cf46c595cfcaf924f9d9e8d983';
*/