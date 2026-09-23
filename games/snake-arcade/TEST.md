# 🧪 Rencana Pengujian Snake Arcade (Data Worm)

Dokumen ini memuat checklist pengujian fungsionalitas game Snake Arcade untuk lingkungan desktop dan mobile.

---

## 🎮 Checklist Pengujian Fungsional

### 1. Scene Preload & Menu
- [x] Canvas Kaplay ter-mount di `#game-container` tanpa error.
- [x] Preload text "LOADING DATA WORM PROTOCOL..." tampil selama 1.2 detik.
- [x] Transisi otomatis ke scene `menu`.
- [x] Nama dan avatar Komandan (`🚀 Rahmat`) termuat dari profil.
- [x] Rekor skor & panjang worm termuat dari Firebase / LocalStorage.
- [x] Tombol `PLAY` meluncurkan scene `gameplay`.
- [x] Tombol `HOW TO PLAY` menampilkan overlay instruksi dan kontrol.
- [x] Tombol `HIGH SCORE` menampilkan popup rincian rekor.
- [x] Tombol `EXIT` mengarahkan kembali ke `dashboard.html`.

### 2. Gameplay & Kontrol (Desktop & Mobile)
- [x] Grid 20x20 sel (480x480) dengan pembatas neon hijau dan grid tipis.
- [x] Ular awal terdiri dari 3 segmen dengan kepala berkedip.
- [x] Kontrol Desktop (WASD & Arrow Keys) merespons perubahan arah secara instan.
- [x] Cegah gerak berlawanan arah 180 derajat (contoh: kiri saat bergerak ke kanan).
- [x] Makanan byte ungu spawn di koordinat acak di luar tubuh ular.
- [x] Memakan byte menambah skor (+10), panjang worm (+1), dan memicu suara `eat`.
- [x] Kecepatan meningkat bertahap setiap 5 byte dimakan.
- [x] Wrap-around field: ular yang menembus tepi batas muncul di sisi berlawanan.
- [x] Tabrak tubuh sendiri memicu Game Over (getar layar + suara `gameover`).

### 3. Sistem Power-Up
- [x] Peluang spawn power-up acak (~12%) saat byte dimakan.
- [x] **Slow-Mo (Biru)**: Mengurangi kecepatan hingga 50% selama 3 detik.
- [x] **Ghost Mode (Emas)**: Tubuh transparan dan kebal tabrakan diri sendiri selama 5 detik.
- [x] Indikator durasi aktif power-up tampil di HUD.

### 4. Controller Mobile & Gesture
- [x] D-Pad virtual (▲, ▼, ◀, ▶) otomatis muncul pada viewport mobile (lebar <= 768px).
- [x] Sentuhan tombol D-Pad memicu haptic feedback (`navigator.vibrate`).
- [x] Gesture usap layar (*Swipe*) di atas canvas mengendalikan arah worm.

### 5. Game Over & Persistence
- [x] Transisi mulus ke scene `gameOver`.
- [x] Skor akhir, panjang byte, durasi survive, dan rekor tertinggi tampil akurat.
- [x] Penanda "★ REKOR BARU TERCIPTA! ★" muncul jika melampaui skor sebelumnya.
- [x] Penyimpanan skor tersinkronisasi ke Firebase path `/users/<uid>/snakeArcade`.
- [x] Tombol `RETRY` me-reset sesi permainan baru.
- [x] Tombol `MENU` kembali ke menu utama.
- [x] Tombol `EXIT HUB` kembali ke dashboard.
