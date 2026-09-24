# Checklist Testing Manual - Pacman Arcade

| Item | Status | Catatan |
|---|---|---|
| Navigasi Pacman 4 arah (Arrow & WASD) responsif | OK | Cornering pre-turn buffer membuat belokan mulus |
| Grid & collision tembok akurat di seluruh Stage | OK | Tidak menembus tembok, lorong simetris |
| Warp Tunnel di sisi kiri dan kanan | OK | Teleportasi instan dari col 0 ke col 27 dan sebaliknya |
| Memakan Data Pellet (+10 PTS) & SFX Waka | OK | Audio berganti nada, kuota dot berkurang |
| Memakan Energizer (+50 PTS) & Hantu Biru | OK | Durasi frightened aktif, musik sirine darurat |
| 4 Sikap AI Hantu (Blinky, Pinky, Inky, Clyde) | OK | Chasing & scatter mode berputar sesuai algoritma |
| Menangkap hantu biru (200, 400, 800, 1600 PTS) | OK | Angka poin melayang & mata hantu balik ke rumah |
| Tabrakan hantu saat normal mengurangi nyawa | OK | Animasi death, screen shake, dan reset posisi |
| Buah Kosmik (Cherry, Berry, Core, Crystal) muncul | OK | Muncul saat mencapai ambang dot & beri bonus poin |
| Progresi Multi-Stage (Stage 1 s.d Stage 4) | OK | Desain labirin, palet warna, dan kecepatan berganti |
| Transisi Game Over saat 3 nyawa habis | OK | Rekap skor, stage, dot, durasi terhitung akurat |
| Sinkronisasi skor ke Firebase (`pacmanArcade`) | OK | `highScore`, `bestStage`, `bestDuration` tersimpan |
| Fallback localStorage untuk tamu tanpa login | OK | `pacmanArcade_guest` tersimpan lokal |
| Mute/Unmute audio persisten | OK | LocalStorage `pacmanArcade_muted` sinkron |
| Dukungan kontrol mobile touch / Virtual D-Pad | OK | Tombol ▲ ▼ ◀ ▶ berfungsi mulus di layar sentuh |
| Tema CRT Green, Purple, dan Light konsisten | OK | Class tema sinkron dengan hub |
