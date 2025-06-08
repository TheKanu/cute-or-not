# 🐱 Cute or Not - Cat Voting App

Eine unterhaltsame Web-App, bei der Nutzer für die süßesten Katzen abstimmen können! Die App zeigt zufällige Katzenbilder von [CATAAS](https://cataas.com) und ermöglicht es, für die Favoriten zu voten.

![Node.js](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-%3E%3D12-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 📸 Screenshots & Features

- **Voting-Interface**: Zwei Katzen im Vergleich - vote mit Klick oder Pfeiltasten
- **Leaderboards**: Tages-, Monats-, Jahres- und All-Time Champions
- **Namensgebung**: Jede Katze erhält einen einzigartigen, lustigen Namen
- **Themes**: 6 verschiedene Farbthemen zur Auswahl
- **Suchfunktion**: Finde Katzen nach Namen
- **Rate-Limiting**: Faire Abstimmungen (15 Votes pro Minute)

## 🚀 Voraussetzungen

- **Node.js** v14 oder höher
- **PostgreSQL** v12 oder höher
- **npm** oder **yarn**
- Git

## 📦 Installation

### 1. Repository klonen

```bash
git clone https://github.com/yourusername/cute-or-not.git
cd cute-or-not
```

### 2. Abhängigkeiten installieren

```bash
npm install
```

### 3. PostgreSQL Datenbank einrichten

```bash
# PostgreSQL starten (falls nicht bereits läuft)
# macOS: brew services start postgresql
# Linux: sudo systemctl start postgresql

# In PostgreSQL einloggen
psql -U postgres

# Datenbank erstellen
CREATE DATABASE cute_or_not;

# Benutzer erstellen (optional, falls gewünscht)
CREATE USER catvoter WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE cute_or_not TO catvoter;

# PostgreSQL verlassen
\q
```

### 4. Datenbankschema initialisieren

```bash
# Mit postgres user
psql -U postgres -d cute_or_not -f backend/migrations/newtables.sql

# ODER mit eigenem user
psql -U catvoter -d cute_or_not -f backend/migrations/newtables.sql
```

### 5. Umgebungsvariablen konfigurieren

```bash
# .env Datei erstellen
cp example.env .env
```

Bearbeite die `.env` Datei mit deinen Datenbank-Zugangsdaten:

```env
# Database Configuration
DB_USER=catvoter              # oder postgres
DB_HOST=localhost
DB_NAME=cute_or_not
DB_PASSWORD=your_secure_password
DB_PORT=5432

# Server Configuration
PORT=3000
```

### 6. Verzeichnisstruktur erstellen

```bash
# Setup-Script ausführen
chmod +x setup.sh
./setup.sh

# ODER manuell:
mkdir -p backend/images/cats
mkdir -p backend/images/not_cats
```

### 7. Server starten

```bash
# Produktion
npm start

# Entwicklung (mit Auto-Reload)
npm run dev
```

Die App ist jetzt erreichbar unter: `http://localhost:3000`

## 🎮 Nutzung

### Voting

1. **Öffne die App** im Browser
2. **Wähle eine Katze** durch Klick auf den "Vote Cute" Button
3. **Keyboard-Shortcuts**: 
   - `←` (Pfeil links): Vote für linke Katze
   - `→` (Pfeil rechts): Vote für rechte Katze

### Themes ändern

Klicke auf die **farbigen Kreise** oben rechts, um zwischen 6 verschiedenen Themes zu wechseln:
- 🟠 Default (Orange)
- 🔵 Ocean (Blau)
- 🔴 Sunset (Rot)
- 🟢 Forest (Grün)
- 🟣 Galaxy (Violett)
- 🩷 Candy (Pink)

### Leaderboard

Klicke auf **"🏆 Show Leaderboard"** um zu sehen:
- 👑 **All-Time Cutest Cat**: Die Katze mit den meisten Votes insgesamt
- 📅 **Cat of the Year**: Jahres-Champion
- 📆 **Monthly Champion**: Monats-Sieger
- ⭐ **Today's Star**: Tages-Gewinner
- 🎲 **Random Cuties**: 5 zufällige Katzen zum Entdecken

### Katzen suchen

1. Öffne das Leaderboard
2. Scrolle zur **Suchsektion**
3. Gib einen Namen oder Teil eines Namens ein
4. Drücke Enter oder klicke "Search"

### Katzen-Detailseite

Klicke auf eine Katze im Leaderboard, um ihre Detailseite zu sehen mit:
- Großem Bild
- Vollständigem Namen
- Vote-Statistiken

## 🛠️ Konfiguration

### Datenbank-Verbindung

Die Datenbank-Verbindung wird über Umgebungsvariablen in `.env` konfiguriert. Stelle sicher, dass PostgreSQL läuft und die Zugangsdaten korrekt sind.

### Port ändern

Standardmäßig läuft die App auf Port 3000. Ändern kannst du das in `.env`:

```env
PORT=8080
```

### Rate-Limiting anpassen

In `backend/index.js` findest du die Rate-Limit-Konfiguration:

```javascript
const voteLimiter = rateLimit({
  windowMs: 60 * 1000,    // 1 Minute
  max: 15,                // Max 15 Votes pro Minute
});
```

## 🗂️ Projektstruktur

```
cute-or-not/
├── backend/
│   ├── images/           # Gespeicherte Katzenbilder
│   │   ├── cats/        # Voting-Katzenbilder (ignoriert von Git)
│   │   └── not_cats/    # Statische Assets (Icons, etc.)
│   ├── migrations/      # SQL-Migrations
│   ├── names/          # Wortlisten für Namensgenerierung
│   ├── index.js        # Express Server
│   ├── db.js          # Datenbank-Verbindung
│   ├── catService.js  # Katzen-Verwaltung
│   ├── voteService.js # Vote-Verarbeitung
│   └── nameGenerator.js # Namens-Generierung
├── frontend/
│   ├── index.html     # Hauptseite
│   └── cat.html       # Katzen-Detailseite
├── .env               # Umgebungsvariablen (nicht in Git)
├── .gitignore        # Git-Ignores
├── package.json      # NPM Dependencies
└── README.md         # Diese Datei
```

## 🔧 Troubleshooting

### "Datenbank-Verbindung fehlgeschlagen"

1. Überprüfe, ob PostgreSQL läuft:
   ```bash
   # macOS/Linux
   ps aux | grep postgres
   
   # Oder mit systemctl
   sudo systemctl status postgresql
   ```

2. Teste die Verbindung:
   ```bash
   psql -U your_user -d cute_or_not -c "SELECT 1;"
   ```

3. Überprüfe die `.env` Datei auf Tippfehler

### "Bilder werden nicht angezeigt"

1. Stelle sicher, dass das `backend/images/cats/` Verzeichnis existiert
2. Überprüfe die Schreibrechte:
   ```bash
   ls -la backend/images/
   ```
3. Schaue in die Server-Logs für Fehler

### "Too many votes" Fehler

Das ist das Rate-Limiting. Warte eine Minute und versuche es erneut.

### Datenbank zurücksetzen

```bash
# VORSICHT: Löscht alle Daten!
psql -U your_user -d cute_or_not

DROP TABLE IF EXISTS votes CASCADE;
DROP TABLE IF EXISTS cats CASCADE;

# Dann schema neu laden
\i backend/migrations/newtables.sql
```

## 🚀 Deployment

### Mit PM2 (empfohlen)

```bash
# PM2 installieren
npm install -g pm2

# App starten
pm2 start backend/index.js --name cute-or-not

# Auto-Start einrichten
pm2 startup
pm2 save
```

### Mit systemd

Erstelle `/etc/systemd/system/cute-or-not.service`:

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

### Reverse Proxy mit Nginx

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

## 📊 Datenbank-Schema

### Tabelle: cats
- `id` - Primary Key
- `hash` - SHA256 Hash des Bildes (unique)
- `image_url` - Lokale URL des gespeicherten Bildes
- `name` - Generierter Name
- `cute_score` - Anzahl "cute" Votes
- `total_votes` - Gesamtzahl Votes
- `created_at` - Erstellungszeitpunkt

### Tabelle: votes
- `id` - Primary Key
- `cat_id` - Foreign Key zu cats
- `is_cute` - Boolean (für zukünftige "not cute" Option)
- `created_at` - Vote-Zeitpunkt

## 🤝 Beitragen

Pull Requests sind willkommen! Für größere Änderungen, erstelle bitte zuerst ein Issue.

## 📝 Lizenz

MIT License - siehe [LICENSE](LICENSE) für Details

## 🙏 Credits

- Katzenbilder von [CATAAS](https://cataas.com) - Cat as a Service
- Icons und Styling mit [Tailwind CSS](https://tailwindcss.com)
- Inspiriert von der Liebe zu Katzen 🐱

---

**Probleme?** Erstelle ein [Issue](https://github.com/yourusername/cute-or-not/issues) auf GitHub!