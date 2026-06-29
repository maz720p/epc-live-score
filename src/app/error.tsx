"use client";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-4 text-center">
      <h2 className="text-lg font-bold text-rose-600">Terjadi kesalahan</h2>
      <p className="text-sm text-slate-500">{error.message}</p>
      <button onClick={reset} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
        Coba lagi
      </button>
    </div>
  );
}
