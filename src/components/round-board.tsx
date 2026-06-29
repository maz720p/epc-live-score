"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Undo2, History, Trophy, ArrowLeft } from "lucide-react";
import { useRounds } from "@/hooks/use-rounds";
import { useTeams } from "@/hooks/use-teams";
import { useRealtimeLeaderboard } from "@/hooks/use-realtime-leaderboard";
import { TeamScoreCard } from "@/components/score-button-group";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Shared station-tabbed scoring board used by all three round pages
 * (Litoff Mission, Find the Missing Piece, Final Horizon). Per the official
 * diagrams: each round shows all teams with live score display, +/-
 * buttons per station, "View Leaderboard", "Undo", and "Back" navigation.
 */
export function RoundBoard({ roundSlug, backHref, backLabel }: { roundSlug: string; backHref: string; backLabel: string }) {
  const { rounds, isLoading: roundsLoading, error: roundsError } = useRounds();
  const { teams, isLoading: teamsLoading } = useTeams("", "all");
 // SESUDAH (yang benar)
  const { rows: leaderboardRows } = useRealtimeLeaderboard();
  const [activeStationId, setActiveStationId] = useState<string | null>(null);
  const [undoMessage, setUndoMessage] = useState<string | null>(null);

  const round = rounds.find((r) => r.slug === roundSlug);
  const stations = round?.stations.sort((a, b) => a.sequence - b.sequence) ?? [];
  const currentStation = stations.find((s) => s.id === activeStationId) ?? stations[0];

  const scoreByTeam = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of leaderboardRows) map.set(row.team_id, row.total_score);
    return map;
  }, [leaderboardRows]);

  async function handleUndo() {
    if (!currentStation) return;
    setUndoMessage(null);
    const res = await fetch("/api/score-events", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stationId: currentStation.id }),
    });
    const body = await res.json().catch(() => ({}));
    setUndoMessage(res.ok ? "Event terakhir berhasil dibatalkan." : body.error ?? "Tidak ada event untuk dibatalkan.");
  }

  if (roundsError) return <p className="text-sm text-rose-600">{roundsError}</p>;
  if (roundsLoading || teamsLoading) {
    return <div className="h-40 animate-pulse rounded-xl bg-slate-100" />;
  }
  if (!round) {
    return <p className="text-sm text-slate-500">Round &quot;{roundSlug}&quot; belum dikonfigurasi di database.</p>;
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-700">{round.name}</h1>
          <StatusBadge status={round.status} />
        </div>
        <div className="flex gap-2">
          <Link href="/leaderboard"><Button variant="outline" size="sm"><Trophy className="h-4 w-4" /> View Leaderboard</Button></Link>
          <Link href={backHref}><Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4" /> {backLabel}</Button></Link>
        </div>
      </header>

      {stations.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {stations.map((station) => (
            <button
              key={station.id}
              onClick={() => setActiveStationId(station.id)}
              className={cn(
                "shrink-0 rounded-lg border px-4 py-2 text-sm font-semibold",
                (currentStation?.id === station.id)
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              )}
            >
              {station.name}
            </button>
          ))}
        </div>
      )}

      {currentStation && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white p-3 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <History className="h-4 w-4" /> Stasiun aktif: <strong>{currentStation.name}</strong>
          </div>
          <Button size="sm" variant="outline" onClick={handleUndo}><Undo2 className="h-4 w-4" /> Undo Latest Score</Button>
        </div>
      )}
      {undoMessage && <p className="text-sm text-slate-500">{undoMessage}</p>}

      {currentStation && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <TeamScoreCard
              key={team.id}
              team={team}
              currentScore={scoreByTeam.get(team.id) ?? 0}
              buttons={currentStation.score_buttons.sort((a, b) => a.sequence - b.sequence)}
              roundId={round.id}
              stationId={currentStation.id}
              onScored={() => {}}
            />
          ))}
        </div>
      )}
    </div>
  );
}
