/**
 * gameOver.js
 * Scene Game Over Pulse Runner (Gravity Tunnel Protocol).
 * Menerima data dari scene gameplay: { score, distance, bestCombo, duration }.
 */

import { makeButton } from "../ui.js";
import { getCurrentUser, loadRunnerProgress } from "../user.js";

export function gameOverScene(k) {
  k.scene("gameOver", async (data = { score: 0, distance: 0, bestCombo: 1, duration: 0 }) => {
    document.body.classList.remove("in-gameplay");

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

    // Title Game Over
    k.add([
      k.text("GAME OVER", { size: 38, font: "monospace" }),
      k.pos(400, 120),
      k.anchor("center"),
      k.color(239, 68, 68)
    ]);

    // Sub-judul
    k.add([
      k.text("SINYAL KAPAL TERPUTUS", { size: 13, font: "monospace" }),
      k.pos(400, 158),
      k.anchor("center"),
      k.color(239, 68, 68)
    ]);

    // Data User Rekor
    const user = await getCurrentUser();
    const uid = user ? user.uid : null;
    const progress = await loadRunnerProgress(uid);

    const isNewRecord = data.score >= progress.highScore && data.score > 0;

    if (isNewRecord) {
      k.add([
        k.text("★ REKOR BARU TERCIPTA! ★", { size: 16, font: "monospace" }),
        k.pos(400, 192),
        k.anchor("center"),
        k.color(245, 158, 11)
      ]);
    }

    // Detail Hasil Permainan
    k.add([
      k.text(`SKOR AKHIR : ${data.score} PTS`, { size: 22, font: "monospace" }),
      k.pos(400, 230),
      k.anchor("center"),
      k.color(0, 212, 255)
    ]);

    k.add([
      k.text(`JARAK : ${data.distance} M`, { size: 18, font: "monospace" }),
      k.pos(400, 268),
      k.anchor("center"),
      k.color(245, 158, 11)
    ]);

    k.add([
      k.text(`COMBO TERBAIK : x${data.bestCombo}`, { size: 18, font: "monospace" }),
      k.pos(400, 304),
      k.anchor("center"),
      k.color(224, 224, 255)
    ]);

    k.add([
      k.text(`DURASI : ${data.duration} DETIK`, { size: 18, font: "monospace" }),
      k.pos(400, 340),
      k.anchor("center"),
      k.color(224, 224, 255)
    ]);

    k.add([
      k.text(`REKOR TERTINGGI : ${progress.highScore} PTS`, { size: 18, font: "monospace" }),
      k.pos(400, 376),
      k.anchor("center"),
      k.color(245, 158, 11)
    ]);

    // Tombol Navigasi
    makeButton(k, "COBA LAGI", k.vec2(400, 440), () => {
      k.go("gameplay");
    }, 220, 46);

    makeButton(k, "MENU", k.vec2(400, 500), () => {
      k.go("menu");
    }, 220, 46);

    makeButton(k, "EXIT", k.vec2(400, 560), () => {
      window.location.href = "../../dashboard.html";
    }, 220, 46);
  });
}
