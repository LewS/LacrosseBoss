# 🥍 LacrosseBoss

Public lacrosse scheduling, scoring, and registration platform.

## Features

- **Competitions** — Field, Box, Sixes, or any custom format
- **Divisions** — Arbitrary age brackets and gender categories
- **Fixture generation** — Round-robin scheduler with team and competition-wide byes
- **Live scoring** — Real-time goals, assists, technical fouls (30s), personal fouls (1-3 min), simultaneous fouls, ejections
- **Player registration** — Club-based registration with payment gateway
- **Roster management** — Club officials assign players up to 2 days before game
- **Standings** — Auto-calculated per division

## Tech Stack

- Next.js 16 / React 19 / TypeScript
- Tailwind CSS 4
- Supabase (Postgres, Auth, Realtime)
- Deployed on Vercel

## Quick Start

### Prerequisites

- Docker
- A [Supabase](https://supabase.com) project

### Setup

```bash
# Create from template
gh repo create my-org/my-league --template your-org/LacrosseBoss --clone
cd my-league

# Run setup
./init.sh
```

The init script will:
1. Prompt for your Supabase URL and anon key
2. Install dependencies (via Docker)
3. Optionally run database migrations

### Development

```bash
docker run --rm -v $(pwd):/work -w /work -p 3000:3000 node:22-slim npm run dev -- -H 0.0.0.0
```

Open http://localhost:3000

### Deploy

Push to GitHub and connect to Vercel, or:

```bash
npx vercel
```

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/register` | POST | Player registration |
| `/api/pay` | POST | Process registration payment |
| `/api/fixtures/generate` | POST | Generate draft fixtures |
| `/api/fixtures/confirm` | POST | Persist fixtures as games |
| `/api/games/[gameId]/events` | POST | Record goals, fouls, simultaneous fouls |
| `/api/roster/assign` | POST | Assign players to game roster |

## Database Migrations

Migrations are in `supabase/migrations/` and applied in order:

1. `001_initial_schema.sql` — Divisions, competitions, seasons, teams, games, standings
2. `002_fixture_scheduling.sql` — Rounds, bye weeks, team byes
3. `003_player_registration.sql` — Clubs, players, registrations, payments, officials, rosters
4. `004_game_events.sql` — Goals, assists, fouls (technical/personal), simultaneous fouls

## Template Usage

To use this as a GitHub template:
1. Push to GitHub
2. Go to repo Settings → check "Template repository"
3. Others can click "Use this template" to create their own league app
