# 🧪 Rencana Pengujian Pulse Runner (Gravity Tunnel Protocol)

Dokumen ini memuat checklist pengujian fungsionalitas game Pulse Runner untuk lingkungan desktop dan mobile.

---

## 🎮 Checklist Pengujian Fungsional

### 1. Scene Preload & Menu
- [ ] Canvas Kaplay ter-mount di `#game-container` tanpa error.
- [ ] Preload text "LOADING GRAVITY TUNNEL PROTOCOL..." tampil selama 1.2 detik.
- [ ] Transisi otomatis ke scene `menu`.
- [ ] Nama dan avatar Komandan (`🚀 Rahmat`) termuat dari profil.
- [ ] Tombol `PLAY` meluncurkan scene `gameplay`.
- [ ] Tombol `HOW TO PLAY` menampilkan instruksi dan kontrol.
- [ ] Tombol `EXIT` mengarahkan kembali ke `dashboard.html`.

### 2. Gameplay & Kontrol (Desktop & Mobile)
- [ ] Kontrol Desktop: `Space` / `↑` / klik mouse memicu flip gravitasi.
- [ ] Kontrol Mobile: tap layar canvas memicu flip gravitasi.
- [ ] Tombol `FLIP` di bawah layar tampil otomatis pada perangkat sentuh / viewport kecil.
- [ ] Flip gravitasi simetris 2 arah (lantai ↔ plafon) dengan animasi lintasan yang halus.
- [ ] Cooldown flip mencegah spam tombol (input beruntun diabaikan dalam jendela cooldown).
- [ ] Pause dengan `P` / `ESC` dan lanjutkan berjalan normal.

### 3. Sistem Skor, Fuel & Combo
- [ ] Fuel berkurang terus (drain) selama gameplay berjalan.
- [ ] Mengambil `fuel cell` mengembalikan +18 fuel dan memicu suara `fuel`.
- [ ] Mengambil orb menambah skor dengan multiplier combo.
- [ ] Combo naik bertahap x1 sampai x8, lalu reset bila lewat > 1.5 detik tanpa orb.
- [ ] Near-miss (hampir kena rintangan) memberi bonus skor + teks melayang + suara `nearmiss`.
- [ ] Fuel mencapai 0 memicu Game Over dengan efek suara `gameover`.
- [ ] Tabrakan hazard (balok / laser) memicu Game Over + screen shake + flash.

### 4. Hazard & Power-Up
- [ ] Laser gate melewati fase `telegraph` (kedip peringatan) → `aktif` (mematikan) → `aman`.
- [ ] **PHASE (`>>`)**: kapal tembus rintangan untuk durasi sementara, indikator aktif tampil di HUD.
- [ ] **MAGNET (`@`)**: orb tertarik ke arah kapal, indikator durasi tampil.
- [ ] **SLOWMO (`~`)**: guliran tunnel melambat sementara, indikator durasi tampil.

### 5. Game Over & Persistence
- [ ] Transisi mulus ke scene `gameOver` membawa data `{ score, distance, bestCombo, duration }`.
- [ ] Skor akhir, jarak (M), combo terbaik (xN), durasi (detik), dan rekor tertinggi tampil akurat.
- [ ] Penanda "★ REKOR BARU TERCIPTA! ★" muncul jika skor melampaui rekor sebelumnya.
- [ ] Penyimpanan skor tersinkronisasi ke Firebase path `/users/<uid>/pulseRunner`.
- [ ] Fallback localStorage untuk tamu: key `pulseRunner_guest` menyimpan highScore / bestDistance / bestCombo.
- [ ] Leaderboard dashboard menampilkan skor `pulseRunner` dengan benar.
- [ ] Tombol `COBA LAGI` me-reset sesi permainan baru.
- [ ] Tombol `MENU` kembali ke menu utama.
- [ ] Tombol `EXIT` kembali ke dashboard.

### 6. Tema, Audio & Kualitas Teknis
- [ ] 3 tema warna hub (green / purple / light) konsisten di seluruh scene.
- [ ] Overlay CRT scanline tampil di atas kanvas tanpa menghalangi input.
- [ ] Tombol `🔊 SUARA` / `🔇 MUTE` di HUD berfungsi persisten (`pulseRunner_muted`).
- [ ] Bebas error console dan tidak ada aset 404 (9 file audio + `thumb.png`).
