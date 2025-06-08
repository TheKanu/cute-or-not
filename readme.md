# 🐱 Cute or Not - Cat Voting App

A fun web application where users can vote for the cutest cats! The app displays random cat images from [CATAAS](https://cataas.com) and allows voting for your favorites.

![Node.js](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-%3E%3D12-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 📸 Screenshots & Features

- **Voting Interface**: Two cats side-by-side - vote with click or arrow keys
- **Leaderboards**: Daily, Monthly, Yearly, and All-Time champions
- **Naming System**: Each cat receives a unique, funny name
- **Themes**: 6 different color themes to choose from
- **Search Function**: Find cats by name
- **Rate Limiting**: Fair voting (15 votes per minute)

## 🚀 Prerequisites

- **Node.js** v14 or higher
- **PostgreSQL** v12 or higher
- **npm** or **yarn**
- Git

## 📦 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/thekanu/cute-or-not.git
cd cute-or-not
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set up PostgreSQL Database

```bash
# Start PostgreSQL (if not already running)
# macOS: brew services start postgresql
# Linux: sudo systemctl start postgresql

# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE cute_or_not;

# Create user (optional)
CREATE USER catvoter WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE cute_or_not TO catvoter;

# Exit PostgreSQL
\q
```

### 4. Initialize Database Schema

```bash
# With postgres user
psql -U postgres -d cute_or_not -f backend/migrations/newtables.sql

# OR with custom user
psql -U catvoter -d cute_or_not -f backend/migrations/newtables.sql
```

### 5. Configure Environment Variables

```bash
# Create .env file
cp example.env .env
```

Edit the `.env` file with your database credentials:

```env
# Database Configuration
DB_USER=catvoter              # or postgres
DB_HOST=localhost
DB_NAME=cute_or_not
DB_PASSWORD=your_secure_password
DB_PORT=5432

# Server Configuration
PORT=3000
```

### 6. Create Directory Structure

```bash
# Run setup script
chmod +x setup.sh
./setup.sh

# OR manually:
mkdir -p backend/images/cats
mkdir -p backend/images/not_cats
```

### 7. Start the Server

```bash
# Production
npm start

# Development (with auto-reload)
npm run dev
```

The app is now available at: `http://localhost:3000`

## 🎮 Usage

### Voting

1. **Open the app** in your browser
2. **Choose a cat** by clicking the "Vote Cute" button
3. **Keyboard shortcuts**: 
   - `←` (Left arrow): Vote for left cat
   - `→` (Right arrow): Vote for right cat

### Change Themes

Click the **colored circles** in the top right to switch between 6 different themes:
- 🟠 Default (Orange)
- 🔵 Ocean (Blue)
- 🔴 Sunset (Red)
- 🟢 Forest (Green)
- 🟣 Galaxy (Purple)
- 🩷 Candy (Pink)

### Leaderboard

Click **"🏆 Show Leaderboard"** to see:
- 👑 **All-Time Cutest Cat**: The cat with the most votes overall
- 📅 **Cat of the Year**: Annual champion
- 📆 **Monthly Champion**: Monthly winner
- ⭐ **Today's Star**: Daily winner
- 🎲 **Random Cuties**: 5 random cats to discover

### Search for Cats

1. Open the leaderboard
2. Scroll to the **search section**
3. Enter a name or part of a name
4. Press Enter or click "Search"

### Cat Detail Page

Click on any cat in the leaderboard to see its detail page with:
- Large image
- Full name
- Vote statistics

## 🛠️ Configuration

### Database Connection

Database connection is configured via environment variables in `.env`. Ensure PostgreSQL is running and credentials are correct.

### Change Port

By default, the app runs on port 3000. You can change this in `.env`:

```env
PORT=8080
```

### Adjust Rate Limiting

In `backend/index.js` you'll find the rate limit configuration:

```javascript
const voteLimiter = rateLimit({
  windowMs: 60 * 1000,    // 1 minute
  max: 15,                // Max 15 votes per minute
});
```

## 🗂️ Project Structure

```
cute-or-not/
├── backend/
│   ├── images/           # Stored cat images
│   │   ├── cats/        # Voting cat images (ignored by Git)
│   │   └── not_cats/    # Static assets (icons, etc.)
│   ├── migrations/      # SQL migrations
│   ├── names/          # Word lists for name generation
│   ├── index.js        # Express server
│   ├── db.js          # Database connection
│   ├── catService.js  # Cat management
│   ├── voteService.js # Vote processing
│   └── nameGenerator.js # Name generation
├── frontend/
│   ├── index.html     # Main page
│   └── cat.html       # Cat detail page
├── .env               # Environment variables (not in Git)
├── .gitignore        # Git ignores
├── package.json      # NPM dependencies
└── README.md         # This file
```

## 🔧 Troubleshooting

### "Database connection failed"

1. Check if PostgreSQL is running:
   ```bash
   # macOS/Linux
   ps aux | grep postgres
   
   # Or with systemctl
   sudo systemctl status postgresql
   ```

2. Test the connection:
   ```bash
   psql -U your_user -d cute_or_not -c "SELECT 1;"
   ```

3. Check `.env` file for typos

### "Images not displaying"

1. Ensure the `backend/images/cats/` directory exists
2. Check write permissions:
   ```bash
   ls -la backend/images/
   ```
3. Check server logs for errors

### "Too many votes" error

This is rate limiting in action. Wait a minute and try again.

### Reset Database

```bash
# WARNING: This deletes all data!
psql -U your_user -d cute_or_not

DROP TABLE IF EXISTS votes CASCADE;
DROP TABLE IF EXISTS cats CASCADE;

# Then reload schema
\i backend/migrations/newtables.sql
```

## 🚀 Deployment

### With PM2 (recommended)

```bash
# Install PM2
npm install -g pm2

# Start app
pm2 start backend/index.js --name cute-or-not

# Set up auto-start
pm2 startup
pm2 save
```

### With systemd

Create `/etc/systemd/system/cute-or-not.service`:

```ini
[Unit]
Description=Cute or Not Cat Voting App
After=network.target

[Service]
Type=simple
User=your_user
WorkingDirectory=/path/to/cute-or-not
ExecStart=/usr/bin/node backend/index.js
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable cute-or-not
sudo systemctl start cute-or-not
```

### Reverse Proxy with Nginx

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📊 Database Schema

### Table: cats
- `id` - Primary Key
- `hash` - SHA256 hash of the image (unique)
- `image_url` - Local URL of the stored image
- `name` - Generated name
- `cute_score` - Number of "cute" votes
- `total_votes` - Total number of votes
- `created_at` - Creation timestamp

### Table: votes
- `id` - Primary Key
- `cat_id` - Foreign Key to cats
- `is_cute` - Boolean (for future "not cute" option)
- `created_at` - Vote timestamp

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## 📝 License

MIT License - see [LICENSE](LICENSE) for details

## 🙏 Credits

- Cat images from [CATAAS](https://cataas.com) - Cat as a Service
- Icons and styling with [Tailwind CSS](https://tailwindcss.com)
- Inspired by the love of cats 🐱

---

**Having issues?** Create an [Issue](https://github.com/thekanu/cute-or-not/issues) on GitHub!