"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users2, FlaskConical, Puzzle, Rocket, Trophy, LogOut } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/teams", label: "Manage Teams", icon: Users2 },
  { href: "/admin/rounds/litoff-mission", label: "Litoff Mission", icon: FlaskConical },
  { href: "/admin/rounds/find-missing-piece", label: "Find the Missing Piece", icon: Puzzle },
  { href: "/admin/rounds/final-horizon", label: "Final Horizon", icon: Rocket },
  { href: "/leaderboard", label: "View Leaderboard", icon: Trophy },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <div className="flex min-h-screen flex-col sm:flex-row">
      <nav className="flex shrink-0 flex-col gap-1 border-b border-slate-200 bg-white p-3 sm:w-60 sm:border-b-0 sm:border-r">
        <div className="mb-2 px-2 text-lg font-extrabold text-brand-700">EPC Admin</div>
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100",
              pathname === href && "bg-brand-50 text-brand-700"
            )}
          >
            <Icon className="h-4 w-4" /> {label}
          </Link>
        ))}
        <button
          onClick={handleLogout}
          className="mt-2 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50"
        >
          <LogOut className="h-4 w-4" /> Logout
        </button>
      </nav>
      <main className="flex-1 p-4 sm:p-8">{children}</main>
    </div>
  );
}