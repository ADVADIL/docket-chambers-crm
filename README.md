# Docket — Chambers Practice & CRM System

A collaborative cloud-enabled law practice management application built with **React**, **Vite**, **Supabase (PostgreSQL & Realtime)**, and deployed on **Vercel**.

---

## ⚡ Quick Start (Open in VS Code)

1. Open a terminal or VS Code and navigate to this directory:
   ```bash
   cd "C:\Users\Mohamed Adil\.gemini\antigravity\scratch\docket-chambers-crm"
   code .
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ☁️ Step-by-Step Supabase Database Setup (Real-Time Across Laptops)

To enable all associates and partners across your firm to collaborate in real-time from any laptop:

1. **Create Free Project:**
   - Go to [supabase.com](https://supabase.com) and create a free project.
2. **Execute Database Schema:**
   - In your Supabase dashboard, navigate to **SQL Editor** > **New Query**.
   - Copy and paste the entire contents of [`supabase/schema.sql`](file:///C:/Users/Mohamed%20Adil/.gemini/antigravity/scratch/docket-chambers-crm/supabase/schema.sql).
   - Click **Run**. This creates the `clients`, `matters`, `hearings`, and `billing` tables with real-time replication enabled.
3. **Connect the App:**
   - **Method A (In-App UI):** Click **"Local Chamber / Firm Cloud Sync"** in the lower-left sidebar of the app, paste your `Project URL` and `anon public key` from **Project Settings > API**, and click **Connect & Sync**.
   - **Method B (.env file):** Copy `.env.example` to `.env` and fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

---

## 🚀 1-Click Vercel Deployment (Firm-Wide Access)

Deploying to Vercel gives every lawyer in your firm a fast HTTPS link (`https://docket-chambers.vercel.app`) accessible from any laptop or tablet:

### Option 1: Using Vercel CLI
```bash
npm i -g vercel
vercel
```
When prompted, accept defaults and add your Environment Variables (`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`).

### Option 2: Using GitHub + Vercel Web Dashboard
1. Push this folder to a GitHub repository.
2. In [vercel.com](https://vercel.com), click **Add New Project** > Import repository.
3. In **Environment Variables**, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Click **Deploy**.

---

## 📂 Project Structure

```
docket-chambers-crm/
├── supabase/
│   └── schema.sql            # PostgreSQL schema, RLS policies, Realtime triggers
├── src/
│   ├── components/
│   │   ├── Dashboard.jsx     # Analytics, KPI metrics, Recharts charts, cause list highlight
│   │   ├── Tables.jsx        # Clients, Matters, Hearings, Billing CRUD tables
│   │   ├── CalendarView.jsx  # Interactive month calendar & cause list sidebar
│   │   ├── Forms.jsx         # Validation modals for adding/editing records
│   │   ├── ChamberConfigModal.jsx # Cloud sync & Supabase tester modal
│   │   └── UI.jsx            # Atom design components (Badges, Buttons, Inputs, Modals)
│   ├── lib/
│   │   └── supabase.js       # Dynamic Supabase client adapter (Env + Local config)
│   ├── constants.js          # Practice areas, statuses, bench courts & seed data
│   ├── utils.js              # Record normalizers, date & currency formatters
│   ├── App.jsx               # Universal state hook & chamber navigation
│   └── main.jsx              # React 18 bootstrap
├── vercel.json               # SPA routing rewrite rules for Vercel
├── vite.config.js            # Vite bundler configuration
└── package.json              # Project dependencies & build scripts
```

---

## ⚖️ Features
- **Real-Time Synchronization:** Any update made on one associate's laptop reflects live on all other firm screens via Supabase WebSocket channels.
- **Offline & Local Fallback:** Works seamlessly even without an internet connection using browser local storage.
- **Cause List & Diary:** Interactive monthly hearings calendar with 1-click printable cause lists.
- **Financial Practice Metrics:** Real-time billing realization chart, overdue alerts, and fee notes.
- **Bespoke Chambers Design:** Luxury editorial typography (Source Serif 4 + IBM Plex) tailored for modern legal practitioners.
