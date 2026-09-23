/**
 * victory.js
 * Scene kemenangan setelah mengalahkan monster di stage tertentu.
 */

import { makeButton } from "../ui.js";

export function victoryScene(k) {
  k.scene("victory", (data = {}) => {
    const stage = data.stage || 1;
    const score = data.score || 0;
    const stars = data.stars || 1;
    const maxCombo = data.maxCombo || 0;
    const duration = Math.round(data.duration || 0);

    // Efek Konfeti Perayaan
    const confettiColors = [
      k.rgb(34, 197, 94),
      k.rgb(168, 85, 247),
      k.rgb(245, 158, 11),
      k.rgb(56, 189, 248)
    ];

    let timerCount = 0;
    const confettiLoop = k.loop(0.1, () => {
      timerCount += 0.1;
      if (timerCount > 2) {
        confettiLoop.cancel();
        return;
      }
      for (let i = 0; i < 6; i++) {
        const p = k.add([
          k.rect(8, 8),
          k.pos(Math.random() * 800, -10),
          k.color(confettiColors[Math.floor(Math.random() * confettiColors.length)]),
          k.opacity(1),
          k.z(5)
        ]);
        const speed = Math.random() * 150 + 100;
        p.onUpdate(() => {
          p.pos.y += speed * k.dt();
          if (p.pos.y > 620) p.destroy();
        });
      }
    });

    k.add([
      k.text("STAGE CLEAR!", { size: 32, font: "monospace" }),
      k.pos(400, 110),
      k.anchor("center"),
      k.color(34, 197, 94)
    ]);

    k.add([
      k.text(`STAGE ${stage}`, { size: 24, font: "monospace" }),
      k.pos(400, 160),
      k.anchor("center"),
      k.color(255, 255, 255)
    ]);

    // Bintang Performa
    const starString = "★".repeat(stars) + "☆".repeat(3 - stars);
    k.add([
      k.text(starString, { size: 44, font: "monospace" }),
      k.pos(400, 215),
      k.anchor("center"),
      k.color(245, 158, 11)
    ]);

    k.add([
      k.text(`SKOR: ${score}`, { size: 26, font: "monospace" }),
      k.pos(400, 275),
      k.anchor("center"),
      k.color(34, 197, 94)
    ]);

    k.add([
      k.text(`WAKTU: ${duration}s`, { size: 22, font: "monospace" }),
      k.pos(400, 315),
      k.anchor("center"),
      k.color(224, 224, 255)
    ]);

    k.add([
      k.text(`MAX COMBO: ${maxCombo}`, { size: 22, font: "monospace" }),
      k.pos(400, 350),
      k.anchor("center"),
      k.color(168, 85, 247)
    ]);

    if (stage < 10) {
      makeButton(k, "STAGE BERIKUTNYA", k.vec2(400, 420), () => {
        k.go("gameplay", { stage: stage + 1 });
      }, 230, 44);
    } else {
      k.add([
        k.text("MISSION COMPLETE!", { size: 20, font: "monospace" }),
        k.pos(400, 420),
        k.anchor("center"),
        k.color(245, 158, 11)
      ]);
    }

    makeButton(k, "PILIH STAGE", k.vec2(400, 480), () => {
      k.go("stageSelect");
    }, 200, 42);

    makeButton(k, "MENU", k.vec2(400, 540), () => {
      k.go("menu");
    }, 200, 42);
  });
}
