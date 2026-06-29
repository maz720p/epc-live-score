# PANDUAN — EPC LIVE SCORE SYSTEM

## ⚠️ Catatan penting tentang permintaan Anda

Spesifikasi `epc.md` yang Anda upload sangat panjang (~7000 baris). Saat saya proses,
**bagian tengah file (kira-kira baris 509–6439, berisi detail skema database/halaman/endpoint)
gagal termuat ulang** karena masalah sinkronisasi file di sistem upload — file tersebut
bahkan sempat hilang dari direktori upload sebelum saya bisa membacanya kedua kali.

Yang saya pakai untuk membangun proyek ini:
- Bagian **awal** epc.md (Project Overview, Target Users, Admin/Participant Capabilities,
  Tech Stack, System Architecture, Database Philosophy, Atomic Transactions, Audit Log).
- Bagian **akhir** epc.md (AI Execution Mode, No Placeholder, No Hardcode, Success Criteria).
- **Keenam diagram** yang Anda upload (general flow, login flow, round flow Lab Energi,
  round flow Final Horizon, mockup leaderboard ala Premier League, mockup scoring card
  "Score Cerdas Cermat").

Jika ada detail di bagian tengah epc.md yang hilang (misalnya kolom tabel tambahan,
halaman lain, atau aturan bisnis spesifik) yang belum tercakup di proyek ini — **silakan
upload ulang epc.md**, dan saya akan menyesuaikan proyek tanpa mengubah arsitektur yang
sudah dibangun.

## Keputusan teknologi yang saya ambil

Sketsa di diagram round flow menulis "node.js / mongoDB / websocket.io" — tetapi bagian
**"TECHNOLOGY DECISIONS"** di epc.md secara eksplisit melarang MongoDB, Socket.IO, Express,
dan mewajibkan stack: **Next.js 15 + Supabase (PostgreSQL, Auth, Realtime, Storage)**.
Saya mengikuti instruksi tertulis ini (lebih spesifik & lebih baru dari sketsa tangan),
dan menerjemahkan **alur halaman & alur skor di diagram apa adanya** — tidak ada
round/role/halaman yang saya tambahkan atau saya hilangkan.

## Apa yang sudah berfungsi penuh

- **Login** satu halaman untuk Admin & Peserta (role ditentukan dari tabel `profiles`,
  bukan dari halaman mana yang diklik) — sesuai diagram B.
- **Manage Teams**: tambah, edit nama/nomor/logo, hapus (soft-delete), enable/disable,
  search, filter status — lengkap dengan validasi Zod + React Hook Form.
- **3 Round** sesuai diagram, tidak dihardcode di frontend (semua dari tabel `rounds`,
  `stations`, `score_buttons`):
  - **Lab Energi** → Energy Lab / Material Lab / Instrumentation Lab (tombol +1 +2 +3 +4)
  - **Find the Missing Piece** (tombol +1 / +0)
  - **Final Horizon** → Miller (+10/-5), Nebula (+20/-10), Singularity (+30/-0)
- **Setiap klik tombol skor = satu Score Event immutable** (tidak pernah update/overwrite),
  dijalankan lewat fungsi Postgres `insert_score_event` (transaksi atomik: validasi →
  insert, gagal = rollback, tidak ada broadcast realtime).
- **Undo Latest Score Event** (menandai voided, tidak menghapus — audit trail tetap utuh).
- **Leaderboard real-time** tanpa polling/refresh manual — pakai Supabase Realtime
  (`postgres_changes` di tabel `score_events`/`teams`), dengan indikator status koneksi
  dan animasi skor (Framer Motion).
- **Competition Status** (Start/Pause/Resume/Finish) realtime.
- **Role-based route guard** di `middleware.ts` (peserta tidak bisa membuka `/admin/**`).
- **PWA**: manifest, service worker offline-first untuk shell, installable.
- Setiap komponen punya loading/error/empty state.
- Contoh unit test (`tests/leaderboard.test.ts`, vitest).

## Yang disederhanakan (perlu Anda lengkapi sebelum dipakai di kompetisi nyata)

Karena ini adalah enterprise spec ~7000 baris, beberapa hal saya scaffold tapi belum
selesai 100% — jujur saya sampaikan supaya tidak ada ekspektasi salah:

1. **Upload logo tim** ke Supabase Storage — endpoint `logoUrl` sudah menerima URL,
   tapi komponen upload file langsung belum dibuat (saat ini admin isi URL gambar).
2. **Ikon PWA PNG asli** (`icon-192.png`, `icon-512.png`) belum saya generate (butuh
   image generator) — sudah ada fallback `icon.svg`, tapi untuk hasil terbaik di iOS/
   Android ganti dengan PNG asli Anda di `public/icons/`.
3. **View Event History** detail per-tim (bukan hanya per-stasiun) — endpoint
   `/api/score-events` sudah mendukung filter `stationId`, tampilan tabel riwayat detail
   belum dibuatkan UI-nya.
4. **shadcn/ui resmi** belum di-install via CLI — saya tulis komponen UI primitif
   sendiri (Button/Card/Badge/Input) dengan Tailwind agar proyek langsung jalan tanpa
   `npx shadcn` interaktif. Anda bisa `npx shadcn@latest add ...` kapan saja untuk
   menambah komponen resmi.
5. **Integration/E2E test** baru contoh 1 file unit test; belum ada Playwright test nyata.

## Cara menjalankan

```bash
pnpm install
cp .env.example .env.local   # isi dengan kredensial project Supabase Anda
```

1. Buat project baru di https://supabase.com
2. Di SQL Editor Supabase, jalankan berurutan:
   - `supabase/schema.sql`
   - `supabase/functions.sql`
   - `supabase/seed.sql`
3. Isi `.env.local` dari Project Settings → API (URL, anon key, service role key)
4. Buat akun demo (admin1/EPCSUKSESS & peserta/epc16 sesuai diagram login):
   ```bash
   pnpm run seed:users
   ```
5. Jalankan lokal:
   ```bash
   pnpm dev
   ```
   Buka http://localhost:3000 → login dengan salah satu akun demo di atas.

## Deploy

- **Frontend**: push ke GitHub → import di Vercel → isi env vars yang sama seperti
  `.env.local` → deploy. Tidak perlu ubah kode apa pun.
- **Backend**: Supabase sudah hosted (cloud), tidak perlu server tambahan.

## Struktur folder singkat

```
src/app/            → halaman (login, leaderboard, admin/*) + API routes (admin/api)
src/components/      → leaderboard table, score button card, round board, UI primitives
src/hooks/           → realtime leaderboard, rounds, teams, competition status
src/lib/supabase/    → client (browser) & server client
src/types/           → tipe TypeScript yang mencerminkan skema database
supabase/schema.sql  → semua tabel, index, RLS policy, view leaderboard_view
supabase/functions.sql → fungsi transaksi atomik insert/undo score event
supabase/seed.sql    → 21 tim demo + 3 round + stasiun + tombol skor sesuai diagram
scripts/seed-users.ts → buat 2 akun demo (admin & peserta)
```
