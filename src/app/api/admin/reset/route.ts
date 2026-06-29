import { NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseServiceRoleClient } from "@/lib/supabase/server";

/**
 * POST /api/admin/reset — Practice/testing reset (admin only).
 *
 * Resets the competition data back to a clean default state:
 *  1. Team names -> "Team {team_number}" (logo/enabled flags untouched)
 *  2. Deletes ALL score_events (so the leaderboard goes back to 0)
 *
 * Does NOT touch rounds, stations, or score_buttons — round/station/button
 * configuration (e.g. Litoff Mission's +1/+2/+3/+4) is left exactly as is.
 *
 * Uses the service-role client because deleting score_events is a
 * destructive bulk action with no RLS "delete" policy for admins by
 * design — only this explicit, server-only route can do it.
 */
export async function POST() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const service = createSupabaseServiceRoleClient();

  // 1) Reset team names back to "Team {number}"
  const { data: teams, error: teamsFetchError } = await service
    .from("teams")
    .select("id, team_number")
    .is("deleted_at", null);

  if (teamsFetchError) {
    return NextResponse.json({ error: teamsFetchError.message }, { status: 500 });
  }

  for (const team of teams ?? []) {
    const { error: renameError } = await service
      .from("teams")
      .update({ name: `Team ${team.team_number}` })
      .eq("id", team.id);
    if (renameError) {
      return NextResponse.json({ error: renameError.message }, { status: 500 });
    }
  }

  // 2) Wipe all score events -> leaderboard derives back to 0
  const { error: deleteError } = await service
    .from("score_events")
    .delete()
    .not("id", "is", null); // delete-all guard required by some Postgres/PostgREST setups

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  // 3) Reset competition status back to not_started, clear active round/station
  await service
    .from("competition_status")
    .update({ status: "not_started", active_round_id: null, active_station_id: null })
    .eq("id", 1);

  return NextResponse.json({ data: { ok: true, teamsReset: teams?.length ?? 0 } });
}