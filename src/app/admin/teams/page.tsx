"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash2, Power, Search, Loader2 } from "lucide-react";
import { useTeams } from "@/hooks/use-teams";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Team } from "@/types/database";

const teamFormSchema = z.object({
  teamNumber: z.coerce.number().int().min(1).max(999),
  name: z.string().min(1, "Nama wajib diisi").max(100),
  logoUrl: z.string().url().optional().or(z.literal("")),
});
type TeamFormValues = z.infer<typeof teamFormSchema>;

/** Manage Teams — Add / Edit name & number / Delete / Enable / Disable / Search / Filter. */
export default function ManageTeamsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "enabled" | "disabled">("all");
  const { teams, isLoading, error, refetch } = useTeams(search, statusFilter);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<TeamFormValues>({
    resolver: zodResolver(teamFormSchema),
  });

  function startEdit(team: Team) {
    setEditingTeam(team);
    reset({ teamNumber: team.team_number, name: team.name, logoUrl: team.logo_url ?? "" });
  }

  function startCreate() {
    setEditingTeam(null);
    reset({ teamNumber: undefined, name: "", logoUrl: "" });
  }

  async function onSubmit(values: TeamFormValues) {
    const payload = { teamNumber: values.teamNumber, name: values.name, logoUrl: values.logoUrl || null };
    const res = editingTeam
      ? await fetch(`/api/teams/${editingTeam.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch("/api/teams", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

    if (res.ok) {
      setEditingTeam(null);
      reset({ teamNumber: undefined, name: "", logoUrl: "" });
      refetch();
    }
  }

  async function toggleEnabled(team: Team) {
    await fetch(`/api/teams/${team.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isEnabled: !team.is_enabled }),
    });
    refetch();
  }

  async function deleteTeam(team: Team) {
    if (!confirm(`Hapus tim "${team.name}"?`)) return;
    await fetch(`/api/teams/${team.id}`, { method: "DELETE" });
    refetch();
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold text-brand-700">Manage Teams</h1>
        <p className="text-sm text-slate-500">Tambah, edit, hapus, aktif/nonaktifkan tim peserta.</p>
      </header>

      <Card>
        <CardHeader className="font-semibold">{editingTeam ? `Edit: ${editingTeam.name}` : "Tambah Tim Baru"}</CardHeader>
        <CardContent>
          <form className="grid gap-3 sm:grid-cols-[120px_1fr_1fr_auto]" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div>
              <Input placeholder="No. Tim" type="number" {...register("teamNumber")} />
              {errors.teamNumber && <p className="mt-1 text-xs text-rose-600">{errors.teamNumber.message}</p>}
            </div>
            <div>
              <Input placeholder="Nama Tim" {...register("name")} />
              {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name.message}</p>}
            </div>
            <Input placeholder="URL Logo (opsional)" {...register("logoUrl")} />
            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {editingTeam ? "Simpan" : "Tambah"}
              </Button>
              {editingTeam && (
                <Button type="button" variant="outline" onClick={startCreate}>Batal</Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input className="pl-9" placeholder="Cari tim…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-1">
            {(["all", "enabled", "disabled"] as const).map((s) => (
              <Button key={s} size="sm" variant={statusFilter === s ? "primary" : "outline"} onClick={() => setStatusFilter(s)}>
                {s === "all" ? "Semua" : s === "enabled" ? "Aktif" : "Nonaktif"}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {error && <p className="p-4 text-sm text-rose-600">{error}</p>}
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />)}
            </div>
          ) : teams.length === 0 ? (
            <p className="p-6 text-center text-sm text-slate-500">Tidak ada tim yang cocok.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2">No.</th>
                  <th className="px-4 py-2">Nama</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((team) => (
                  <tr key={team.id} className="border-t border-slate-100">
                    <td className="px-4 py-2">{team.team_number}</td>
                    <td className="px-4 py-2 font-medium">{team.name}</td>
                    <td className="px-4 py-2">
                      <span className={team.is_enabled ? "text-emerald-600" : "text-slate-400"}>
                        {team.is_enabled ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="inline-flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => startEdit(team)} aria-label="Edit"><Pencil className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => toggleEnabled(team)} aria-label="Enable/Disable"><Power className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => deleteTeam(team)} aria-label="Hapus"><Trash2 className="h-4 w-4 text-rose-600" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
