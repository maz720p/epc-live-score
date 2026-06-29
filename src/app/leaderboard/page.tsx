"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useRealtimeLeaderboard } from "@/hooks/use-realtime-leaderboard";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Participant-facing (and admin-accessible) realtime leaderboard.
 * Participants are read-only here: no score controls render on this page.
 */
export default function LeaderboardPage() {
  const router = useRouter();
  const { rows, isLoading, error, isConnected } = useRealtimeLeaderboard();

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-8">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-brand-700">EPC Live Leaderboard</h1>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4" /> Keluar
        </Button>
      </header>
      <LeaderboardTable rows={rows} isLoading={isLoading} isConnected={isConnected} error={error} />
    </main>
  );
}
