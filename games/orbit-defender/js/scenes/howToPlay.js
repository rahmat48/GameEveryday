/**
 * howToPlay.js
 * Scene Petunjuk & Cara Bermain Orbit Defender.
 */

import { makeButton, retroPanel } from "../ui.js";

export function howToPlayScene(k) {
  k.scene("howToPlay", () => {
    // Starfield Background
    for (let i = 0; i < 35; i++) {
      k.add([
        k.rect(2, 2),
        k.pos(k.rand(0, 800), k.rand(0, 600)),
        k.color(255, 255, 255),
        k.opacity(k.rand(0.15, 0.5)),
        k.z(-10)
      ]);
    }

    // Panel Petunjuk
    retroPanel(k, k.vec2(400, 270), 720, 480, "PANDUAN SISTEM PERTAHANAN");

    // Konten Teks Panduan
    const lines = [
      { text: "1. KONTROL TURRET 360°", color: k.rgb(34, 197, 94), size: 16 },
      { text: "   • Gerakkan MOUSE / SENTUH layar untuk membidik musuh.", color: k.rgb(224, 224, 255), size: 14 },
      { text: "   • KLIK KIRI / SPASI / Tombol Merah untuk menembak laser.", color: k.rgb(224, 224, 255), size: 14 },
      { text: "   • Tekan 'B' atau Tombol BOM Kuning untuk senjata EMP!", color: k.rgb(245, 158, 11), size: 14 },
      { text: "", color: k.rgb(0, 0, 0), size: 8 },
      { text: "2. IDENTIFIKASI MUSUH", color: k.rgb(0, 212, 255), size: 16 },
      { text: "   • SCOUT DRONE (Merah): Cepat, 1 HP (+10 Pts).", color: k.rgb(239, 68, 68), size: 14 },
      { text: "   • ASTEROID SHARD (Ungu): 2 HP, pecah jadi 2 (+20 Pts).", color: k.rgb(168, 85, 247), size: 14 },
      { text: "   • HEAVY BOMBER (Kuning): Armor tebal 3 HP, ledakan besar (+40 Pts).", color: k.rgb(245, 158, 11), size: 14 },
      { text: "", color: k.rgb(0, 0, 0), size: 8 },
      { text: "3. TARGET UTAMA & EVALUASI", color: k.rgb(34, 197, 94), size: 16 },
      { text: "   • Lindungi Inti Stasiun Luar Angkasa (HP: 100).", color: k.rgb(224, 224, 255), size: 14 },
      { text: "   • Kecepatan & gelombang musuh meningkat seiring waktu.", color: k.rgb(224, 224, 255), size: 14 },
      { text: "   • Dapatkan cadangan EMP setiap pergantian Wave!", color: k.rgb(245, 158, 11), size: 14 }
    ];

    let startY = 90;
    lines.forEach((item) => {
      if (item.text) {
        k.add([
          k.text(item.text, { size: item.size, font: "monospace" }),
          k.pos(80, startY),
          k.color(item.color),
          k.z(90)
        ]);
      }
      startY += item.size + 8;
    });

    // Tombol Kembali
    makeButton(k, "KEMBALI KE MENU", k.vec2(400, 540), () => {
      k.go("menu");
    }, 240, 44);
  });
}
