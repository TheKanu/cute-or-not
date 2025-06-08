# 🐱 Cute or Not - Cat Voting App

Eine unterhaltsame Web-App, bei der Nutzer für die süßesten Katzen abstimmen können!

## Features

- Zufällige Katzenbilder von CATAAS
- Voting-System mit Keyboard-Support (← →)
- Automatische Namensgebung für Katzen
- Leaderboards: Tag, Monat, Jahr, All-Time
- Suchfunktion
- Rate-Limiting für faire Abstimmungen

## Voraussetzungen

- Node.js (v14 oder höher)
- PostgreSQL
- npm

## Installation

1. Repository klonen:
```bash
git clone https://github.com/TheKanu/cute-or-not
cd cute-or-not
```

2. Umgebungsvariablen einrichten:
```bash
cp .env.example .env
# Bearbeite .env mit deinen Datenbank-Zugangsdaten
```

3. PostgreSQL Datenbank erstellen:
```sql
CREATE DATABASE cute_or_not;
```

4. Dependencies installieren:
```bash
npm install
```

5. Datenbank-Schema einrichten:
```bash
psql -U <dein_db_user> -d cute_or_not -f backend/migrations/schema.sql
```

6. Images-Verzeichnis erstellen:
```bash
mkdir -p backend/images
```

## Starten

```bash
npm start
```

Die App läuft dann auf `http://localhost:3000`

## Entwicklung

Für Auto-Reload während der Entwicklung:
```bash
npm run dev
```

## API Endpoints

- `GET /api/cat` - Zufälliges Katzenbild
- `POST /api/vote` - Abstimmung speichern
- `GET /api/leaderboard/top` - Top Katze (All-Time)
- `GET /api/leaderboard/year` - Katze des Jahres
- `GET /api/leaderboard/month` - Katze des Monats
- `GET /api/leaderboard/day` - Katze des Tages
- `GET /api/leaderboard/random` - 5 zufällige Katzen
- `GET /api/cat-search?q=<name>` - Suche nach Namen
- `GET /api/cat/:id` - Katzendetails
- `GET /api/total-votes` - Gesamtzahl aller Votes

## Datenbank-Struktur

### cats
- `id` - Primary Key
- `hash` - SHA256 Hash des Bildes (unique)
- `image_url` - Lokale URL des gespeicherten Bildes
- `name` - Generierter Name (Adjektiv + Nomen)
- `cute_score` - Anzahl "cute" Votes
- `total_votes` - Gesamtzahl Votes
- `created_at` - Erstellungszeitpunkt

### votes
- `id` - Primary Key
- `cat_id` - Foreign Key zu cats
- `is_cute` - Boolean (immer true in dieser Version)
- `created_at` - Vote-Zeitpunkt

## Credits

- Katzenbilder von [CATAAS](https://cataas.com)
- Icons und Styling mit Tailwind CSS