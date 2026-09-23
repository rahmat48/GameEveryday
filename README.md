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
- 👾 **Game Hari Ini: Battle MTK**:
  - Game duel matematika retro dengan 10 Stage, pertarungan monster boss, combo multiplier, dan efek partikel *critical hit*.

---

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3 Variables, Vanilla JavaScript (ESM).
- **Game Engine**: [Kaplay.js](https://kaplayjs.com/) v3001.0.19 (via CDN).
- **Backend & Database**: [Firebase](https://firebase.google.com/) (Authentication & Realtime Database).
- **Styling**: Google Fonts (`Press Start 2P`, `VT323`) + Custom CRT Scanline Canvas FX.

---

## 📂 Struktur Repositori

```text
GAME_EVERYDAY/
├── index.html              # Halaman Depan / Gerbang Login & Live Preview
├── hub.html                # Mission Control (Katalog Game & Profil Komandan)
├── app.js                  # Logika Utama, Firebase SDK, Tema & Animasi
├── style.css               # Desain Antarmuka CRT & Variasi Tema
├── games.json              # Basis Data Katalog Game Harian
└── games/
    └── battle-mtk/         # Game Edukasi Duel Matematika
        ├── index.html
        ├── css/style.css
        └── js/
            ├── game.js
            ├── questions.js
            ├── ui.js
            ├── user.js
            ├── audio.js
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
