"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ScoreButton, Team } from "@/types/database";
import { cn } from "@/lib/utils";

interface TeamScoreCardProps {
  team: Team;
  currentScore: number;
  buttons: ScoreButton[];
  roundId: string;
  stationId: string;
  onScored: () => void;
}

/**
 * One team's live scoring card — mirrors the "Score Cerdas Cermat" mockup:
 * team identity, current score, and per-button click controls.
 * Each click POSTs one immutable score event; optimistic pulse animation,
 * then reconciles once realtime confirms the write.
 */
export function TeamScoreCard({ team, currentScore, buttons, roundId, stationId, onScored }: TeamScoreCardProps) {
  const [pendingButtonId, setPendingButtonId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleClick(button: ScoreButton) {
    setPendingButtonId(button.id);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/score-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: team.id,
          roundId,
          stationId,
          scoreValue: button.value,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Gagal mengirim skor");
      }
      onScored();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Gagal mengirim skor");
    } finally {
      setPendingButtonId(null);
    }
  }

  return (
    <Card className={cn("p-4", !team.is_enabled && "opacity-50")}>
      <div className="flex items-center justify-between">
        <div>
          <div className="font-bold text-slate-900">{team.name}</div>
          <div className="text-xs text-slate-400">#{team.team_number}</div>
        </div>
        <motion.div
          key={currentScore}
          initial={{ scale: 1.25 }}
          animate={{ scale: 1 }}
          className="text-2xl font-extrabold text-brand-700"
        >
          {currentScore}
        </motion.div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {buttons.map((button) => (
          <Button
            key={button.id}
            size="sm"
            variant={button.value >= 0 ? "positive" : "negative"}
            disabled={!team.is_enabled || pendingButtonId !== null}
            onClick={() => handleClick(button)}
          >
            {pendingButtonId === button.id ? <Loader2 className="h-4 w-4 animate-spin" /> : button.label}
          </Button>
        ))}
      </div>

      {errorMessage && <p className="mt-2 text-xs text-rose-600">{errorMessage}</p>}
    </Card>
  );
}
