-- ============================================================
-- SEED DATA — matches the official flow diagrams exactly:
-- Round 1: Litoff Mission -> Energy Lab / Material Lab / Instrumentation Lab
--          (each station: buttons +1 +2 +3 +4)
-- Round 1b: Find the Missing Piece (button +1 / +0)
-- Round 2: Final Horizon -> Miller (+10/-5) / Nebula (+20/-10) / Singularity (+30/-0)
-- Plus 21 demo teams (per "21 team" notes on the diagrams).
-- ============================================================

-- Rounds -------------------------------------------------------
insert into rounds (slug, name, sequence) values
  ('litoff-mission', 'Litoff Mission', 1),
  ('find-missing-piece', 'Find the Missing Piece', 2),
  ('final-horizon', 'Final Horizon', 3)
on conflict (slug) do nothing;

-- Stations for Litoff Mission --------------------------------------
insert into stations (round_id, name, sequence)
select r.id, s.name, s.sequence
from rounds r,
 (values ('Energy Lab', 1), ('Material Lab', 2), ('Instrumentation Lab', 3)) as s(name, sequence)
where r.slug = 'litoff-mission'
on conflict (round_id, name) do nothing;

-- Station for Find the Missing Piece ----------------------------
insert into stations (round_id, name, sequence)
select r.id, 'Find the Missing Piece', 1
from rounds r where r.slug = 'find-missing-piece'
on conflict (round_id, name) do nothing;

-- Stations for Final Horizon --------------------------------------
insert into stations (round_id, name, sequence)
select r.id, s.name, s.sequence
from rounds r,
 (values ('Miller', 1), ('Nebula', 2), ('Singularity', 3)) as s(name, sequence)
where r.slug = 'final-horizon'
on conflict (round_id, name) do nothing;

-- Score buttons: Litoff Mission stations -> +1 +2 +3 +4 ----------------
insert into score_buttons (station_id, label, value, sequence)
select st.id, b.label, b.value, b.sequence
from stations st
join rounds r on r.id = st.round_id and r.slug = 'litoff-mission'
cross join (values ('+1', 1, 1), ('+2', 2, 2), ('+3', 3, 3), ('+4', 4, 4)) as b(label, value, sequence)
on conflict (station_id, label) do nothing;

-- Score buttons: Find the Missing Piece -> +1 / +0 -------------------
insert into score_buttons (station_id, label, value, sequence)
select st.id, b.label, b.value, b.sequence
from stations st
join rounds r on r.id = st.round_id and r.slug = 'find-missing-piece'
cross join (values ('+1', 1, 1), ('+0', 0, 2)) as b(label, value, sequence)
on conflict (station_id, label) do nothing;

-- Score buttons: Final Horizon -----------------------------------
insert into score_buttons (station_id, label, value, sequence)
select st.id, '+10', 10, 1 from stations st
join rounds r on r.id = st.round_id and r.slug = 'final-horizon' where st.name = 'Miller'
on conflict (station_id, label) do nothing;
insert into score_buttons (station_id, label, value, sequence)
select st.id, '-5', -5, 2 from stations st
join rounds r on r.id = st.round_id and r.slug = 'final-horizon' where st.name = 'Miller'
on conflict (station_id, label) do nothing;

insert into score_buttons (station_id, label, value, sequence)
select st.id, '+20', 20, 1 from stations st
join rounds r on r.id = st.round_id and r.slug = 'final-horizon' where st.name = 'Nebula'
on conflict (station_id, label) do nothing;
insert into score_buttons (station_id, label, value, sequence)
select st.id, '-10', -10, 2 from stations st
join rounds r on r.id = st.round_id and r.slug = 'final-horizon' where st.name = 'Nebula'
on conflict (station_id, label) do nothing;

insert into score_buttons (station_id, label, value, sequence)
select st.id, '+30', 30, 1 from stations st
join rounds r on r.id = st.round_id and r.slug = 'final-horizon' where st.name = 'Singularity'
on conflict (station_id, label) do nothing;
insert into score_buttons (station_id, label, value, sequence)
select st.id, '-0', 0, 2 from stations st
join rounds r on r.id = st.round_id and r.slug = 'final-horizon' where st.name = 'Singularity'
on conflict (station_id, label) do nothing;

-- 21 demo teams ---------------------------------------------------
insert into teams (team_number, name)
select n, 'Team ' || n
from generate_series(1, 21) as n
on conflict (team_number) do nothing;

-- NOTE: Admin & participant LOGIN accounts (admin1 / EPCSUKSESS and
-- peserta / epc16, per diagram B) must be created via Supabase Auth,
-- not raw SQL (passwords need to go through Supabase's hashing).
-- Run: pnpm run seed:users   (see scripts/seed-users.ts)