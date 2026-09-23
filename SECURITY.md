## 🔒 Keamanan Firebase & Panduan Clone Repositori

Jika Anda melakukan clone pada repositori ini untuk keperluan pengembangan sendiri, Anda disarankan untuk menggunakan konfigurasi Firebase milik Anda sendiri.

Project ini telah dilindungi menggunakan:
1. **Firebase Security Rules** (`database.rules.json`):
   - Hanya pengguna terautentikasi (`auth != null`) yang dapat membaca data profil & leaderboard.
   - Setiap pengguna **HANYA BISA MENULIS/MENGUBAH** data di bawah UID miliknya sendiri (`auth.uid === $uid`).
   - Tidak ada pengguna lain yang dapat mengedit, menghapus, atau merusak data pengguna lain.
2. **Authorized Domains (Domain Resmi)**:
   - Akses Firebase Auth dibatasi hanya untuk:
     - `localhost`
     - Domain GitHub Pages Anda (misal: `rahmat48.github.io`)
     - Domain custom jika ada.
