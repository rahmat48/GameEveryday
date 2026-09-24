/**
 * gameOver.js
 * Scene Game Over & Rekapitulasi Skor Pacman Arcade.
 */

import { makeButton, retroPanel } from "../ui.js";
import { updateDpadSceneVisibility } from "../mobileController.js";

export function gameOverScene(k) {
  k.scene("gameOver", (data = {}) => {
    updateDpadSceneVisibility(false);
    const {
      score = 0,
      stage = 1,
      dotsEaten = 0,
      ghostsEaten = 0,
      duration = 0,
      isNewRecord = false,
      stageName = "CYBER LABYRINTH"
    } = data;

    // Starfield Background
    for (let i = 0; i < 35; i++) {
      k.add([
        k.rect(2, 2),
        k.pos(k.rand(0, 800), k.rand(0, 600)),
        k.color(255, 255, 255),
        k.opacity(k.rand(0.15, 0.6)),
        k.z(-10)
      ]);
    }

    // Title
    k.add([
      k.text("GAME OVER", { size: 42, font: "monospace" }),
      k.pos(400, 70),
      k.anchor("center"),
      k.color(239, 68, 68)
    ]);

    k.add([
      k.text("PROTOKOL PACMAN DIAKHIRI", { size: 16, font: "monospace" }),
      k.pos(400, 115),
      k.anchor("center"),
      k.color(0, 212, 255)
    ]);

    // Recap Panel
    retroPanel(k, {
      pos: k.vec2(160, 145),
      width: 480,
      height: 250,
      borderColor: isNewRecord ? k.rgb(250, 204, 21) : k.rgb(37, 99, 235),
      bgColor: k.rgb(10, 10, 26),
      z: 1
    });

    if (isNewRecord) {
      k.add([
        k.text("★ REKOR SKOR BARU TERDAFTAR! ★", { size: 14, font: "monospace" }),
        k.pos(400, 170),
        k.anchor("center"),
        k.color(250, 204, 21),
        k.z(5)
      ]);
    }

    const mins = Math.floor(duration / 60);
    const secs = Math.floor(duration % 60);
    const timeFormatted = `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;

    const stats = [
      { label: "SKOR AKHIR", val: `${score} PTS`, col: k.rgb(250, 204, 21) },
      { label: "STAGE TERTINGGI", val: `STAGE ${stage} (${stageName})`, col: k.rgb(56, 189, 248) },
      { label: "DATA PELLET DIMAKAN", val: `${dotsEaten} BUTIR`, col: k.rgb(224, 224, 255) },
      { label: "HANTU DITANGKAP", val: `${ghostsEaten} KORBAN`, col: k.rgb(244, 114, 182) },
      { label: "DURASI MISI", val: timeFormatted, col: k.rgb(148, 163, 184) }
    ];

    let statY = isNewRecord ? 205 : 180;
    stats.forEach(st => {
      k.add([
        k.text(st.label, { size: 14, font: "monospace" }),
        k.pos(200, statY),
        k.color(148, 163, 184),
        k.z(5)
      ]);
      k.add([
        k.text(st.val, { size: 14, font: "monospace" }),
        k.pos(600, statY),
        k.anchor("right"),
        k.color(st.col),
        k.z(5)
      ]);
      statY += 34;
    });

    // Buttons
    makeButton(k, "🔄 MAIN LAGI", k.vec2(400, 430), () => {
      k.go("gameplay");
    }, 260, 48);

    makeButton(k, "🏠 MENU UTAMA", k.vec2(400, 490), () => {
      k.go("menu");
    }, 260, 44);

    makeButton(k, "🚪 KEMBALI KE HUB", k.vec2(400, 545), () => {
      window.location.href = "../../dashboard.html";
    }, 260, 40);

    k.onKeyPress("space", () => k.go("gameplay"));
    k.onKeyPress("enter", () => k.go("gameplay"));
    k.onKeyPress("escape", () => k.go("menu"));
  });
}
