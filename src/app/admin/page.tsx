"use client";

import { useState } from "react";
import Link from "next/link";
import { Play, Pause, Square, FlaskConical, Puzzle, Rocket, RotateCcw, AlertTriangle } from "lucide-react";
import { useCompetitionStatus } from "@/hooks/use-competition-status";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";

/** Admin dashboard — competition-wide controls + quick navigation to each round. */
export default function AdminDashboardPage() {
  const { status, isLoading, updateStatus } = useCompetitionStatus();
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  async function handleResetClick() {
    if (!confirmingReset) {
      setConfirmingReset(true);
      setResetMessage(null);
      // Auto-cancel the confirm state after 5s if admin doesn't confirm.
      setTimeout(() => setConfirmingReset(false), 5000);
      return;
    }

    setIsResetting(true);
    setConfirmingReset(false);
    try {
      const res = await fetch("/api/admin/reset", { method: "POST" });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        setResetMessage(`Berhasil! ${body.data?.teamsReset ?? 0} tim & seluruh skor sudah dikembalikan ke default.`);
      } else {
        setResetMessage(body.error ?? "Gagal mereset data. Coba lagi.");
      }
    } catch {
      setResetMessage("Gagal terhubung ke server. Coba lagi.");
    } finally {
      setIsResetting(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold text-brand-700">Dashboard Admin</h1>
        <p className="text-sm text-slate-500">Kontrol status kompetisi & navigasi antar round.</p>
      </header>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <span className="font-semibold">Status Kompetisi</span>
          {!isLoading && status && <StatusBadge status={status.status} />}
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="positive" size="sm" onClick={() => updateStatus({ status: "live" })}>
            <Play className="h-4 w-4" /> Start / Resume
          </Button>
          <Button variant="outline" size="sm" onClick={() => updateStatus({ status: "paused" })}>
            <Pause className="h-4 w-4" /> Pause
          </Button>
          <Button variant="negative" size="sm" onClick={() => updateStatus({ status: "finished" })}>
            <Square className="h-4 w-4" /> Finish
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <span className="font-semibold">Reset</span>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-slate-500">
            Mengembalikan nama tim ke default dan menghapus
            seluruh riwayat skor sehingga leaderboard balik ke 0. Aksi ini permanen.
          </p>
          <Button
            variant={confirmingReset ? "negative" : "outline"}
            size="sm"
            onClick={handleResetClick}
            disabled={isResetting}
          >
            <RotateCcw className="h-4 w-4" />
            {isResetting ? "Mereset..." : confirmingReset ? "Yakin? Klik sekali lagi untuk reset" : "Reset Nama Tim & Skor ke Default"}
          </Button>
          {resetMessage && <p className="text-sm text-slate-600">{resetMessage}</p>}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <RoundShortcut href="/admin/rounds/litoff-mission" icon={FlaskConical} title="Litoff Mission" desc="Energy / Material / Instrumentation Lab" />
        <RoundShortcut href="/admin/rounds/find-missing-piece" icon={Puzzle} title="Find the Missing Piece" desc="+1 / +0 scoring" />
        <RoundShortcut href="/admin/rounds/final-horizon" icon={Rocket} title="Final Horizon" desc="Miller / Nebula / Singularity" />
      </div>
    </div>
  );
}

function RoundShortcut({
  href,
  icon: Icon,
  title,
  desc,
}: {
  href: string;
  icon: typeof FlaskConical;
  title: string;
  desc: string;
}) {
  return (
    <Link href={href}>
      <Card className="h-full p-4 transition hover:border-brand-400 hover:shadow-md">
        <Icon className="mb-2 h-6 w-6 text-brand-600" />
        <div className="font-bold text-slate-900">{title}</div>
        <div className="text-xs text-slate-500">{desc}</div>
      </Card>
    </Link>
  );
}