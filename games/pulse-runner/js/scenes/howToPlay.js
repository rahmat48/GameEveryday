/**
 * howToPlay.js
 * Scene panduan kontrol Pulse Runner.
 */

import { makeButton, getGameThemeColors } from "../ui.js";
import { playSfx } from "../audio.js";

export function howToPlayScene(k) {
  k.scene("howToPlay", () => {
    document.body.classList.remove("in-gameplay");
    const theme = getGameThemeColors(k);

    k.add([
      k.text("CARA BERMAIN", { size: 32, font: "monospace" }),
      k.pos(400, 80),
      k.anchor("center"),
      k.color(theme.primary)
    ]);

    const lines = [
      ["KETIK / TAP", "SATU TOMBOL: balik gravitasi kapal"],
      ["SPASI / ↑ / CLICK", "Flip di desktop, tap layar di mobile"],
      ["DATA ORB (bulat)", "+50 PTS x COMBO. Jaga ritme, combo x8!"],
      ["FUEL CELL (kotak)", "+18 FUEL. Bahan bakar terus berkurang!"],
      ["BALOK & RANJAP", "Sentuh = hancur. Jaga jarak, near-miss = bonus"],
      ["LASER GATE", "Berkedip dulu (merah) → baru menembak. Tunggu aman"],
      ["POWER-UP", "⚡ Phase Shift | 🧲 Orb Magnet | 🐌 Slow-Mo"],
      ["P / ESC", "Pause permainan"]
    ];

    let y = 145;
    lines.forEach(([key, desc]) => {
      k.add([
        k.text(key, { size: 14, font: "monospace" }),
        k.pos(120, y),
        k.color(theme.cyan)
      ]);
      k.add([
        k.text(desc, { size: 14, font: "monospace" }),
        k.pos(320, y),
        k.color(224, 224, 255)
      ]);
      y += 42;
    });

    makeButton(k, "KEMBALI", k.vec2(400, 530), () => {
      playSfx(k, "click");
      k.go("menu");
    }, 220, 46);
  });
}
