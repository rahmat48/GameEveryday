# Checklist Testing Manual - Battle MTK

| Item | Status | Catatan |
|---|---|---|
| Loop generateQuestion 1000x tidak ada jawaban salah | OK | Diuji 1000 iterasi valid |
| Loop shuffleChoices 1000x selalu 4 unik | OK | Diuji 1000 iterasi unik |
| Klik jawaban cepat 10x tidak double damage | OK | Guard flag `isAnswering` aktif |
| Timer habis dianggap salah | OK | Otomatis kurangi HP player |
| HP monster 0 -> victory + skor tersimpan | OK | Transisi ke scene victory |
| HP player 0 -> gameOver + skor tersimpan | OK | Transisi ke scene gameOver |
| Refresh di tengah game tidak error | OK | State aman |
| Console tidak ada warning/error | OK | Bersih dari uncaught error |
| Network tab semua aset 200 | OK | Kaplay ESM & Fonts termuat |
| Firebase users/<uid>/battleMTK/highScore terupdate | OK | update() jalan dengan fallback local |
| Firebase users/<uid>/highScore (global) terupdate | OK | update() global aktif |
| Firebase gamesPlayed dan totalPlayTime naik | OK | increment() berjalan |
| Bintang stage tersimpan dan termuat di stageSelect | OK | Render bintang di grid stage |
| Tema hijau/ungu/light konsisten dengan hub | OK | CSS variables & theme class sinkron |
