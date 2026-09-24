# Checklist Testing Manual - Orbit Defender

| Item | Status | Catatan |
|---|---|---|
| Bidikan Turret 360° ikuti mouse & sentuhan | OK | Sudut `atan2` lancar tanpa jitter |
| Tembakan peluru laser normal (cooldown 0.18s) | OK | Tidak tembak beruntun saat klik spam |
| Tabrakan peluru vs musuh akurat | OK | Damage & pengurangan HP musuh berfungsi |
| Scout Drone musnah dalam 1 tembakan | OK | Menghasilkan +10 poin |
| Asteroid Shard pecah jadi 2 pecahan mini saat musnah | OK | Menghasilkan mini-shards + spawn pecahan |
| Heavy Bomber tahan 3 tembakan & beri damage besar | OK | HP musuh berkurang bertahap |
| Tabrakan musuh ke inti stasiun mengurangi HP | OK | Screen shake, damage flash, dan HP bar turun |
| Senjata Super EMP menyapu seluruh musuh di layar | OK | Tombol B / Tombol BOM mengeksekusi shockwave |
| Pergantian Wave otomatis saat kuota kill terpenuhi | OK | Wave naik & bonus +1 EMP bomb diberikan |
| HP Inti 0 -> transisi ke scene Game Over | OK | Score, wave, kills, dan durasi terhitung akurat |
| Sinkronisasi skor ke Firebase (`orbitDefender`) | OK | `highScore`, `bestWave`, `bestDuration` tersimpan |
| Fallback localStorage untuk tamu tanpa login | OK | `orbitDefender_guest` tersimpan lokal |
| Mute/Unmute audio persisten | OK | LocalStorage `orbitDefender_muted` sinkron |
| Dukungan kontrol mobile touch overlay | OK | Tombol BOM dan TEMBAK tampil di layar sentuh |
| Tema CRT Green, Purple, dan Light konsisten | OK | Class tema sinkron dengan hub |
