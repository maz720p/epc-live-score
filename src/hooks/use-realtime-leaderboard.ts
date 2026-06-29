"use client";

import { useEffect, useState, useCallback } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { LeaderboardRow } from "@/types/database";

interface UseRealtimeLeaderboardResult {
  rows: LeaderboardRow[];
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
}

/**
 * Subscribes to score_events / teams changes via Supabase Realtime and
 * re-fetches the derived leaderboard_view whenever something changes.
 * No polling. No manual refresh. Auto-reconnects on disconnect.
 */
export function useRealtimeLeaderboard(): UseRealtimeLeaderboardResult {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const fetchLeaderboard = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    const { data, error: fetchError } = await supabase
      .from("leaderboard_view")
      .select("*")
      .order("total_score", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setRows((data ?? []) as LeaderboardRow[]);
      setError(null);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    fetchLeaderboard();

    const channel = supabase
      .channel("leaderboard-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "score_events" }, fetchLeaderboard)
      .on("postgres_changes", { event: "*", schema: "public", table: "teams" }, fetchLeaderboard)
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
        if (status === "CLOSED" || status === "CHANNEL_ERROR") {
          // Supabase client auto-retries; we just reflect the state.
          setIsConnected(false);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLeaderboard]);

  return { rows, isLoading, error, isConnected };
}
