-- ============================================================
-- ONE-TIME FIX — run this ONCE in the Supabase SQL editor on your
-- EXISTING project to repair the "Lab Energi -> Litoff Mission"
-- rename and remove duplicated score_buttons rows.
--
-- Safe to run multiple times (idempotent).
-- ============================================================

-- 1) If a round still has the old slug 'lab-energi', rename it in place
--    (so we don't lose existing score_events/stations tied to its id).
update rounds
set slug = 'litoff-mission', name = 'Litoff Mission'
where slug = 'lab-energi';

-- 2) Remove duplicate score_buttons rows that piled up from re-running
--    seed.sql before it had ON CONFLICT protection. We keep the OLDEST
--    row per (station_id, label) and delete the rest.
delete from score_buttons sb
using (
  select id,
         row_number() over (
           partition by station_id, label
           order by created_at asc, id asc
         ) as rn
  from score_buttons
) dups
where sb.id = dups.id
  and dups.rn > 1;

-- 3) Add the unique constraint so this can never happen again
--    (no-op if it already exists).
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'score_buttons_station_id_label_key'
  ) then
    alter table score_buttons add constraint score_buttons_station_id_label_key unique (station_id, label);
  end if;
end $$;

-- 4) Sanity check — run this after the above and confirm each station
--    shows the expected button count (4 for Litoff Mission stations,
--    2 for Find the Missing Piece / Final Horizon stations).
select s.name as station, count(*) as button_count
from score_buttons sb
join stations s on s.id = sb.station_id
group by s.name
order by s.name;