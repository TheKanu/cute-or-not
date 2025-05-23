“Cute or Not” Cat Voting App
A lightweight Node.js + Express + PostgreSQL application that lets users vote on random cat images (“Who’s the cutest?”) and view leaderboards for:

Top Cutest Cat (all time)

Cat of the Year (votes this year)

Monthly Cutest (votes this month)

Cat of the Day (votes today)

5 Random Cats

Search by Name

Features
Fetches random cat images from https://cataas.com

Stores each cat’s SHA-256 image hash to avoid duplicates

First vote for a new cat triggers:

Download & local caching of the image

Random adjective+noun name generation

Vote history tracked in a votes table (with timestamps)

Rate-limit: max 15 votes per minute per IP

Frontend built with Tailwind CSS

Quick Start
Clone & enter project

git clone git@github.com:TheKanu/cute-or-not.git
cd cute-or-not

Create & configure .env

In the project root, create a file named .env:

PostgreSQL
DB_USER=your_db_username
DB_HOST=localhost
DB_NAME=cute_or_not
DB_PASSWORD=your_db_password
DB_PORT=5432

Optional: override Express port (default 3000)
PORT=3000

Never commit your .env — it’s already in .gitignore.

Install dependencies

npm install

Initialize your database

Create the database:

CREATE DATABASE cute_or_not;

Create the tables:

-- cats table
CREATE TABLE cats (
id SERIAL PRIMARY KEY,
hash TEXT UNIQUE NOT NULL,
name TEXT,
image_url TEXT,
cute_score INTEGER DEFAULT 0 NOT NULL,
total_votes INTEGER DEFAULT 0 NOT NULL,
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- votes table
CREATE TABLE votes (
id SERIAL PRIMARY KEY,
cat_id INTEGER NOT NULL REFERENCES cats(id) ON DELETE CASCADE,
is_cute BOOLEAN NOT NULL,
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

(Optional) Add created_at to existing votes table:

ALTER TABLE votes
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

Run the app

npm start

Visit http://localhost:3000 and start voting!

API Endpoints
Method	Path	Description
GET	/api/cat	Fetch a random cat image URL (from CATAAS)
POST	/api/vote	Submit a vote { image_url, is_cute }
GET	/api/leaderboard	Top 10 all-time cutest (legacy)
GET	/api/total-votes	Total votes across all cats
GET	/api/leaderboard/top	Single top cutest cat (all time)
GET	/api/leaderboard/year	Cat of the Year (votes this year)
GET	/api/leaderboard/month	Monthly Cutest (votes this month)
GET	/api/leaderboard/day	Cat of the Day (votes today)
GET	/api/leaderboard/random	5 Random Cats
GET	/api/cat-search?q=<query>	Search by cat name (ILIKE, top 10 results)
GET	/api/cat/:id	Get details for one cat by ID

Frontend
index.html: Main voting grid, global vote counter, leaderboard toggle

cat.html: Detail page for a single cat (with per-period vote counts)

Built with Tailwind CSS via CDN

Useful SQL Scripts
Reset all votes & counters:

BEGIN;
TRUNCATE TABLE votes RESTART IDENTITY;
UPDATE cats
SET cute_score = 0,
total_votes = 0;
COMMIT;

Add timestamp to votes (if missing):

ALTER TABLE votes
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

Contributing
Fork this repo

Create a feature branch (git checkout -b feat/my-feature)

Commit your changes (git commit -m "feat: add awesome feature")

Push (git push origin feat/my-feature)

Open a Pull Request

License
MIT License
This project is for learning/demo purposes – adjust as needed.

Enjoy voting on the cutest cats! 😸