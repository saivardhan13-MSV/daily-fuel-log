# Daily Fuel Log — Full Web App Build Brief

Hand this whole file to Claude Code as your starting prompt (or paste sections in as you go).
It reads best as: "Read this brief, then start with Phase 0."

## What this is

A gym nutrition tracker: log Breakfast / Mid-Morning Snack / Lunch / Evening Snack /
Pre-Workout / Post-Workout / Dinner, search any food and get auto-calculated macros,
track by date across unlimited days/years, and (later) compare against wearable
recovery/strain data.

A working prototype already exists as a single HTML file (Claude-artifact version) —
it has the full UI, the g/pc/ml unit-conversion logic, a 137-item food database, and the
overall UX. That file is attached — **reuse its design, macro-calculation logic, and food
database wholesale.** The rebuild is about the backend, not the frontend look-and-feel.

## Why it's being rebuilt

The prototype runs in a sandboxed chat environment with no real database, no login, and
no ability to call third-party OAuth APIs. This build turns it into a real, deployable
website with:

- A real database (so data survives independent of any single chat session)
- User accounts (so it works across devices)
- A server-side food search (reliable, not dependent on browser CORS)
- Live fitness band sync (Fitbit to start)
- Bodyweight-based daily targets + a "fuel vs. strain" comparison view

## Recommended stack

- **Frontend:** Next.js (React) — keeps things in one deployable project, good free hosting on Vercel
- **Backend:** Next.js API routes (or a separate Node/Express service if you'd rather split it)
- **Database:** Postgres via Supabase (free tier, built-in auth, easy to start)
- **Auth:** Supabase Auth (email/password or Google login) — avoids building auth from scratch
- **Deployment:** Vercel (frontend + API routes) + Supabase (database/auth)

Tell Claude Code to confirm this stack or suggest alternatives before scaffolding —
it may have more current recommendations.

## Phase-by-phase plan

### Phase 0 — Project setup
- Scaffold a new Next.js + TypeScript project
- Set up Supabase project (database + auth), store keys in `.env.local`
- Get a free **USDA FoodData Central** API key: https://fdc.nal.usda.gov/api-key-signup
  (instant, no approval wait — good for raw/generic foods)
- Optional, for branded/packaged food coverage: sign up for **Nutritionix** or **Edamam**
  free tier API keys

### Phase 1 — Auth & database schema
- Email/password (or Google) login via Supabase Auth
- Tables: `users` (handled by Supabase), `daily_entries` (user_id, date, section, food_name,
  qty, unit, carbs, protein, fat, calories), `custom_foods` (user_id, name, carbs, protein,
  fat, calories per 100g, piece_weight, density), `body_targets` (user_id, weight, goal,
  target_calories, target_protein, target_carbs, target_fat, updated_at)

### Phase 2 — Port the tracker UI
- Recreate the 7-section layout, scoreboard, and g/pc/ml toggle from the attached HTML file
- Port the 137-item food database and the piece-weight/density tables as seed data or a
  static server-side module
- Wire "Add" to write to `daily_entries` instead of `window.storage`
- Rebuild the history/calendar view against real date-range queries instead of `storage.list`

### Phase 3 — Server-side food search
- API route that queries USDA FoodData Central (and Nutritionix/Edamam if added) server-side
  so the API key stays private and there's no CORS dependency
- Merge results with the user's own `custom_foods` and the seeded 137-item list
- Cache/save any food a user picks into `custom_foods` for instant reuse, same as the
  prototype's behavior

### Phase 4 — Bodyweight-based targets
- Simple form: current weight, goal (cut / maintain / bulk), activity level
- Standard formula (e.g. Mifflin-St Jeor for BMR × activity multiplier, protein ~1.6–2.2g/kg
  depending on goal) — Claude Code can implement and let you tune the multipliers
- Show daily progress against these targets instead of just raw totals

### Phase 5 — Fitness band live sync
- Start with **Fitbit** (public API, OAuth 2.0 with PKCE — no client secret needed):
  https://dev.fitbit.com/build/reference/web-api/
- OAuth login flow, store refresh token server-side (never in the browser)
- Daily endpoint: pull calories burned, resting heart rate, sleep, and (if available) a
  strain/readiness-style metric
- Build the "Fuel vs. Strain" view: calories in vs. calories burned, protein vs.
  bodyweight-based target, a simple flag like "under-fueled for today's activity"
- **Whoop** (also has a public OAuth API) as a stretch goal if you use a Whoop instead
- Garmin and Apple Health are harder (Garmin needs developer-program approval; Apple Health
  has no cloud API at all — would need a companion iOS app) — treat as later/optional

### Phase 6 — Deploy
- Deploy to Vercel, connect the Supabase project
- Set environment variables (API keys, Supabase keys, Fitbit client ID) in Vercel's dashboard,
  never commit them to the repo

## First prompt to give Claude Code

```
Read the attached brief and the attached HTML prototype (daily-fuel-log.html).
Reuse the prototype's design, its macro-calculation logic (grams/pieces/ml conversion),
and its food database as-is. Confirm the tech stack in the brief or suggest changes,
then scaffold Phase 0: a Next.js + TypeScript project with Supabase for database and auth.
Walk me through getting my Supabase and USDA FoodData Central API keys before writing
code that needs them.
```

## Notes for later phases

- Don't try to build Phase 5 (band sync) until Phases 1–3 are solid — auth + database +
  food search is already a full project on its own.
- Whoop/Fitbit OAuth requires registering a redirect URL, which only works once you have a
  real deployed domain (or `localhost` for local dev) — this is a good reason to deploy
  early (end of Phase 1 or 2) even before every feature is done.
