/**
 * howToPlay.js
 * Scene Manual Controller & Aturan Main Snake Arcade (Data Worm).
 */

import { makeButton } from "../ui.js";

export function howToPlayScene(k) {
  k.scene("howToPlay", () => {
    document.body.classList.remove("in-gameplay");
    const keypadToggleBtn = document.getElementById("btn-toggle-dpad");
    if (keypadToggleBtn) keypadToggleBtn.style.display = "none";
    // Starfield Background
    for (let i = 0; i < 30; i++) {
      k.add([
        k.rect(2, 2),
        k.pos(k.rand(0, 800), k.rand(0, 600)),
        k.color(255, 255, 255),
        k.opacity(k.rand(0.15, 0.4)),
        k.z(-10)
      ]);
    }

    // Title
    k.add([
      k.text("CARA MAIN", { size: 24, font: "monospace" }),
      k.pos(400, 45),
      k.anchor("center"),
      k.color(34, 197, 94)
    ]);

    // Box Kolom Kiri - KONTROL
    k.add([
      k.rect(340, 310, { radius: 6 }),
      k.pos(220, 220),
      k.anchor("center"),
      k.color(10, 10, 26),
      k.outline(2, k.rgb(34, 197, 94)),
      k.opacity(0.85)
    ]);

    k.add([
      k.text("KONTROL", { size: 16, font: "monospace" }),
      k.pos(220, 85),
      k.anchor("center"),
      k.color(34, 197, 94)
    ]);

    const controlLines = [
      "W / ↑   : Gerak ke atas",
      "S / ↓   : Gerak ke bawah",
      "A / ←   : Gerak ke kiri",
      "D / →   : Gerak ke kanan",
      "SPACE   : Pause / Resume",
      "ESC     : Pause",
      "SWIPE   : (di HP) geser layar",
      "D-PAD   : (di HP) tombol arah"
    ];

    controlLines.forEach((txt, idx) => {
      k.add([
        k.text(txt, { size: 14, font: "monospace" }),
        k.pos(70, 115 + (idx * 28)),
        k.color(255, 255, 255)
      ]);
    });

    // Box Kolom Kanan - ATURAN
    k.add([
      k.rect(340, 310, { radius: 6 }),
      k.pos(580, 220),
      k.anchor("center"),
      k.color(10, 10, 26),
      k.outline(2, k.rgb(168, 85, 247)),
      k.opacity(0.85)
    ]);

    k.add([
      k.text("ATURAN", { size: 16, font: "monospace" }),
      k.pos(580, 85),
      k.anchor("center"),
      k.color(168, 85, 247)
    ]);

    const ruleLines = [
      "- Makan byte ungu untuk skor",
      "- Tiap 5 makan, speed naik",
      "- Jangan tabrak badan sendiri",
      "- Tembus batas -> wrap around",
      "- Power-up biru: slow-mo 3s",
      "- Power-up emas: ghost 5s",
      "- Ghost = tembus badan sendiri"
    ];

    ruleLines.forEach((txt, idx) => {
      k.add([
        k.text(txt, { size: 14, font: "monospace" }),
        k.pos(430, 120 + (idx * 30)),
        k.color(255, 255, 255)
      ]);
    });

    // Ilustrasi Visual di Bagian Bawah
    // 1. Ular
    k.add([
      k.rect(16, 16, { radius: 3 }),
      k.pos(120, 420),
      k.color(74, 222, 128)
    ]);
    k.add([
      k.rect(16, 16, { radius: 3 }),
      k.pos(140, 420),
      k.color(74, 222, 128)
    ]);
    k.add([
      k.rect(16, 16, { radius: 3 }),
      k.pos(160, 420),
      k.color(34, 197, 94)
    ]);
    k.add([
      k.text("WORM", { size: 12, font: "monospace" }),
      k.pos(145, 450),
      k.anchor("center"),
      k.color(34, 197, 94)
    ]);

    // 2. Makanan Ungu
    k.add([
      k.rect(16, 16, { radius: 3 }),
      k.pos(330, 420),
      k.color(217, 70, 239)
    ]);
    k.add([
      k.text("BYTE UNGU", { size: 12, font: "monospace" }),
      k.pos(338, 450),
      k.anchor("center"),
      k.color(217, 70, 239)
    ]);

    // 3. Power-up Slowmo Biru
    k.add([
      k.rect(16, 16, { radius: 5 }),
      k.pos(500, 420),
      k.color(56, 189, 248)
    ]);
    k.add([
      k.text("SLOW-MO", { size: 12, font: "monospace" }),
      k.pos(508, 450),
      k.anchor("center"),
      k.color(56, 189, 248)
    ]);

    // 4. Power-up Ghost Emas
    k.add([
      k.rect(16, 16, { radius: 5 }),
      k.pos(660, 420),
      k.color(250, 204, 21)
    ]);
    k.add([
      k.text("GHOST", { size: 12, font: "monospace" }),
      k.pos(668, 450),
      k.anchor("center"),
      k.color(250, 204, 21)
    ]);

    // Tombol KEMBALI
    makeButton(k, "KEMBALI", k.vec2(400, 530), () => {
      k.go("menu");
    }, 200, 44);
  });
}
