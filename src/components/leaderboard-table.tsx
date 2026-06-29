"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Wifi, WifiOff, Trophy } from "lucide-react";
import type { LeaderboardRow } from "@/types/database";
import { cn } from "@/lib/utils";

interface LeaderboardTableProps {
  rows: LeaderboardRow[];
  isLoading: boolean;
  isConnected: boolean;
  error: string | null;
}

/**
 * Realtime ranking table, styled after the Premier League "Tables" page
 * reference: rank, club identity, and points front-and-center, zebra rows,
 * top-3 highlighted. Loading / error / empty states all handled.
 */
export function LeaderboardTable({ rows, isLoading, isConnected, error }: LeaderboardTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-brand-700 to-brand-500 px-5 py-4 text-white">
        <div className="flex items-center gap-2 text-lg font-bold">
          <Trophy className="h-5 w-5" aria-hidden /> Leaderboard
        </div>
        <div className="flex items-center gap-1.5 text-xs font-medium">
          {isConnected ? (
            <>
              <Wifi className="h-4 w-4" aria-hidden /> Live
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4" aria-hidden /> Reconnecting…
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="px-5 py-4 text-sm text-rose-600" role="alert">
          Gagal memuat leaderboard: {error}
        </div>
      )}

      {!error && isLoading && (
        <div className="space-y-2 p-5" aria-busy="true" aria-label="Memuat leaderboard">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />
          ))}
        </div>
      )}

      {!error && !isLoading && rows.length === 0 && (
        <div className="px-5 py-10 text-center text-sm text-slate-500">
          Belum ada tim. Tambahkan tim di halaman Manage Teams.
        </div>
      )}

      {!error && !isLoading && rows.length > 0 && (
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-5 py-3">Pos</th>
              <th className="px-5 py-3">Tim</th>
              <th className="px-5 py-3 text-right">Events</th>
              <th className="px-5 py-3 text-right">Skor</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {rows.map((row, index) => (
                <motion.tr
                  key={row.team_id}
                  layout
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className={cn(
                    "border-t border-slate-100",
                    index < 3 ? "bg-amber-50/60" : "even:bg-slate-50/50",
                    !row.is_enabled && "opacity-50"
                  )}
                >
                  <td className="px-5 py-3 font-bold text-slate-700">{index + 1}</td>
                  <td className="px-5 py-3">
                    <div className="font-semibold text-slate-900">{row.team_name}</div>
                    <div className="text-xs text-slate-400">#{row.team_number}</div>
                  </td>
                  <td className="px-5 py-3 text-right text-slate-500">{row.total_events}</td>
                  <td className="px-5 py-3 text-right">
                    <motion.span
                      key={row.total_score}
                      initial={{ scale: 1.3 }}
                      animate={{ scale: 1 }}
                      className="inline-block text-lg font-extrabold text-brand-700"
                    >
                      {row.total_score}
                    </motion.span>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      )}
    </div>
  );
}
