# 🚀 Panduan Konfigurasi Produksi - Space Game Hub

Dokumen ini memuat panduan lengkap konfigurasi layanan cloud dan pihak ketiga saat mempublikasikan Space Game Hub ke environment live (`game.rahmatdwi.my.id`).

---

## 1. Firebase Setup

### A. Authorized Domains
Batasi domain yang berhak melakukan autentikasi Firebase:
1. Masuk ke **Firebase Console** > **Authentication** > **Settings** > **Authorized domains**.
2. Hapus domain default yang tidak terpakai.
3. Pastikan hanya domain resmi berikut yang ada di daftar:
   - `game.rahmatdwi.my.id`
   - `rahmat48.github.io`
   - `localhost`

### B. Realtime Database Security Rules
Salin isi berkas `database.rules.json` ke **Firebase Console** > **Realtime Database** > **Rules**, lalu klik **Publish**.

Struktur path basis data per game:
- **Battle MTK**:
  - `users/<uid>/battleMTK/highScore`
  - `users/<uid>/battleMTK/stages/<stage>` (`stars`, `score`, `bestCombo`)
- **Snake Arcade**:
  - `users/<uid>/snakeArcade/highScore`
  - `users/<uid>/snakeArcade/highLength`
  - `users/<uid>/snakeArcade/bestDuration`
- **Orbit Defender**:
  - `users/<uid>/orbitDefender/highScore`
- **Pacman Arcade**:
  - `users/<uid>/pacmanArcade/highScore`
- **Pulse Runner**:
  - `users/<uid>/pulseRunner/highScore`
  - `users/<uid>/pulseRunner/bestDistance`
  - `users/<uid>/pulseRunner/bestCombo`
- **Global**:
  - `users/<uid>/highScore`
  - `users/<uid>/totalPlayTime`
  - `users/<uid>/gamesPlayed`

### C. Firebase App Check
1. Masuk ke **Firebase Console** > **App Check** > **Apps**.
2. Daftarkan web app dengan provider **reCAPTCHA v3**.
3. Daftarkan domain: `game.rahmatdwi.my.id` dan `localhost` di Google reCAPTCHA Admin.
4. Masukkan site key reCAPTCHA ke Firebase Console.
5. Untuk local debugging, tambahkan debug token di **Manage debug tokens**.
6. Aktifkan **Enforce** pada Realtime Database dan Authentication setelah pengujian stabil.

---

## 2. Umami Analytics Setup

1. Buka [cloud.umami.is](https://cloud.umami.is/) dan login ke dashboard.
2. Tambahkan website:
   - **Name**: `Space Game Hub`
   - **Domain**: `game.rahmatdwi.my.id`
3. Salin `data-website-id` dan ganti ID placeholder di `index.html` dan `dashboard.html`.

Event yang terlacak otomatis:
- `user_login`: Komandan login
- `user_signup`: Komandan baru mendaftar
- `user_logout`: Komandan logout
- `game_click`: Card game ditekan
- `game_played`: Game diluncurkan
- `battle_mtk_stage_clear`: Stage game Battle MTK diselesaikan via postMessage
- `pulse_runner_death`: Kapal Pulse Runner hancur via postMessage (payload: `score`, `distance`)

---

## 3. Sentry Error Tracking Setup

1. Buka [sentry.io](https://sentry.io/) dan buat project JavaScript Browser.
2. Salin DSN project Anda.
3. Atur nilai `window.SENTRY_DSN` di `index.html`, `dashboard.html`, dan `games/battle-mtk/index.html`.
4. Dashboard Sentry akan secara otomatis menerima error uncaught dan unhandled promise rejections yang ditandai dengan tag environment `production` atau `development`.

---

## 4. Konfigurasi Domain & DNS

Domain utama: `game.rahmatdwi.my.id`
- DNS Provider: Cloudflare / Registrar DNS
- Record:
  - Tipe: `CNAME`
  - Nama / Host: `game`
  - Target: `rahmat48.github.io`
  - Proxy Status: DNS Only (atau disesuaikan dengan sertifikat GitHub Pages)
- File `CNAME` di root repositori harus selalu berisi: `game.rahmatdwi.my.id`.

---

## 5. Checklist Deploy Tiap Update

Setiap ada penambahan game baru atau perubahan kode:
- [ ] Test di server lokal `http://localhost:8000` (Fase 0 Checklist).
- [ ] Pastikan console browser bebas dari error merah dan aset 404.
- [ ] Validasi format berkas `games.json` jika menambah game baru.
- [ ] Pastikan file `CNAME` tetap ada di root.
- [ ] Commit perubahan lokal: `git add . && git commit -m "feat/fix: ..."`
- [ ] Push ke branch utama: `git push origin main`.
- [ ] Tunggu GitHub Pages Action selesai build & deploy.
- [ ] Verifikasi di live: `https://game.rahmatdwi.my.id`.

---

## 6. Troubleshooting Umum

1. **Error: Permission Denied pada Firebase Database**
   - Pastikan pengguna sudah berhasil login sebelum membaca/menulis data.
   - Periksa apakah skema data yang dikirim sesuai dengan aturan di `database.rules.json`.

2. **Redirect Loop antara index.html dan dashboard.html**
   - Hapus cache browser atau buka mode Penyamaran (Incognito).
   - Pastikan path `index.html` dan `dashboard.html` di browser tidak bentrok dengan ekstensi lokal.

3. **Audio Game Tidak Bersuara**
   - Browser modern memblokir audio autoplay sebelum adanya interaksi klik/sentuh dari pengguna.
   - Pastikan tombol audio/unmute telah diaktifkan di HUD game.
