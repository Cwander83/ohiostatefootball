# Ohio State Football Stats

A stat-based site for Ohio State Buckeyes football — the 2026 season plus 20+ years of history. Built with plain HTML, CSS, and JavaScript (no frameworks), backed by local JSON data scraped from ESPN's public API.

## Features

- **Schedule** — every game with scores, opponent, venue, and home/away
- **Team Stats** — season stat tiles (offense, defense, special teams)
- **Player Stats** — sortable, per-position stat tables aggregated across all games
- **Roster** — sortable roster with position/group filters (current season only)
- **Year selector** — jump between any season from 2005 to 2026
- **Responsive** — works on mobile and desktop
- **OSU theme** — scarlet `#ba0c2f`, black, and gray

## Pages

| Page | Description |
|------|-------------|
| `index.html` | Schedule |
| `team.html` | Team season stats |
| `players.html` | Player stats by position |
| `roster.html` | Roster |

## Data

All data lives in `data/` as local JSON, organized per season:

```
data/
├── index.json          # list of available years + current season
├── 2026/
│   ├── schedule.json   # games
│   ├── boxscores.json  # per-game team + player stats
│   └── roster.json     # current-season roster
├── 2025/
│   ├── schedule.json
│   ├── boxscores.json
│   └── team-stats.json # season team stats
└── ...
```

Data is scraped from ESPN's public API (`site.api.espn.com/apis/site/v2/sports/football/college-football`, team id `194`).

**Historical availability:** schedule data goes back to ~2000, boxscores/player stats to ~2005, and team season stats to 2015+. Rosters are only available for the current season.

## Getting Started

```bash
# Install dependencies (none required — Node built-ins only)
npm install

# Serve the site locally (with scrape API)
npm run serve
# → http://localhost:4173
```

### Scraping

```bash
# Scrape the current season (2026)
npm run scrape

# Scrape all seasons 2005–2026
npm run scrape:all
```

The **Refresh Stats** button in the header re-scrapes the current season. It works locally (via the dev server's `POST /api/scrape` endpoint) but shows **Offline** on static hosting like Vercel, since static hosts can't write files. The committed JSON still displays.

## Deployment

The site is fully static and ready for Vercel:

```bash
# Deploy to Vercel
vercel
```

No build step or serverless functions are required — Vercel serves the static files directly.

## Tech Stack

- Plain HTML / CSS / JavaScript (ES modules)
- Node.js built-ins for the dev server and scraper (`node:http`, `node:fs`)
- No frameworks, no build tools, no database

## License

Data is from ESPN's public API. This project is for personal/educational use.
