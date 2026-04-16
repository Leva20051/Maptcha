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
- `TiDB Cloud Starter` compatible
- `mysql2`
- `react-leaflet` with OpenStreetMap tiles

## Local Setup

1. Create a local env file:

```bash
cp .env.example .env.local
```

2. Edit `.env.local` with your real database values:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=cafe_curator
SESSION_SECRET=replace-with-a-long-random-secret
```

You can also use a single connection string instead:

```env
DATABASE_URL=mysql://root:your_mysql_password@127.0.0.1:3306/cafe_curator
SESSION_SECRET=replace-with-a-long-random-secret
```

3. Bootstrap the local database:

```bash
npm run db:bootstrap
```

This will:

- drop and recreate the `cafe_curator` database
- create the schema
- insert sample data
- create local demo accounts for testing

Local demo accounts use the password pattern `username123`.
Examples:

- `Praveen` / `Praveen123`
- `saira` / `saira123`
- `leo` / `leo123`
- `personA` / `personA123`
- `personB` / `personB123`
- `mia` / `mia123`

4. Start the app:

```bash
npm run dev
```

5. Open:

```text
http://127.0.0.1:3000
```

Useful local utilities:

```bash
npm run db:reset-username-passwords
npm run smoke:local
```

## Shared Cloud Setup For TiDB Cloud

Use this path when you want one shared database for the deployed app instead of a local MySQL server.

1. Create a TiDB Cloud Starter cluster.
2. Create or choose a database named `cafe_curator`.
3. Put the TiDB values in `.env.local`:

```env
DB_HOST=your-gateway-region.aws.tidbcloud.com
DB_PORT=4000
DB_USER=your-prefix.root
DB_PASSWORD=your_generated_password
DB_NAME=cafe_curator
DB_SSL=true
DB_CONNECTION_LIMIT=1
DB_MAX_IDLE=1
DB_ENABLE_KEEP_ALIVE=true
SESSION_SECRET=replace-with-a-long-random-secret
```

You can also use TiDB-style aliases if you prefer:

```env
TIDB_HOST=your-gateway-region.aws.tidbcloud.com
TIDB_PORT=4000
TIDB_USER=your-prefix.root
TIDB_PASSWORD=your_generated_password
TIDB_DB_NAME=cafe_curator
DB_SSL=true
DB_CONNECTION_LIMIT=1
DB_MAX_IDLE=1
DB_ENABLE_KEEP_ALIVE=true
SESSION_SECRET=replace-with-a-long-random-secret
```

4. Prepare the shared database without dropping anything:

```bash
npm run db:setup-shared
```

This script:

- creates the database if it does not exist
- applies the schema only when the tables are missing
- does not create public demo logins by default

5. Create your private admin account:

```bash
ADMIN_USERNAME=youradmin \
ADMIN_EMAIL=you@example.com \
ADMIN_PASSWORD='use-a-strong-password' \
npm run db:create-admin
```

6. Optional: if you intentionally want the sample local demo dataset in a non-production shared environment, you can seed it explicitly:

```bash
SEED_DEMO_DATA=true npm run db:setup-shared
```

Do not do that for a public production deployment.

Do not run `npm run db:bootstrap` against a shared cloud database unless you intentionally want to wipe it.

7. Verify the app locally against TiDB Cloud:

```bash
npm run dev
```

## Vercel Deployment

1. Push only the web app files to your GitHub repo.
2. Import that GitHub repo into Vercel.
3. Set the same environment variables in the Vercel project:

- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- or `DATABASE_URL`
- `DB_SSL=true`
- `DB_CONNECTION_LIMIT=1`
- `DB_MAX_IDLE=1`
- `DB_ENABLE_KEEP_ALIVE=true`
- `SESSION_SECRET`

4. Deploy.

After deployment, the website and the database will both be shared online. Everyone using the app will be reading and writing the same TiDB Cloud database.

## Security Notes For Public Deployment

- Do not commit `.env.local`.
- Do not publish real admin credentials in the repo.
- Use `npm run db:create-admin` for your real admin user.
- Keep `SEED_DEMO_DATA` off for production.
- Vercel environment variables should be added in the project settings, not stored in Git.

## DBeaver / MySQL Workbench

Use the same connection values from `.env.local`:

- Host: `DB_HOST`
- Port: `DB_PORT`
- Username: `DB_USER`
- Password: `DB_PASSWORD`
- Default schema: `DB_NAME`
- SSL mode: `Required` if you are using TiDB Cloud

When you create or edit data in the app, the same records will update in the database immediately.

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
