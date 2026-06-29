import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createScoreEventSchema, undoScoreEventSchema } from "@/lib/validators";

/**
 * POST /api/score-events
 * Inserts one immutable score event via the insert_score_event RPC,
 * which runs inside a single Postgres transaction:
 *   validate -> insert -> (Supabase Realtime broadcasts the change)
 * If insertion fails, nothing is committed and no realtime event fires.
 */
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createScoreEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const deviceInfo = {
    userAgent: request.headers.get("user-agent") ?? "unknown",
    ip: request.headers.get("x-forwarded-for") ?? "unknown",
  };

  const { data, error } = await supabase.rpc("insert_score_event", {
    p_team_id: parsed.data.teamId,
    p_round_id: parsed.data.roundId,
    p_station_id: parsed.data.stationId,
    p_score_value: parsed.data.scoreValue,
    p_device_info: deviceInfo,
  });

  if (error) {
    const status = error.code === "42501" ? 403 : error.code === "P0002" ? 404 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }

  return NextResponse.json({ data }, { status: 201 });
}

/**
 * PATCH /api/score-events  (undo latest event for a station)
 * Marks the most recent non-voided event for the station as voided.
 * Never deletes — full audit trail is preserved.
 */
export async function PATCH(request: NextRequest) {
  const supabase = await createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = undoScoreEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { data, error } = await supabase.rpc("undo_latest_score_event", {
    p_station_id: parsed.data.stationId,
  });

  if (error) {
    const status = error.code === "42501" ? 403 : error.code === "P0002" ? 404 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }

  return NextResponse.json({ data });
}

/**
 * GET /api/score-events?stationId=...  (event history, for admin "View Event History")
 */
export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const stationId = request.nextUrl.searchParams.get("stationId");
  let query = supabase
    .from("score_events")
    .select("*, teams(name, team_number)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (stationId) {
    query = query.eq("station_id", stationId);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
