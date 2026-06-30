# EPC Live Score System

Sistem pencatatan skor dan leaderboard realtime untuk Engineering Physics Challenge (EPC). Dibangun dengan Next.js 15 dan Supabase. Dokumen ini menjelaskan seluruh fitur aplikasi beserta cara penggunaannya, mulai dari login, mengelola tim, mencatat skor, hingga mereset data.

---

## Daftar Isi

1. Gambaran Umum
2. Peran Pengguna
3. Login
4. Halaman Leaderboard
5. Dashboard Admin
6. Mengelola Status Kompetisi
7. Mengelola Tim
8. Mencatat Skor per Round
9. Membatalkan Skor (Undo)
10. Mereset Data Latihan
11. Logout
12. Struktur Round dan Tombol Skor
13. Panduan Developer (Setup Lokal dan Deploy)

---

## 1. Gambaran Umum

Aplikasi ini terdiri dari dua sisi: tampilan publik berupa leaderboard realtime untuk peserta, dan tampilan admin untuk panitia yang bertugas mencatat skor selama kompetisi berlangsung.

Semua skor tersimpan sebagai riwayat permanen di database. Leaderboard dihitung otomatis dari total riwayat skor setiap tim, bukan dari angka yang diubah langsung. Hal ini memastikan setiap perubahan skor bisa dilacak dan dibatalkan jika terjadi kesalahan input.

Kompetisi terdiri dari tiga round:

- Litoff Mission, dengan tiga station: Energy Lab, Material Lab, dan Instrumentation Lab
- Find the Missing Piece
- Final Horizon, dengan tiga station: Miller, Nebula, dan Singularity

---

## 2. Peran Pengguna

Terdapat dua peran dalam sistem ini:

- Admin: bisa mengelola tim, mencatat skor, mengubah status kompetisi, dan mereset data latihan
- Peserta: hanya bisa melihat leaderboard secara realtime, tidak bisa mengubah data apapun

Peran ditentukan dari akun yang digunakan untuk login, bukan dari halaman yang dibuka secara manual.

---

## 3. Login

1. Buka alamat aplikasi di browser.
2. Halaman login akan muncul dengan dua kolom: Email dan Password.
3. Masukkan email dan password sesuai akun, lalu klik tombol login.
4. Jika email atau password salah, akan muncul pesan kesalahan.
5. Jika berhasil:
   - Akun dengan role admin akan diarahkan ke Dashboard Admin.
   - Akun dengan role peserta akan diarahkan ke halaman Leaderboard.

---

## 4. Halaman Leaderboard

Halaman leaderboard menampilkan peringkat seluruh tim berdasarkan total skor, diurutkan dari yang tertinggi. Halaman ini memperbarui dirinya sendiri secara realtime setiap kali admin mencatat skor baru, tanpa perlu memuat ulang halaman.

Informasi yang ditampilkan untuk setiap tim:

- Peringkat
- Nomor tim
- Nama tim
- Logo tim, jika sudah diatur
- Total skor saat ini

Halaman ini bisa diakses oleh semua pengguna yang sudah login, baik peserta maupun admin.

---

## 5. Dashboard Admin

Setelah login sebagai admin, halaman pertama yang muncul adalah Dashboard Admin. Di sisi kiri terdapat sidebar navigasi dengan menu berikut:

- Dashboard: kembali ke halaman utama admin
- Manage Teams: mengelola data tim peserta
- Litoff Mission: mencatat skor untuk round pertama
- Find the Missing Piece: mencatat skor untuk round kedua
- Final Horizon: mencatat skor untuk round ketiga
- View Leaderboard: membuka halaman leaderboard publik
- Logout: keluar dari akun

Halaman dashboard sendiri berisi tiga bagian: kontrol Status Kompetisi, kontrol Reset Data Latihan, dan tiga kartu pintasan menuju masing-masing round.

---

## 6. Mengelola Status Kompetisi

Di bagian atas dashboard terdapat kartu Status Kompetisi dengan tiga tombol:

- Start / Resume: mengubah status menjadi live (kompetisi sedang berjalan)
- Pause: menghentikan kompetisi sementara tanpa mengakhirinya
- Finish: mengakhiri kompetisi secara resmi

Status yang aktif ditampilkan sebagai label di sisi kanan kartu, yaitu NOT STARTED, LIVE, PAUSED, atau FINISHED. Status ini bersifat informasi dan tidak menghalangi admin untuk mencatat skor kapan saja.

---

## 7. Mengelola Tim

Buka menu Manage Teams di sidebar untuk mengatur data tim peserta.

### Menambah Tim Baru

1. Isi kolom No. Tim dan Nama Tim pada form di bagian atas halaman. Kolom URL Logo bersifat opsional.
2. Klik tombol Tambah.
3. Tim baru akan langsung muncul di tabel di bawah form.

### Mengedit Tim

1. Temukan tim yang ingin diubah di tabel.
2. Klik ikon pensil pada kolom Aksi di baris tim tersebut.
3. Form di atas akan terisi otomatis dengan data tim yang dipilih.
4. Ubah data yang diperlukan, lalu klik tombol Simpan.
5. Untuk membatalkan proses edit tanpa menyimpan, klik tombol Batal.

### Menonaktifkan atau Mengaktifkan Tim

Klik ikon daya (power icon) pada kolom Aksi di baris tim yang dituju. Tim yang dinonaktifkan tidak bisa menerima skor baru dari halaman pencatatan round, namun riwayat skornya tetap tersimpan dan tetap muncul di leaderboard.

### Menghapus Tim

Klik ikon tempat sampah pada kolom Aksi. Konfirmasi akan muncul sebelum penghapusan dilakukan. Penghapusan ini bersifat soft delete, artinya tim disembunyikan dari daftar aktif tetapi riwayat skornya tetap ada di database.

### Mencari dan Menyaring Tim

Gunakan kolom pencarian untuk mencari tim berdasarkan nama. Gunakan tombol filter Semua, Aktif, atau Nonaktif untuk menyaring daftar berdasarkan status tim.

---

## 8. Mencatat Skor per Round

Klik salah satu round di sidebar (Litoff Mission, Find the Missing Piece, atau Final Horizon) untuk membuka halaman pencatatan skor round tersebut.

1. Jika round memiliki lebih dari satu station, akan muncul tab station di bagian atas halaman. Klik tab station yang sedang aktif.
2. Di bawahnya akan muncul kartu untuk setiap tim yang berisi nama tim, nomor tim, skor saat ini, dan tombol-tombol nilai skor sesuai konfigurasi station tersebut.
3. Klik tombol nilai yang sesuai pada kartu tim yang ingin diberi skor, misalnya tombol +1, +2, +3, atau +4.
4. Skor tim langsung bertambah dan tersinkron ke leaderboard secara realtime.

Setiap klik tombol dicatat sebagai satu baris riwayat skor yang permanen. Total skor selalu dihitung dari jumlah seluruh riwayat yang belum dibatalkan.

Tim yang berstatus nonaktif akan tampil dengan tampilan redup dan tombol skornya tidak bisa diklik.

---

## 9. Membatalkan Skor (Undo)

Pada setiap halaman pencatatan skor round, terdapat tombol Undo Latest Score di bagian atas halaman, di samping informasi station yang sedang aktif.

Tombol ini membatalkan satu catatan skor terakhir yang dimasukkan untuk station yang sedang aktif. Setelah diklik, akan muncul pesan konfirmasi di bawah tombol.

Pembatalan tidak menghapus riwayat dari database secara permanen. Data tetap tersimpan namun ditandai sebagai dibatalkan, sehingga tidak lagi dihitung dalam total skor tim.

---

## 10. Mereset Data Latihan

Kartu Reset Data Latihan di dashboard admin digunakan untuk mengembalikan semua data ke kondisi awal sebelum kompetisi sesungguhnya dimulai, misalnya setelah sesi uji coba atau latihan.

Yang akan direset:

- Nama semua tim dikembalikan ke format default (Team 1, Team 2, dan seterusnya)
- Seluruh riwayat skor dihapus sehingga leaderboard kembali ke angka nol
- Status kompetisi dikembalikan ke not started

Yang tidak akan berubah:

- Konfigurasi round, station, dan tombol skor tetap utuh
- Data akun admin tidak berubah
- Jumlah tim tidak berubah

Cara menggunakan:

1. Klik tombol Reset Nama Tim dan Skor ke Default.
2. Tombol berubah warna merah dengan teks konfirmasi "Yakin? Klik sekali lagi untuk reset".
3. Klik tombol sekali lagi dalam waktu lima detik untuk menjalankan reset. Jika tidak diklik lagi dalam lima detik, proses batal secara otomatis.
4. Setelah selesai, muncul pesan konfirmasi jumlah tim yang berhasil direset.

Tindakan ini bersifat permanen dan tidak bisa dibatalkan. Gunakan hanya sebelum kompetisi resmi dimulai.

---

## 11. Logout

Klik tombol Logout di bagian bawah sidebar untuk keluar dari sesi admin. Setelah logout, browser akan diarahkan kembali ke halaman login.

---

## 12. Struktur Round dan Tombol Skor

Berikut rincian tombol skor yang tersedia di setiap round dan station:

**Litoff Mission**

| Station | Tombol Skor |
|---|---|
| Energy Lab | +1, +2, +3, +4 |
| Material Lab | +1, +2, +3, +4 |
| Instrumentation Lab | +1, +2, +3, +4 |

**Find the Missing Piece**

| Station | Tombol Skor |
|---|---|
| Find the Missing Piece | +1, +0 |

**Final Horizon**

| Station | Tombol Skor |
|---|---|
| Miller | +10, -5 |
| Nebula | +20, -10 |
| Singularity | +30, -0 |

Konfigurasi tombol skor disimpan di tabel `score_buttons` di database Supabase dan bisa diubah langsung dari Supabase Dashboard tanpa perlu mengubah kode aplikasi.

---

## 13. Panduan Developer (Setup Lokal dan Deploy)

### Prasyarat

- Node.js versi 18 atau lebih baru
- pnpm
- Akun Supabase dengan project yang sudah dikonfigurasi
- Akun GitHub dan Vercel untuk deployment

### Setup Lokal

1. Clone atau download project ini ke komputer.

2. Buat file `.env.local` di root folder project dengan isi berikut, sesuaikan dengan nilai dari Supabase project kamu:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=isi_anon_key_kamu
SUPABASE_SERVICE_ROLE_KEY=isi_service_role_key_kamu
```

Nilai-nilai ini bisa ditemukan di Supabase Dashboard, masuk ke project, lalu buka Project Settings dan klik API.

3. Install dependency:

```
pnpm install
```

4. Jalankan schema dan seed data ke Supabase dengan cara copy isi file `supabase/schema.sql` lalu paste dan jalankan di SQL Editor Supabase. Ulangi untuk `supabase/seed.sql`.

5. Buat akun admin dengan menjalankan script berikut di terminal:

```
pnpm run seed:admins
```

Perintah ini akan membuat 7 akun admin (admin1 sampai admin7) dengan password EPCSUKSESS. Untuk membuat jumlah yang berbeda, misalnya 10 akun:

```
pnpm run seed:admins -- 10
```

6. Jalankan development server:

```
pnpm run dev
```

7. Buka browser ke `http://localhost:3000`.

### Struktur File Penting

```
src/
  app/
    admin/          - Halaman dan layout khusus admin
    api/            - API route handler (rounds, teams, score-events, reset, dll)
    leaderboard/    - Halaman leaderboard publik
    login/          - Halaman login
    page.tsx        - Root page (redirect otomatis berdasarkan role)
    layout.tsx      - Root layout (wajib ada html dan body)
  components/       - Komponen UI yang dipakai bersama
  hooks/            - Custom React hooks (realtime, rounds, teams, dll)
  lib/              - Supabase client dan utilitas
  types/            - Definisi tipe TypeScript
supabase/
  schema.sql        - Skema database lengkap
  seed.sql          - Data awal (rounds, stations, tombol skor, tim demo)
  fix_litoff_mission_and_dedupe.sql - Script perbaikan data jika diperlukan
scripts/
  seed-users.ts     - Membuat akun admin dan peserta demo
  seed-admins.ts    - Membuat banyak akun admin sekaligus
```

### Deploy ke Vercel

1. Push project ke GitHub:

```
git add .
git commit -m "Initial commit"
git push origin main
```

2. Buka vercel.com, klik Add New lalu Project, pilih repo GitHub kamu.

3. Di halaman konfigurasi project sebelum klik Deploy, scroll ke bagian Environment Variables. Klik area "or paste the .env contents", lalu paste seluruh isi file `.env.local` kamu. Ketiga variabel akan ter-parse otomatis.

4. Pastikan scope ketiga variabel adalah Production dan Preview. Untuk variabel `SUPABASE_SERVICE_ROLE_KEY`, tandai sebagai Sensitive.

5. Klik Deploy dan tunggu hingga selesai.

6. Setelah URL Vercel didapat (misalnya `https://epc-live-score.vercel.app`), buka Supabase Dashboard, masuk ke Authentication lalu URL Configuration, isi Site URL dengan URL Vercel tersebut, dan tambahkan juga URL yang sama ke daftar Redirect URLs. Klik Save.

7. Setiap kali ada perubahan kode dan di-push ke branch main, Vercel akan otomatis melakukan redeploy.

### Menambah atau Mengubah Akun Admin

Untuk menambah akun admin baru setelah project sudah berjalan, jalankan script berikut di lokal (pastikan `.env.local` sudah terisi benar):

```
pnpm run seed:admins -- [jumlah]
```

Ganti `[jumlah]` dengan angka yang diinginkan. Script ini aman dijalankan berulang kali karena akun yang sudah ada tidak akan dibuat ulang atau berubah password-nya.

### Reset Data Sebelum Kompetisi

Sebelum kompetisi resmi dimulai, gunakan tombol Reset Data Latihan di Dashboard Admin untuk membersihkan semua data hasil uji coba. Lihat bagian 10 di atas untuk cara lengkapnya.