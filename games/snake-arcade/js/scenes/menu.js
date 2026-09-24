/**
 * menu.js
 * Scene Menu Utama Snake Arcade (Data Worm).
 */

import { makeButton, retroPanel } from "../ui.js";
import { getCurrentUser, loadSnakeProgress } from "../user.js";

export function menuScene(k) {
  k.scene("menu", async () => {
    // Starfield Background
    for (let i = 0; i < 40; i++) {
      k.add([
        k.rect(k.rand(1, 3), k.rand(1, 3)),
        k.pos(k.rand(0, 800), k.rand(0, 600)),
        k.color(255, 255, 255),
        k.opacity(k.rand(0.2, 0.8)),
        k.z(-10)
      ]);
    }

    // Title
    k.add([
      k.text("SNAKE ARCADE", { size: 36, font: "monospace" }),
      k.pos(400, 110),
      k.anchor("center"),
      k.color(34, 197, 94)
    ]);

    // Subtitle
    k.add([
      k.text("DATA WORM PROTOCOL", { size: 20, font: "monospace" }),
      k.pos(400, 155),
      k.anchor("center"),
      k.color(168, 85, 247)
    ]);

    // Data Komandan & Skor
    const user = await getCurrentUser();
    const uid = user ? user.uid : null;
    const progress = await loadSnakeProgress(uid);

    const commanderName = localStorage.getItem("user_name") || (user ? user.email : "Commander");
    const commanderAvatar = localStorage.getItem("user_avatar") || "🚀";

    k.add([
      k.text(`KOMANDAN: ${commanderAvatar} ${commanderName}`, { size: 16, font: "monospace" }),
      k.pos(400, 195),
      k.anchor("center"),
      k.color(224, 224, 255)
    ]);

    k.add([
      k.text(`REKOR: ${progress.highScore} PTS | PANJANG: ${progress.highLength}`, { size: 14, font: "monospace" }),
      k.pos(400, 220),
      k.anchor("center"),
      k.color(245, 158, 11)
    ]);

    // Tombol Navigasi
    makeButton(k, "PLAY", k.vec2(400, 290), () => {
      k.go("gameplay");
    }, 240, 46);

    makeButton(k, "CARA MAIN", k.vec2(400, 350), () => {
      k.go("howToPlay");
    }, 240, 46);

    makeButton(k, "HIGH SCORE", k.vec2(400, 410), () => {
      showHighScore(progress);
    }, 240, 46);

    makeButton(k, "EXIT", k.vec2(400, 470), () => {
      window.location.href = "../../dashboard.html";
    }, 240, 46);

    // Overlay HIGH SCORE
    function showHighScore(p) {
      const panel = retroPanel(k, k.vec2(400, 300), 480, 300);

      panel.add([
        k.text("CATATAN REKOR WORM", { size: 20, font: "monospace" }),
        k.pos(0, -100),
        k.anchor("center"),
        k.color(245, 158, 11)
      ]);

      panel.add([
        k.text(`SKOR TERTINGGI : ${p.highScore} PTS`, { size: 16, font: "monospace" }),
        k.pos(0, -40),
        k.anchor("center"),
        k.color(34, 197, 94)
      ]);

      panel.add([
        k.text(`PANJANG MAKS   : ${p.highLength} BYTE`, { size: 16, font: "monospace" }),
        k.pos(0, 0),
        k.anchor("center"),
        k.color(56, 189, 248)
      ]);

      panel.add([
        k.text(`WAKTU SURVIVE  : ${p.bestDuration} DETIK`, { size: 16, font: "monospace" }),
        k.pos(0, 40),
        k.anchor("center"),
        k.color(168, 85, 247)
      ]);

      const closeBtn = panel.add([
        k.rect(120, 36, { radius: 4 }),
        k.pos(0, 100),
        k.anchor("center"),
        k.color(239, 68, 68),
        k.area()
      ]);
      closeBtn.add([
        k.text("TUTUP", { size: 16, font: "monospace" }),
        k.anchor("center"),
        k.color(255, 255, 255)
      ]);
      closeBtn.onClick(() => panel.destroy());
    }
  });
}
