-- ============================================================
-- EPC LIVE SCORE SYSTEM — DATABASE SCHEMA
-- Source of truth: Supabase PostgreSQL
-- Philosophy: leaderboard is NEVER stored as a mutable total.
-- It is always derived from immutable score_events rows.
-- ============================================================

create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------
-- updated_at trigger helper
-- ------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ------------------------------------------------------------
-- profiles (extends supabase auth.users with a role)
-- ------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('admin', 'participant')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_profiles_updated_at
before update on profiles
for each row execute function set_updated_at();

-- ------------------------------------------------------------
-- rounds — never hardcoded in frontend, configured here
-- Matches the official flow: Litoff Mission -> Find the Missing Piece -> Final Horizon
-- ------------------------------------------------------------
create table if not exists rounds (
  id uuid primary key default uuid_generate_v4(),
  slug text not null unique,           -- 'litoff-mission' | 'find-missing-piece' | 'final-horizon'
  name text not null,
  sequence smallint not null,
  status text not null default 'pending' check (status in ('pending', 'live', 'paused', 'finished')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_rounds_updated_at
before update on rounds
for each row execute function set_updated_at();

-- ------------------------------------------------------------
-- stations — belong to a round (Energy/Material/Instrumentation Lab,
-- or Miller/Nebula/Singularity). Each station owns its own button values.
-- ------------------------------------------------------------
create table if not exists stations (
  id uuid primary key default uuid_generate_v4(),
  round_id uuid not null references rounds(id) on delete cascade,
  name text not null,
  sequence smallint not null,
  status text not null default 'pending' check (status in ('pending', 'live', 'paused', 'finished')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (round_id, name)
);

create trigger trg_stations_updated_at
before update on stations
for each row execute function set_updated_at();

-- ------------------------------------------------------------
-- score_buttons — configurable +/- values per station
-- (e.g. Litoff Mission: +1 +2 +3 +4 | Miller: +10/-5 | Singularity: +30/-0)
-- ------------------------------------------------------------
create table if not exists score_buttons (
  id uuid primary key default uuid_generate_v4(),
  station_id uuid not null references stations(id) on delete cascade,
  label text not null,
  value integer not null,
  sequence smallint not null default 0,
  created_at timestamptz not null default now(),
  unique (station_id, label)
);

-- ------------------------------------------------------------
-- teams — up to 21 teams per the diagrams, fully admin-manageable
-- ------------------------------------------------------------
create table if not exists teams (
  id uuid primary key default uuid_generate_v4(),
  team_number integer not null unique,
  name text not null,
  logo_url text,
  is_enabled boolean not null default true,
  deleted_at timestamptz,              -- soft delete
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_teams_updated_at
before update on teams
for each row execute function set_updated_at();

create index if not exists idx_teams_enabled on teams (is_enabled) where deleted_at is null;

-- ------------------------------------------------------------
-- score_events — IMMUTABLE audit log. Never updated, never deleted
-- automatically. Leaderboard = SUM(value) GROUP BY team, excluding
-- events whose is_voided = true (created by "Undo Latest Score Event").
-- ------------------------------------------------------------
create table if not exists score_events (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid not null references teams(id),
  round_id uuid not null references rounds(id),
  station_id uuid not null references stations(id),
  admin_id uuid not null references profiles(id),
  score_value integer not null,
  is_voided boolean not null default false,
  voided_at timestamptz,
  voided_by uuid references profiles(id),
  device_info jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_score_events_team on score_events (team_id);
create index if not exists idx_score_events_round on score_events (round_id);
create index if not exists idx_score_events_station on score_events (station_id);
create index if not exists idx_score_events_created on score_events (created_at desc);

-- ------------------------------------------------------------
-- competition_status — single row, drives Live/Paused/Finished banner
-- ------------------------------------------------------------
create table if not exists competition_status (
  id smallint primary key default 1 check (id = 1),
  status text not null default 'not_started'
    check (status in ('not_started', 'live', 'paused', 'finished')),
  active_round_id uuid references rounds(id),
  active_station_id uuid references stations(id),
  updated_at timestamptz not null default now()
);

insert into competition_status (id, status) values (1, 'not_started')
on conflict (id) do nothing;

create trigger trg_competition_status_updated_at
before update on competition_status
for each row execute function set_updated_at();

-- ------------------------------------------------------------
-- leaderboard view — derived, never hand-edited
-- ------------------------------------------------------------
create or replace view leaderboard_view as
select
  t.id as team_id,
  t.team_number,
  t.name as team_name,
  t.logo_url,
  t.is_enabled,
  coalesce(sum(se.score_value) filter (where se.is_voided = false), 0) as total_score,
  count(se.id) filter (where se.is_voided = false) as total_events,
  max(se.created_at) as last_event_at
from teams t
left join score_events se on se.team_id = t.id
where t.deleted_at is null
group by t.id, t.team_number, t.name, t.logo_url, t.is_enabled
order by total_score desc, last_event_at asc;

-- ------------------------------------------------------------
-- Row Level Security
-- ------------------------------------------------------------
alter table profiles enable row level security;
alter table teams enable row level security;
alter table rounds enable row level security;
alter table stations enable row level security;
alter table score_buttons enable row level security;
alter table score_events enable row level security;
alter table competition_status enable row level security;

-- Everyone authenticated can read; only admins can write.
create policy "profiles_select_own" on profiles for select using (auth.uid() = id);

create policy "teams_select_all" on teams for select using (auth.role() = 'authenticated');
create policy "teams_write_admin" on teams for all using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);

create policy "rounds_select_all" on rounds for select using (auth.role() = 'authenticated');
create policy "rounds_write_admin" on rounds for all using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);

create policy "stations_select_all" on stations for select using (auth.role() = 'authenticated');
create policy "stations_write_admin" on stations for all using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);

create policy "score_buttons_select_all" on score_buttons for select using (auth.role() = 'authenticated');
create policy "score_buttons_write_admin" on score_buttons for all using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);

create policy "score_events_select_all" on score_events for select using (auth.role() = 'authenticated');
create policy "score_events_insert_admin" on score_events for insert with check (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);
create policy "score_events_update_admin" on score_events for update using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);

create policy "competition_status_select_all" on competition_status for select using (auth.role() = 'authenticated');
create policy "competition_status_write_admin" on competition_status for all using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- ------------------------------------------------------------
-- Enable realtime on the tables participants/admins must watch live
-- ------------------------------------------------------------
alter publication supabase_realtime add table score_events;
alter publication supabase_realtime add table teams;
alter publication supabase_realtime add table competition_status;
alter publication supabase_realtime add table rounds;
alter publication supabase_realtime add table stations;