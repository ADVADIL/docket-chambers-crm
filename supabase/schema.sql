-- =====================================================================
-- DOCKET PRACTICE MANAGER — SUPABASE PRODUCTION DATABASE SCHEMA
-- =====================================================================

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Clients Table
CREATE TABLE IF NOT EXISTS public.clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Matters (Cases) Table
CREATE TABLE IF NOT EXISTS public.matters (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  client_id TEXT REFERENCES public.clients(id) ON DELETE SET NULL,
  practice_area TEXT DEFAULT 'Civil Litigation',
  advocate TEXT,
  status TEXT DEFAULT 'Intake',
  filing_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  case_number TEXT,
  court_complex TEXT,
  opposing_party TEXT,
  priority TEXT DEFAULT 'Normal',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safe migrations for existing matters tables
ALTER TABLE public.matters ADD COLUMN IF NOT EXISTS case_number TEXT;
ALTER TABLE public.matters ADD COLUMN IF NOT EXISTS court_complex TEXT;
ALTER TABLE public.matters ADD COLUMN IF NOT EXISTS opposing_party TEXT;
ALTER TABLE public.matters ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'Normal';

-- 4. Court Hearings / Cause List Table
CREATE TABLE IF NOT EXISTS public.hearings (
  id TEXT PRIMARY KEY,
  matter_id TEXT REFERENCES public.matters(id) ON DELETE CASCADE,
  date DATE,
  hearing_date DATE,
  court TEXT,
  notes TEXT,
  outcome TEXT,
  order_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safe migrations for existing hearings tables
ALTER TABLE public.hearings ADD COLUMN IF NOT EXISTS hearing_date DATE;
ALTER TABLE public.hearings ADD COLUMN IF NOT EXISTS outcome TEXT;
ALTER TABLE public.hearings ADD COLUMN IF NOT EXISTS order_notes TEXT;
ALTER TABLE public.hearings ADD COLUMN IF NOT EXISTS time TEXT;

-- 5. Billing & Invoices Table
CREATE TABLE IF NOT EXISTS public.billing (
  id TEXT PRIMARY KEY,
  matter_id TEXT REFERENCES public.matters(id) ON DELETE SET NULL,
  matter_label TEXT,
  description TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'AED',
  date DATE DEFAULT CURRENT_DATE,
  invoice_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'Draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safe migrations for existing billing tables
ALTER TABLE public.billing ADD COLUMN IF NOT EXISTS matter_label TEXT;
ALTER TABLE public.billing ADD COLUMN IF NOT EXISTS invoice_date DATE DEFAULT CURRENT_DATE;

-- 5b. Chambers Billing Profile Table (single editable row: firm name, address, bank details)
CREATE TABLE IF NOT EXISTS public.chambers_profile (
  id TEXT PRIMARY KEY DEFAULT 'main',
  chambers_name TEXT,
  tagline TEXT,
  address_line TEXT,
  bar_registry_no TEXT,
  phone TEXT,
  email TEXT,
  account_name TEXT,
  bank_name TEXT,
  account_iban TEXT,
  swift_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_matters_client ON public.matters(client_id);
CREATE INDEX IF NOT EXISTS idx_matters_status ON public.matters(status);
CREATE INDEX IF NOT EXISTS idx_hearings_date ON public.hearings(date);
CREATE INDEX IF NOT EXISTS idx_hearings_hearing_date ON public.hearings(hearing_date);
CREATE INDEX IF NOT EXISTS idx_hearings_matter ON public.hearings(matter_id);
CREATE INDEX IF NOT EXISTS idx_billing_status ON public.billing(status);
CREATE INDEX IF NOT EXISTS idx_billing_matter ON public.billing(matter_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hearings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chambers_profile ENABLE ROW LEVEL SECURITY;

-- Clean up any existing policies
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

-- Create Chambers Shared Access Policies
CREATE POLICY "Allow chambers read access on clients" ON public.clients FOR SELECT USING (true);
CREATE POLICY "Allow chambers insert access on clients" ON public.clients FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow chambers update access on clients" ON public.clients FOR UPDATE USING (true);
CREATE POLICY "Allow chambers delete access on clients" ON public.clients FOR DELETE USING (true);

CREATE POLICY "Allow chambers read access on matters" ON public.matters FOR SELECT USING (true);
CREATE POLICY "Allow chambers insert access on matters" ON public.matters FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow chambers update access on matters" ON public.matters FOR UPDATE USING (true);
CREATE POLICY "Allow chambers delete access on matters" ON public.matters FOR DELETE USING (true);

CREATE POLICY "Allow chambers read access on hearings" ON public.hearings FOR SELECT USING (true);
CREATE POLICY "Allow chambers insert access on hearings" ON public.hearings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow chambers update access on hearings" ON public.hearings FOR UPDATE USING (true);
CREATE POLICY "Allow chambers delete access on hearings" ON public.hearings FOR DELETE USING (true);

CREATE POLICY "Allow chambers read access on billing" ON public.billing FOR SELECT USING (true);
CREATE POLICY "Allow chambers insert access on billing" ON public.billing FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow chambers update access on billing" ON public.billing FOR UPDATE USING (true);
CREATE POLICY "Allow chambers delete access on billing" ON public.billing FOR DELETE USING (true);

CREATE POLICY "Allow chambers read access on chambers_profile" ON public.chambers_profile FOR SELECT USING (true);
CREATE POLICY "Allow chambers insert access on chambers_profile" ON public.chambers_profile FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow chambers update access on chambers_profile" ON public.chambers_profile FOR UPDATE USING (true);
CREATE POLICY "Allow chambers delete access on chambers_profile" ON public.chambers_profile FOR DELETE USING (true);

-- Seed a single default row so the app always has a profile to update (idempotent)
INSERT INTO public.chambers_profile (id, chambers_name, tagline, address_line, bar_registry_no, account_name, bank_name, account_iban, swift_code)
VALUES (
  'main',
  'CHAMBERS OF ADV. MOHAMED ADIL',
  'ADVOCATES & LEGAL CONSULTANTS • LITIGATION PRACTICE REGISTRY',
  'High Court & Appellate Chambers • Dubai / New Delhi',
  'D/1842/2016',
  'Chambers of Adv. Mohamed Adil',
  'Emirates NBD / Standard Chartered',
  'AE140260001092837461',
  'ENBDAEADXXX'
)
ON CONFLICT (id) DO NOTHING;

-- Enable Realtime for all tables
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.clients, public.matters, public.hearings, public.billing, public.chambers_profile;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN others THEN NULL;
  END;
END $$;
