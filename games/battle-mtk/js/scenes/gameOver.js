/**
 * gameOver.js
 * Scene Game Over saat player kehabisan HP atau nyawa.
 */

import { makeButton } from "../ui.js";

export function gameOverScene(k) {
  k.scene("gameOver", (data = {}) => {
    const stage = data.stage || 1;
    const score = data.score || 0;
    const maxCombo = data.maxCombo || 0;

    k.add([
      k.text("GAME OVER", { size: 40, font: "monospace" }),
      k.pos(400, 150),
      k.anchor("center"),
      k.color(239, 68, 68)
    ]);

    k.add([
      k.text(`STAGE ${stage}`, { size: 28, font: "monospace" }),
      k.pos(400, 220),
      k.anchor("center"),
      k.color(255, 255, 255)
    ]);

    k.add([
      k.text(`SKOR: ${score}`, { size: 32, font: "monospace" }),
      k.pos(400, 280),
      k.anchor("center"),
      k.color(34, 197, 94)
    ]);

    k.add([
      k.text(`MAX COMBO: ${maxCombo}`, { size: 24, font: "monospace" }),
      k.pos(400, 330),
      k.anchor("center"),
      k.color(168, 85, 247)
    ]);

    makeButton(k, "RETRY", k.vec2(400, 410), () => {
      k.go("gameplay", { stage });
    });

    makeButton(k, "PILIH STAGE", k.vec2(400, 475), () => {
      k.go("stageSelect");
    });

    makeButton(k, "MENU", k.vec2(400, 540), () => {
      k.go("menu");
    });
  });
}
