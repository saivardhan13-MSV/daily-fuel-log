# Daily Fuel Log

A daily food, hydration and body-weight tracker. The UI is Next.js; all data
access goes through a Python (FastAPI) API in [`backend/`](backend/README.md),
backed by Supabase (auth + Postgres with Row Level Security).

```
Browser -> Next.js (UI, login, session cookie) -> FastAPI (backend/) -> Supabase Postgres (RLS)
```

**Running locally needs both servers.** Copy `.env.local.example` to
`.env.local`, set `API_URL=http://localhost:8010`, then:

```bash
# terminal 1: the API
cd backend && python -m venv .venv && .venv/Scripts/activate && pip install -r requirements-dev.txt
uvicorn app.main:app --port 8010

# terminal 2: the app
npm install && npm run dev
```

(Or point `API_URL` at the deployed API and skip terminal 1.) API details,
tests and Vercel deployment: [`backend/README.md`](backend/README.md).

---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
