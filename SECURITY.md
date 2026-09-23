## 🔒 Kebijakan Keamanan - Space Game Hub

Dokumen ini menjelaskan arsitektur pengamanan yang diterapkan pada proyek Space Game Hub untuk melindungi integritas skor, identitas pengguna, dan layanan backend.

---

### 1. Aturan Keamanan Firebase Realtime Database
Aturan keamanan ketat (`database.rules.json`) diterapkan pada path `/users/$uid`:
- **Read & Write Restriction**: Operasi baca dan tulis dibatasi secara ketat hanya untuk pemilik akun yang terautentikasi (`auth != null && auth.uid == $uid`).
- **Data Validation**:
  - Kolom wajib: `name`, `avatar`, `email`.
  - Panjang nama dibatasi 2 hingga 30 karakter.
  - Avatar dibatasi maksimal 4 karakter string emoji.
  - Nilai skor (`highScore`) dibatasi dalam rentang numerik valid (0 - 1.000.000) untuk mencegah manipulasi arbitrary score injection.
  - Validasi stage game Battle MTK dicocokkan dengan pola Regex stage valid (`^([1-9]|10)$`).

---

### 2. Firebase App Check
- Digunakan untuk memvalidasi bahwa setiap permintaan jaringan berasal dari aplikasi web resmi dan bukan dari skrip otomatis / bot / API client liar.
- Provider: **reCAPTCHA v3** untuk browser produksi dan **Debug Provider** untuk pengembangan lokal di `localhost`.
- Penegakan (*Enforcement*): Berlaku pada Firebase Authentication dan Realtime Database.

---

### 3. Authorized Domains
Firebase Authentication hanya melayani permintaan yang berasal dari domain terdaftar:
- `game.rahmatdwi.my.id` (Domain Produksi)
- `rahmat48.github.io` (Mirror GitHub Pages)
- `localhost` (Pengembangan Lokal)

---

### 4. API Key Restrictions (Google Cloud Console)
Meskipun Firebase API Key bersifat publik pada web client, kunci diamankan melalui konfigurasi GCP:
- **Application Restrictions**: Dibatasi hanya untuk HTTP referrers:
  - `https://game.rahmatdwi.my.id/*`
  - `https://rahmat48.github.io/*`
  - `http://localhost:8000/*`
- **API Restrictions**: Akses dibatasi secara spesifik hanya untuk:
  - Identity Toolkit API (Firebase Authentication)
  - Firebase Realtime Database API
  - Token Service API

---

### 5. Pelaporan Kerentanan Keamanan (Vulnerability Disclosure)
Jika Anda menemukan celah keamanan atau kerentanan pada platform ini:
1. Jangan membuat issue publik di repositori GitHub.
2. Laporkan secara privat dan langsung ke: **[rahmatdw48@gmail.com](mailto:rahmatdw48@gmail.com)**.
3. Sertakan langkah-langkah reproduksi, deskripsi dampak, dan bukti konsep (*proof of concept*).
4. Kami akan meninjau dan merilis perbaikan secepatnya.

