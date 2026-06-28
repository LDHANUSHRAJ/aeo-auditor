-- Run this in your Supabase SQL editor.
-- Two tables: audit_leads (user acquisition) + audit_reports (report storage).
-- No API keys are ever stored in either table.

-- ── Lead capture table ───────────────────────────────────────────────────────
create table if not exists audit_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  email text not null,
  business_name text not null,
  website_url text,
  category text,
  city text
);

alter table audit_leads enable row level security;

create policy "Public insert leads"
  on audit_leads for insert
  with check (true);

-- Only you (service role) can read leads — anon users cannot list emails
create policy "Service role read leads"
  on audit_leads for select
  using (auth.role() = 'service_role');
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Audit reports table ──────────────────────────────────────────────────────
-- The table stores only the final structured report — no API keys, no raw prompts.

create table if not exists audit_reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  business_name text not null,
  website_url text,
  category text not null,
  city text not null,
  competitors jsonb not null default '[]',
  queries jsonb not null default '[]',
  score jsonb not null,
  fixes jsonb not null default '[]',
  competitor_stats jsonb not null default '[]',
  queries_completed integer not null default 0,
  queries_total integer not null default 0
);

-- Enable Row Level Security (reports are publicly readable by shareable ID, writable by anyone)
alter table audit_reports enable row level security;

-- Public read: anyone with the report ID can view it
create policy "Public read audit reports"
  on audit_reports for select
  using (true);

-- Public insert: anyone can save a report (no auth required for v1)
create policy "Public insert audit reports"
  on audit_reports for insert
  with check (true);

-- ── SERP cache table (24h TTL, protects Serper free quota) ──────────────────
create table if not exists serp_cache (
  query_hash text primary key,
  query text not null,
  results_json jsonb not null,
  fetched_at timestamptz not null default now()
);

alter table serp_cache enable row level security;

-- Server-side only (service role reads + writes via API route)
create policy "Service role manage serp cache"
  on serp_cache for all
  using (auth.role() = 'service_role');

-- Anon can insert (API route uses anon key by default)
create policy "Anon insert serp cache"
  on serp_cache for insert
  with check (true);

create policy "Anon read serp cache"
  on serp_cache for select
  using (true);
