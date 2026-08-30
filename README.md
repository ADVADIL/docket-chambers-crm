# Docket — Chambers Practice Manager

A practice management CRM for law firm operations: clients, matters, hearings,
calendar, and billing, with a conflict-of-interest check, hearing outcome
tracking, and printable invoices.

Built with React + Vite, backed by Supabase (Postgres + Auth + Realtime),
deployed on Vercel.

## Setup

```bash
npm install
npm run dev
```

## Deploy

Connected to Vercel — pushes to `main` deploy automatically once this repo
is linked in the Vercel dashboard (Project Settings → Git).

## Database

Schema and RLS policies live in Supabase project `vvftywyudzjbvqnoaexg`.
Sign-up is invite-only (gated by a database trigger) — accounts are created
via the Supabase dashboard, not self-service.
