"use client";

import { useEffect, useState, useCallback } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { CompetitionStatus } from "@/types/database";

/** Realtime competition status (Start/Pause/Resume/Finish banner). */
export function useCompetitionStatus() {
  const [status, setStatus] = useState<CompetitionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(async () => {
    const res = await fetch("/api/competition-status");
    if (res.ok) {
      const json = await res.json();
      setStatus(json.data);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refetch();
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel("competition-status-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "competition_status" }, refetch)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  async function updateStatus(patch: { status?: string; activeRoundId?: string | null; activeStationId?: string | null }) {
    await fetch("/api/competition-status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
  }

  return { status, isLoading, updateStatus };
}
