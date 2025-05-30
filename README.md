# 😺 Cute or Not - Cat Voting App

A delightful **Node.js + Express + PostgreSQL** application where users vote on random cat images to determine "Who's the cutest?" Features real-time leaderboards, themed UI, and weekend countdown functionality.

![Cat Voting Demo](https://via.placeholder.com/800x400/f97316/ffffff?text=Cute+or+Not+Demo)

## ✨ Features

### Core Functionality
- **Random Cat Voting**: Fetches adorable cat images from [CATAAS](https://cataas.com)
- **Smart Duplicate Prevention**: Uses SHA-256 image hashing to avoid duplicate cats
- **Auto-naming**: Generates unique names using adjectives + nouns for first-time cats
- **Rate Limiting**: Prevents spam with 15 votes per minute per IP
- **Keyboard Navigation**: Use arrow keys (← →) for quick voting

### Leaderboards & Stats
- 🏆 **Top Cutest Cat** (all-time champion)
- 📅 **Cat of the Year** (most votes this year)
- 🗓️ **Monthly Cutest** (hottest cat this month)
- ⭐ **Cat of the Day** (today's favorite)
- 🎲 **5 Random Cats** (discover hidden gems)
- 🔍 **Search by Name** (find your favorite)

### UI/UX Enhancements
- **Responsive Design**: Beautiful on desktop and mobile
- **Theme System**: Halloween, Christmas, and default themes with drag-and-drop
- **Weekend Countdown**: Business hours countdown to Friday 3:30 PM
- **QR Code Integration**: Easy mobile voting access
- **Smooth Animations**: Polished transitions and hover effects
- **Custom Cat Paw Cursors**: Randomly selected on each page load

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- PostgreSQL 12+
- Git

### 1. Clone Repository
```bash
git clone https://github.com/thekanu/cute-or-not.git
cd cute-or-not
```

### 2. Environment Setup
Create `.env` file in project root:
```env
# Database Configuration
DB_USER=your_postgres_username
DB_HOST=localhost
DB_NAME=cute_or_not
DB_PASSWORD=your_secure_password
DB_PORT=5432

# Server Configuration (optional)
PORT=3000
```

> 🔒 **Security Note**: Never commit your `.env` file - it's already in `.gitignore`

### 3. Install Dependencies
```bash
npm install
```

### 4. Database Setup

#### Create Database
```sql
CREATE DATABASE cute_or_not;
```

#### Create Tables
```sql
-- Cats table - stores cat information and vote statistics
CREATE TABLE cats (
    id SERIAL PRIMARY KEY,
    hash TEXT UNIQUE NOT NULL,           -- SHA-256 hash for duplicate prevention
    name TEXT,                           -- Auto-generated cute name
    image_url TEXT,                      -- Local or external image URL
    cute_score INTEGER DEFAULT 0 NOT NULL,    -- Number of "cute" votes
    total_votes INTEGER DEFAULT 0 NOT NULL,   -- Total votes received
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Votes table - detailed voting history with timestamps
CREATE TABLE votes (
    id SERIAL PRIMARY KEY,
    cat_id INTEGER NOT NULL REFERENCES cats(id) ON DELETE CASCADE,
    is_cute BOOLEAN NOT NULL,            -- true = cute vote, false = not cute
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 5. Launch Application
```bash
npm start
```

Visit **http://localhost:3000** and start voting for the cutest cats! 🐱

## 📱 How to Use

### Voting
1. **Desktop**: Click vote buttons or use arrow keys (← →)
2. **Mobile**: Tap vote buttons or scan QR code for easy access
3. **Rate Limit**: Maximum 15 votes per minute per IP address

### Exploring Leaderboards
1. Click "🏆 Show Leaderboard" to reveal all categories
2. Click on any cat to view detailed statistics
3. Use search to find cats by name

### Themes & Customization
1. Hover near the right edge to access settings panel
2. Enable theme selector and drag themes onto the page
3. Toggle weekend countdown, QR codes, and display options

## 🛠️ API Reference

| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| `GET` | `/api/cat` | Get random cat image URL | `{image_url: string}` |
| `POST` | `/api/vote` | Submit vote | `{message: string, cat: object}` |
| `GET` | `/api/total-votes` | Get total vote count | `{total_votes: number}` |
| `GET` | `/api/leaderboard/top` | Top cutest cat (all-time) | `Cat object` |
| `GET` | `/api/leaderboard/year` | Cat of the year | `Cat object` |
| `GET` | `/api/leaderboard/month` | Monthly cutest cat | `Cat object` |
| `GET` | `/api/leaderboard/day` | Cat of the day | `Cat object` |
| `GET` | `/api/leaderboard/random` | 5 random cats | `Cat[]` |
| `GET` | `/api/cat-search?q=<query>` | Search cats by name | `Cat[]` |
| `GET` | `/api/cat/:id` | Get specific cat details | `Cat object` |

### Vote Payload
```json
{
  "image_url": "https://cataas.com/cat/...",
  "is_cute": true
}
```

## 🏗️ Project Structure

```
cute-or-not/
├── backend/
│   ├── index.js          # Main Express server
│   ├── db.js             # PostgreSQL connection
│   ├── catService.js     # Cat image handling
│   ├── voteService.js    # Vote processing logic
│   ├── nameGenerator.js  # Unique name generation
│   ├── images/           # Local cat image cache
│   └── names/            # Word lists for name generation
│       ├── adjectives.txt
│       └── nouns.txt
├── frontend/
│   ├── index.html       # Main voting interface
│   ├── cat.html         # Individual cat detail page
│   └── images/          # Static assets (cursors, icons, etc.)
├── .env                 # Environment variables (create this)
├── package.json
└── README.md
```

## 🎨 Themes

The app includes three beautiful themes:

- **🎃 Halloween**: Spooky orange and dark colors
- **🎄 Christmas**: Festive red and green with animated snowflakes
- **🌟 Default**: Clean orange and dark theme

### Adding Custom Themes
1. Add theme variables to CSS `:root` or `[data-theme="your-theme"]`
2. Update the theme selector in the HTML
3. Add any special effects (like Christmas snowflakes) in JavaScript

## 🧰 Maintenance & Administration

### Reset All Votes
```sql
BEGIN;
TRUNCATE TABLE votes RESTART IDENTITY CASCADE;
UPDATE cats SET cute_score = 0, total_votes = 0;
COMMIT;
```

### View Top Performers
```sql
SELECT name, total_votes, 
       ROUND((cute_score::decimal / NULLIF(total_votes,0))*100) AS cute_percentage
FROM cats 
WHERE total_votes > 5 
ORDER BY cute_percentage DESC, total_votes DESC 
LIMIT 10;
```

### Database Health Check
```sql
-- Check for orphaned votes
SELECT COUNT(*) FROM votes v 
LEFT JOIN cats c ON v.cat_id = c.id 
WHERE c.id IS NULL;

-- View voting activity by day
SELECT DATE(created_at) as vote_date, COUNT(*) as daily_votes
FROM votes 
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY vote_date DESC;
```

## 🤝 Contributing

We love contributions! Here's how to get started:

1. **Fork** this repository
2. **Create** a feature branch: `git checkout -b feature/amazing-cats`
3. **Make** your changes and add tests if applicable
4. **Commit** with clear messages: `git commit -m "feat: add cat mood detection"`
5. **Push** to your fork: `git push origin feature/amazing-cats`
6. **Open** a Pull Request with a detailed description

### Development Guidelines
- Follow existing code style and naming conventions
- Add comments for complex logic
- Test your changes thoroughly
- Update documentation for new features

## 🐛 Troubleshooting

### Common Issues

**Cats not loading?**
- Check if CATAAS service is available: https://cataas.com
- Verify network connectivity and firewall settings

**Database connection errors?**
- Ensure PostgreSQL is running: `sudo service postgresql status`
- Verify credentials in `.env` file
- Check database exists: `psql -l | grep cute_or_not`

**Images not displaying?**
- Check if `backend/images` directory exists and is writable
- Verify image download and caching logic in `catService.js`

**Rate limiting too strict?**
- Adjust limits in `backend/index.js` voteLimiter configuration
- Consider IP whitelisting for development

## 🏷️ Changelog

### v2.0.0 (Current)
- ✨ Added theme system with Halloween and Christmas themes
- 🎯 Improved UI with better responsive design
- ⌨️ Keyboard navigation support
- 📱 QR code integration for mobile voting
- ⏰ Weekend countdown feature
- 🎨 Custom cat paw cursors
- 🔧 Code refactoring and better documentation

### v1.0.0
- 🎉 Initial release with basic voting functionality
- 📊 Leaderboard system
- 🔍 Search functionality
- 💾 PostgreSQL integration

## 📄 License

MIT License - Feel free to use this project for learning, fun, or commercial purposes!

## 🙏 Acknowledgments

- **[CATAAS](https://cataas.com)** - Providing endless adorable cat images
- **Tailwind CSS** - Making styling a breeze
- **PostgreSQL** - Reliable data storage
- **The Internet** - For loving cats as much as we do

---

**Ready to find the cutest cat on the internet?** 🐱✨

[Live Demo](https://cat.catto.com) | [Report Bug](https://github.com/thekanu/cute-or-not/issues) | [Request Feature](https://github.com/thekanu/cute-or-not/issues)
