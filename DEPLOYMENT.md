# Deploying Finance Manager

The app is a Next.js project using Supabase for sign in and Postgres,
Prisma for database access, and Gemini (through the AI SDK) to read bank
SMS. It is deployed on Vercel.

## Environment variables

Five are needed everywhere, locally and on Vercel. A sixth is production only.

| Variable | What it is | Where to find it |
|---|---|---|
| `DATABASE_URL` | Transaction pooler connection string, port **6543**. Used by the app at runtime. Keep `?pgbouncer=true&connection_limit=1` on the end. | Supabase, **Connect** button, Transaction pooler |
| `DIRECT_URL` | Session pooler connection string, port **5432**. Used by Prisma for migrations only. | Supabase, **Connect** button, Session pooler |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL, like `https://abcd.supabase.co` | Supabase, Project Settings, API Keys |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | The anon / publishable key. Newer projects show `sb_publishable_...`. Safe in the browser. | Supabase, Project Settings, API Keys |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Gemini key for the SMS parser. Note this name never appears in the code; `@ai-sdk/google` reads it from the environment by itself. | Google AI Studio, **Get API key** |
| `CRON_SECRET` | Production only. Protects the daily recurring transactions job. Vercel sends it automatically once the variable exists. | Make one: `openssl rand -hex 32` |

### Why two connection strings

The app runs as short lived serverless functions, which need the **pooler**
so they share a small set of database connections. Prisma cannot create or
change tables through that pooler, so migrations use `DIRECT_URL` instead.
`prisma/schema.prisma` wires this up with `directUrl`.

Never use the `service_role` or secret Supabase key. The app does not need it.

## Running locally

1. Create `.env` in the project root with the first five variables above.
   It is gitignored.
2. Install and set up:

   ```bash
   npm install
   npx prisma migrate deploy
   npx prisma generate
   npm run dev
   ```

3. Open http://localhost:3000 and sign up.

Use `migrate deploy`, not `migrate dev`, if your local `.env` points at the
same Supabase project as production. `migrate dev` can offer to reset the
database, which would delete real data. `migrate deploy` only applies
migration files.

## Deploying to Vercel

1. Push to GitHub.
2. In Vercel, **Add New**, **Project**, and import the repository. Next.js is
   detected automatically.
3. **Before clicking Deploy**, open Environment Variables and add all six,
   ticking Production, Preview and Development for each.
4. Deploy.

### Migrations run during the build

`package.json` has:

```json
"build": "prisma migrate deploy && next build"
```

So every deploy applies any new migration files before building. Commit the
folders under `prisma/migrations/`; a migration that is not committed never
reaches production.

### Region

`vercel.json` pins the app to `bom1` (Mumbai) to sit beside a Supabase
project in `ap-south-1`. If you move the database to another region, change
this to match, or every query crosses the world and back.

## Supabase authentication URLs

Supabase puts links in its emails, so it needs to know your deployed URL.
Go to **Authentication**, then **URL Configuration**:

- **Site URL:** `https://<your-app>.vercel.app`
- **Redirect URLs:**
  - `https://<your-app>.vercel.app/**`
  - `https://<project>-*-<team>.vercel.app/**` for preview deploys
  - `http://localhost:3000/**` for local development

Note where the `*` goes in the preview pattern. Vercel preview URLs look like
`myapp-abc123-myteam.vercel.app`, so the wildcard belongs between the project
name and the team name.

## Verifying a deployment

1. Sign up, then log in.
2. Add a transaction and check the dashboard figures move.
3. Confirm `/api/cron/process-recurring` returns `{"error":"Unauthorized"}`
   when called from a browser. That means `CRON_SECRET` is working.

## SMS import

Each user generates their own token on the Profile page. The database stores
only a hash of it, so it is shown once and cannot be recovered.

The phone sends bank SMS to `POST /api/sms`:

```
Authorization: Bearer fm_sms_...
Content-Type: application/json

{ "text": "<the SMS>" }
```

On iPhone, a Shortcut does the request and a Personal Automation runs it when
a message containing words like `debited`, `credited` or `spent` arrives.

Duplicates are rejected: the route stores a hash of each message on the
transaction and ignores the same message arriving again within 10 minutes.

## Troubleshooting

**"Can't reach database server at db.xxx.supabase.co:5432"**
You are using the direct connection instead of the pooler. The host should
contain `pooler.supabase.com`.

**Prisma errors during a Vercel build**
Usually a missing `DIRECT_URL`. The build runs `prisma migrate deploy`, which
needs it.

**"This model is no longer available to new users" (404)**
Google retired the model named in `src/lib/sms-parser.ts`. List what your key
can use and pick a current one:

```bash
curl -s "https://generativelanguage.googleapis.com/v1beta/models?key=$GOOGLE_GENERATIVE_AI_API_KEY" | grep '"name"'
```

**"This model is currently experiencing high demand"**
A temporary Gemini capacity problem, not a bug. The parser already tries a
second, lighter model before giving up, and the phone is told nothing was
saved so the message can be sent again.

**Reading production logs**
Vercel, project, **Logs**. On the Hobby plan only the last hour is available,
and longer ranges need a paid plan. Filter by console level Error to find
failures quickly.
