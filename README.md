# 🚀 Space Game Hub (Game Everyday)

> **Satu Game Web Baru Bertema Retro Sci-Fi Setiap Hari!**  
> Dibuat dengan cinta, piksel, dan semangat eksplorasi antariksa.

🌐 **Akses Website & Mainkan Sekarang:**  
👉 **[https://game.rahmatdwi.my.id](https://game.rahmatdwi.my.id)**  
*(Mirror GitHub Pages: [https://rahmat48.github.io/GameEveryday](https://rahmat48.github.io/GameEveryday))*

---

## 🌌 Tentang Proyek

**Space Game Hub** adalah platform agregator game web ringan berbasis browser (*HTML5 Canvas, Kaplay Engine, dan CSS CRT Retro*) yang dirancang untuk merilis **1 game baru setiap hari**. 

Setiap pengguna bertindak sebagai **Komandan Luar Angkasa** yang memiliki profil unik, avatar astronot/alien, catatan jam terbang (*playtime*), serta papan peringkat skor global (*Leaderboard*) yang terintegrasi secara *realtime*.

---

## ✨ Fitur Utama

- 🎮 **Katalog Game Harian Dinamis**: Menggunakan file katalog `games.json` yang terisolasi dan mudah diperluas tanpa merusak arsitektur dasar.
- 🎨 **3 Pilihan Tema Sci-Fi**:
  - 🟢 **Cyber Matrix** (Retro Green CRT Terminal)
  - 🟣 **Midnight Purple** (Cyberpunk Neon Magenta)
  - 🔵 **Supernova Light** (Mode Terang Bersih & Kontras Tinggi)
- 🔒 **Sistem Autentikasi Komandan**:
  - Login & Pendaftaran Akun via Firebase Auth.
  - Pemilihan Nama Komandan & Avatar Kustom (`🚀`, `👾`, `🤖`, `🛸`).
  - Fitur pemulihan kata sandi (*Forgot Password*).
  - Proteksi rute antar-halaman (*Landing vs Mission Control*).
- 🏆 **Leaderboard & Realtime Flight Hours**:
  - Papan peringkat skor tertinggi per game.
  - Pelacak jam terbang (*flight hours*) yang bertambah secara otomatis setiap menyelesaikan permainan.

---

## 🕹️ Daftar Game Aktif

1. **Battle MTK**:
   - Game duel matematika retro dengan 10 Stage, pertarungan monster boss, combo multiplier, dan efek partikel *critical hit*.
2. **Snake Arcade (Data Worm Protocol)**:
   - Game arkade klasik kontrol cacing data luar angkasa dengan sistem power-up (Slow-Mo & Ghost Mode), akselerasi dinamis, dan multi-kontroler (WASD / Arrow Keys / Virtual D-Pad / Touch Swipe).
3. **Orbit Defender (360° Turret Defense Protocol)**:
   - Game shooter arkade retro pertahanan stasiun orbit antariksa dengan rotasi turret 360°, 3 tipe ancaman musuh (Drone, Asteroid, Bomber), wave progression dinamis, dan senjata super EMP pulsa kejut.

---

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3 Variables, Vanilla JavaScript (ESM).
- **Game Engine**: [Kaplay.js](https://kaplayjs.com/) v3001.0.19 (via CDN).
- **Backend & Database**: [Firebase](https://firebase.google.com/) (Authentication & Realtime Database).
- **Analytics**: [Umami Cloud](https://cloud.umami.is/) (Privacy-friendly analytics).
- **Error Tracking**: [Sentry](https://sentry.io/) (Browser error tracking & monitoring).
- **Styling**: Google Fonts (`Press Start 2P`, `VT323`) + Custom CRT Scanline Canvas FX.

---

## 💻 Menjalankan di Lokal

Untuk menjalankan project di komputer lokal:

```bash
# Clone repositori
git clone https://github.com/rahmat48/GameEveryday.git
cd GameEveryday

# Jalankan server lokal (pilih salah satu)
python -m http.server 8000
# atau
npx serve -p 8000
# atau
php -S localhost:8000
```

Buka browser dan akses: `http://localhost:8000`

---

## 🚀 Panduan Deploy

Website dideploy menggunakan **GitHub Pages**:
1. Pastikan seluruh perubahan di-commit ke branch `main`.
2. Di GitHub Repository, masuk ke **Settings** > **Pages**.
3. Atur Source ke `Deploy from a branch` dengan branch `main` folder `/ (root)`.
4. Custom Domain diatur ke `game.rahmatdwi.my.id` dengan file `CNAME`.
5. Pastikan Enforce HTTPS diaktifkan.

---

## 📂 Struktur Repositori

```text
GAME_EVERYDAY/
├── index.html              # Halaman Depan / Gerbang Login & Live Preview
├── dashboard.html          # Mission Control (Katalog Game & Profil Komandan)
├── hub.html                # Auto-redirect aman ke dashboard
├── 404.html                # Halaman 404 Retro Sci-Fi
├── firebase-config.js      # Konfigurasi Terpusat Firebase
├── app.js                  # Logika Utama, Firebase SDK, Tema & Animasi
├── style.css               # Desain Antarmuka CRT & Variasi Tema
├── games.json              # Basis Data Katalog Game Harian
├── database.rules.json     # Aturan Validasi Keamanan Firebase Realtime DB
├── assets/                 # Folder Aset Statis Global (img, audio)
└── games/
    ├── battle-mtk/         # Game Edukasi Duel Matematika
    │   ├── index.html
    │   ├── assets/
    │   ├── css/style.css
    │   └── js/
    └── snake-arcade/       # Game Retro Data Worm (Snake)
        ├── index.html
        ├── assets/
        ├── css/style.css
        └── js/
            ├── audio.js
            ├── game.js
            ├── input.js
            ├── mobileController.js
            ├── swipe.js
            ├── ui.js
            ├── user.js
            └── scenes/
```

---

## 💡 Punya Ide Game Keren?

Saya selalu terbuka untuk kolaborasi dan tantangan membuat game baru setiap hari!  
Jika kamu punya ide game seru, konsep matematika unik, atau mekanisme arcade klasik yang ingin diwujudkan:

📬 **Kirimkan ide game kamu ke:** [rahmatdw48@gmail.com](mailto:rahmatdw48@gmail.com)

---

## 📜 Lisensi & Kontribusi

Dibuat untuk tujuan edukasi dan hiburan harian. Silakan lakukan *fork* dan eksplorasi kode ini! 🚀
