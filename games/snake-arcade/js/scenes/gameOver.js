/**
 * gameOver.js
 * Scene Game Over Snake Arcade (Data Worm).
 */

import { makeButton } from "../ui.js";
import { getCurrentUser, loadSnakeProgress } from "../user.js";

export function gameOverScene(k) {
  k.scene("gameOver", async (data = { score: 0, length: 3, duration: 0 }) => {
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
      k.pos(400, 130),
      k.anchor("center"),
      k.color(239, 68, 68)
    ]);

    // Data User Rekor
    const user = await getCurrentUser();
    const uid = user ? user.uid : null;
    const progress = await loadSnakeProgress(uid);

    const isNewRecord = data.score >= progress.highScore && data.score > 0;

    if (isNewRecord) {
      k.add([
        k.text("★ REKOR BARU TERCIPTA! ★", { size: 16, font: "monospace" }),
        k.pos(400, 185),
        k.anchor("center"),
        k.color(245, 158, 11)
      ]);
    }

    // Detail Hasil Permainan
    k.add([
      k.text(`SKOR AKHIR : ${data.score} PTS`, { size: 22, font: "monospace" }),
      k.pos(400, 235),
      k.anchor("center"),
      k.color(34, 197, 94)
    ]);

    k.add([
      k.text(`PANJANG WORM : ${data.length} BYTE`, { size: 18, font: "monospace" }),
      k.pos(400, 275),
      k.anchor("center"),
      k.color(56, 189, 248)
    ]);

    k.add([
      k.text(`DURASI SURVIVE : ${data.duration} DETIK`, { size: 18, font: "monospace" }),
      k.pos(400, 315),
      k.anchor("center"),
      k.color(224, 224, 255)
    ]);

    k.add([
      k.text(`REKOR TERTINGGI : ${progress.highScore} PTS`, { size: 18, font: "monospace" }),
      k.pos(400, 355),
      k.anchor("center"),
      k.color(245, 158, 11)
    ]);

    // Tombol Navigasi
    makeButton(k, "RETRY", k.vec2(400, 420), () => {
      k.go("gameplay");
    }, 220, 46);

    makeButton(k, "MENU", k.vec2(400, 480), () => {
      k.go("menu");
    }, 220, 46);

    makeButton(k, "EXIT HUB", k.vec2(400, 540), () => {
      window.location.href = "../../dashboard.html";
    }, 220, 46);
  });
}
