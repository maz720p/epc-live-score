-- ============================================================
-- RPC FUNCTIONS — atomic, transactional score operations.
-- The API route never does a bare INSERT; it always calls one of
-- these functions so validation + insert happen in one transaction.
-- ============================================================

-- Insert a new immutable score event. Validates the team is enabled
-- and the round/station exist before writing. SECURITY DEFINER lets
-- it run with the function owner's rights, but we still re-check the
-- caller's role explicitly so RLS bypass cannot be abused.
create or replace function insert_score_event(
  p_team_id uuid,
  p_round_id uuid,
  p_station_id uuid,
  p_score_value integer,
  p_device_info jsonb default '{}'::jsonb
)
returns score_events
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_role text;
  v_team_enabled boolean;
  v_event score_events;
begin
  select role into v_role from profiles where id = v_caller;
  if v_role is distinct from 'admin' then
    raise exception 'ONLY_ADMIN_CAN_SCORE' using errcode = '42501';
  end if;

  select is_enabled into v_team_enabled
  from teams where id = p_team_id and deleted_at is null;

  if v_team_enabled is null then
    raise exception 'TEAM_NOT_FOUND' using errcode = 'P0002';
  end if;

  if v_team_enabled = false then
    raise exception 'TEAM_DISABLED' using errcode = '42501';
  end if;

  if not exists (select 1 from stations where id = p_station_id and round_id = p_round_id) then
    raise exception 'STATION_ROUND_MISMATCH' using errcode = '22023';
  end if;

  insert into score_events (team_id, round_id, station_id, admin_id, score_value, device_info)
  values (p_team_id, p_round_id, p_station_id, v_caller, p_score_value, p_device_info)
  returning * into v_event;

  return v_event;
end;
$$;

-- Undo the latest non-voided score event created by the calling admin
-- (or any admin, if called by an admin acting on shared history).
-- We never delete rows — we mark them voided, preserving full audit trail.
create or replace function undo_latest_score_event(p_station_id uuid)
returns score_events
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_role text;
  v_event score_events;
begin
  select role into v_role from profiles where id = v_caller;
  if v_role is distinct from 'admin' then
    raise exception 'ONLY_ADMIN_CAN_UNDO' using errcode = '42501';
  end if;

  select * into v_event
  from score_events
  where station_id = p_station_id and is_voided = false
  order by created_at desc
  limit 1
  for update;

  if v_event.id is null then
    raise exception 'NO_EVENT_TO_UNDO' using errcode = 'P0002';
  end if;

  update score_events
  set is_voided = true, voided_at = now(), voided_by = v_caller
  where id = v_event.id
  returning * into v_event;

  return v_event;
end;
$$;
