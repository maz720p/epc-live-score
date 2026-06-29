"use client";

import { useEffect, useState, useCallback } from "react";
import type { Team } from "@/types/database";

/** Fetches teams with optional search/filter, used by Manage Teams and round score boards. */
export function useTeams(search = "", status: "all" | "enabled" | "disabled" = "all") {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (status !== "all") params.set("status", status);
      const res = await fetch(`/api/teams?${params.toString()}`);
      if (!res.ok) throw new Error("Gagal memuat data tim");
      const json = await res.json();
      setTeams(json.data ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data tim");
    } finally {
      setIsLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { teams, isLoading, error, refetch };
}
