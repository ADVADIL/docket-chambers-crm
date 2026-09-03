-- =====================================================================
-- MIGRATION 002 — RLS lockdown, deadline persistence fix, inquiries,
-- UPI payment field.
-- Run this in Supabase SQL Editor AFTER schema.sql.
-- Safe to re-run (idempotent).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. SECURITY FIX: close the open RLS policies.
-- Previously every policy used USING (true) / WITH CHECK (true), which
-- meant anyone holding the public anon key (shipped in the browser JS
-- bundle) could read/write/delete every row directly via Supabase's
-- REST API, bypassing the app's login screen entirely.
-- This chambers app is a shared multi-advocate workspace (not
-- per-user siloed data), so the correct fix is: require a valid
-- authenticated session, not full public access.
-- ---------------------------------------------------------------------

DROP POLICY IF EXISTS "Allow chambers read access on clients" ON public.clients;
DROP POLICY IF EXISTS "Allow chambers insert access on clients" ON public.clients;
DROP POLICY IF EXISTS "Allow chambers update access on clients" ON public.clients;
DROP POLICY IF EXISTS "Allow chambers delete access on clients" ON public.clients;

DROP POLICY IF EXISTS "Allow chambers read access on matters" ON public.matters;
DROP POLICY IF EXISTS "Allow chambers insert access on matters" ON public.matters;
DROP POLICY IF EXISTS "Allow chambers update access on matters" ON public.matters;
DROP POLICY IF EXISTS "Allow chambers delete access on matters" ON public.matters;

DROP POLICY IF EXISTS "Allow chambers read access on hearings" ON public.hearings;
DROP POLICY IF EXISTS "Allow chambers insert access on hearings" ON public.hearings;
DROP POLICY IF EXISTS "Allow chambers update access on hearings" ON public.hearings;
DROP POLICY IF EXISTS "Allow chambers delete access on hearings" ON public.hearings;

DROP POLICY IF EXISTS "Allow chambers read access on billing" ON public.billing;
DROP POLICY IF EXISTS "Allow chambers insert access on billing" ON public.billing;
DROP POLICY IF EXISTS "Allow chambers update access on billing" ON public.billing;
DROP POLICY IF EXISTS "Allow chambers delete access on billing" ON public.billing;

DROP POLICY IF EXISTS "Allow chambers read access on chambers_profile" ON public.chambers_profile;
DROP POLICY IF EXISTS "Allow chambers insert access on chambers_profile" ON public.chambers_profile;
DROP POLICY IF EXISTS "Allow chambers update access on chambers_profile" ON public.chambers_profile;
DROP POLICY IF EXISTS "Allow chambers delete access on chambers_profile" ON public.chambers_profile;

-- Authenticated-only policies (auth.role() = 'authenticated' means the
-- request carries a valid Supabase Auth JWT from a signed-in session —
-- an anon-key-only request with no session no longer qualifies).
CREATE POLICY "Authenticated read on clients" ON public.clients FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated insert on clients" ON public.clients FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated update on clients" ON public.clients FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated delete on clients" ON public.clients FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated read on matters" ON public.matters FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated insert on matters" ON public.matters FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated update on matters" ON public.matters FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated delete on matters" ON public.matters FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated read on hearings" ON public.hearings FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated insert on hearings" ON public.hearings FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated update on hearings" ON public.hearings FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated delete on hearings" ON public.hearings FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated read on billing" ON public.billing FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated insert on billing" ON public.billing FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated update on billing" ON public.billing FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated delete on billing" ON public.billing FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated read on chambers_profile" ON public.chambers_profile FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated insert on chambers_profile" ON public.chambers_profile FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated update on chambers_profile" ON public.chambers_profile FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated delete on chambers_profile" ON public.chambers_profile FOR DELETE USING (auth.role() = 'authenticated');

-- IMPORTANT: after running this, every advocate/team member must sign in
-- through Auth.jsx (real Supabase Auth) before the app can read or write
-- any data. The "Local Chamber" mode (no Supabase configured at all)
-- still works unaffected, since it never touches these tables.

-- ---------------------------------------------------------------------
-- 2. BUG FIX: statutory deadline fields were captured in the UI
-- (Forms.jsx MatterForm) but never persisted — the matters table had
-- no columns for them, so anything logged vanished on refresh.
-- ---------------------------------------------------------------------

ALTER TABLE public.matters ADD COLUMN IF NOT EXISTS deadline_date DATE;
ALTER TABLE public.matters ADD COLUMN IF NOT EXISTS deadline_type TEXT;
ALTER TABLE public.matters ADD COLUMN IF NOT EXISTS deadline_statute TEXT;
ALTER TABLE public.matters ADD COLUMN IF NOT EXISTS deadline_notes TEXT;
ALTER TABLE public.matters ADD COLUMN IF NOT EXISTS deadline_completed BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_matters_deadline_date ON public.matters(deadline_date);

-- ---------------------------------------------------------------------
-- 3. NEW: Inquiries table — pre-matter client intake, distinct from
-- both `clients` (an engaged client) and `matters` (a filed/active case).
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.inquiries (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  subject TEXT,
  practice_area TEXT,
  source TEXT,
  status TEXT DEFAULT 'New',
  notes TEXT,
  follow_up_date DATE,
  converted_matter_id TEXT REFERENCES public.matters(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inquiries_status ON public.inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_follow_up ON public.inquiries(follow_up_date);

ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated read on inquiries" ON public.inquiries;
DROP POLICY IF EXISTS "Authenticated insert on inquiries" ON public.inquiries;
DROP POLICY IF EXISTS "Authenticated update on inquiries" ON public.inquiries;
DROP POLICY IF EXISTS "Authenticated delete on inquiries" ON public.inquiries;

CREATE POLICY "Authenticated read on inquiries" ON public.inquiries FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated insert on inquiries" ON public.inquiries FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated update on inquiries" ON public.inquiries FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated delete on inquiries" ON public.inquiries FOR DELETE USING (auth.role() = 'authenticated');

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.inquiries;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN others THEN NULL;
  END;
END $$;

-- ---------------------------------------------------------------------
-- 4. NEW: UPI ID on chambers_profile, for the UPI QR on INR invoices.
-- ---------------------------------------------------------------------

ALTER TABLE public.chambers_profile ADD COLUMN IF NOT EXISTS upi_id TEXT;

-- ---------------------------------------------------------------------
-- 5. OPTIONAL CLEANUP (not run automatically — legacy duplicate columns
-- identified in the dead-code audit). Confirm nothing else reads these
-- raw columns before dropping:
--
--   ALTER TABLE public.hearings DROP COLUMN IF EXISTS date;
--   ALTER TABLE public.billing DROP COLUMN IF EXISTS date;
--
-- The app has only ever written hearing_date / invoice_date respectively.
-- ---------------------------------------------------------------------
