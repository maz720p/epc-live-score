"use client";

import { useEffect, useState, useCallback } from "react";
import type { Round, Station, ScoreButton } from "@/types/database";

export interface StationWithButtons extends Station {
  score_buttons: ScoreButton[];
}
export interface RoundWithStations extends Round {
  stations: StationWithButtons[];
}

/** Fetches rounds + nested stations + score buttons. Never hardcoded client-side. */
export function useRounds() {
  const [rounds, setRounds] = useState<RoundWithStations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      const res = await fetch("/api/rounds");
      if (!res.ok) throw new Error("Gagal memuat data round");
      const json = await res.json();
      setRounds(json.data ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data round");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { rounds, isLoading, error, refetch };
}
