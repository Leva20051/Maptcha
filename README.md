# Cafe Curator

Cafe Curator is a mobile-friendly web app for curated cafe discovery. It implements the three submitted user types (`Regular User`, `Curator`, `Admin`), the submitted SQL model, and the proposal-only features that were requested for the final build:

- map-driven venue discovery
- personalized weighted venue scoring
- curator expertise-to-attribute weighting
- curator reputation and recommendation accuracy signals
- curator venue submission workflow with admin approval
- live MySQL-backed updates for reviews, follows, check-ins, venue management, tags, badges, and recommendations

## Stack

- `Next.js 15`
- `TypeScript`
- `MySQL 8`
- `mysql2`
- `react-leaflet` with OpenStreetMap tiles

## Local Setup

1. Create a local env file:

```bash
cp .env.example .env.local
```

2. Edit `.env.local` with your real MySQL connection values:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=cafe_curator
SESSION_SECRET=replace-with-a-long-random-secret
```

3. Bootstrap the database:

```bash
npm run db:bootstrap
```

This will:

- drop and recreate the `cafe_curator` database
- create the schema
- insert seed data
- create demo accounts

4. Start the app:

```bash
npm run dev
```

5. Open:

```text
http://localhost:3000
```

## Demo Accounts

These are inserted by `npm run db:bootstrap`:

- Admin: `Praveen` / `CafeAdmin2026!`
- Curator: `saira` / `CuratorSaira2026!`
- Curator: `leo` / `CuratorLeo2026!`
- User: `personA` / `UserA2026!`
- User: `personB` / `UserB2026!`
- User: `mia` / `UserMia2026!`

## MySQL Workbench

Use the same connection values from `.env.local`:

- Host: `DB_HOST`
- Port: `DB_PORT`
- Username: `DB_USER`
- Password: `DB_PASSWORD`
- Default schema: `DB_NAME`

When you create or edit data in the app, the same records will update in MySQL immediately.

## Live DB Watching In Terminal

If you want a continuously refreshing terminal view while you use the app:

```bash
chmod +x scripts/live-db-watch.sh
./scripts/live-db-watch.sh all
./scripts/live-db-watch.sh table Venue
./scripts/live-db-watch.sh table Review
./scripts/live-db-watch.sh query "SELECT * FROM Check_In ORDER BY CheckInTime DESC LIMIT 20"
```

You can also speed it up:

```bash
REFRESH_SECONDS=1 ./scripts/live-db-watch.sh query "SELECT * FROM Follows"
```

Stop it with `Ctrl+C`.

If you want every table and every row refreshing live at once:

```bash
./scripts/live-db-watch.sh all
```

## Main Areas

- `/` landing page with featured venues, curators, and map view
- `/venues` browse, filter, and map all venues
- `/venues/[venueId]` venue detail, reviews, check-ins, and recommendations
- `/curators` curator directory and follow flow
- `/curators/[curatorId]` curator detail
- `/dashboard` regular user dashboard
- `/account` account and preference editing
- `/curator-studio` curator tools
- `/admin` admin console

## Verification Already Completed

- `./node_modules/.bin/tsc --noEmit`
- `npm run build`

## Remaining Step For Live DB Verification

I still need a valid local MySQL username/password from your machine to run the bootstrap script and verify the real database workflows end to end.
