/**
 * menu.js
 * Scene menu utama Battle MTK.
 */

import { makeButton, retroPanel } from "../ui.js";
import { getCurrentUser, loadBattleProgress } from "../user.js";

export function menuScene(k) {
  k.scene("menu", async () => {
    // Starfield Background
    k.loop(0.3, () => {
      const starColor = Math.random() > 0.5 ? k.rgb(255, 255, 255) : k.rgb(180, 220, 255);
      const star = k.add([
        k.rect(2, 2),
        k.pos(Math.random() * 800, -10),
        k.color(starColor),
        k.opacity(Math.random() * 0.7 + 0.3),
        k.z(-10),
        "star"
      ]);

      const speed = Math.random() * 50 + 50;
      star.onUpdate(() => {
        star.pos.y += speed * k.dt();
        if (star.pos.y > 620) star.destroy();
      });
    });

    // Header Glow & Title
    k.add([
      k.text("BATTLE MTK", { size: 40, font: "monospace" }),
      k.pos(400, 180),
      k.anchor("center"),
      k.color(34, 197, 94),
      k.opacity(0.3)
    ]);

    k.add([
      k.text("BATTLE MTK", { size: 40, font: "monospace" }),
      k.pos(400, 180),
      k.anchor("center"),
      k.color(34, 197, 94)
    ]);

    // Subtitle
    k.add([
      k.text("MATH COMBAT SIMULATOR", { size: 28, font: "monospace" }),
      k.pos(400, 230),
      k.anchor("center"),
      k.color(168, 85, 247)
    ]);

    // Commander Info
    const avatar = localStorage.getItem("user_avatar") || "🚀";
    const name = localStorage.getItem("user_name") || "Commander";
    k.add([
      k.text(`${avatar} ${name}`, { size: 24, font: "monospace" }),
      k.pos(400, 100),
      k.anchor("center"),
      k.color(224, 224, 255)
    ]);

    // Tombol Navigasi Menu
    makeButton(k, "PLAY", k.vec2(400, 350), () => {
      k.go("stageSelect");
    });

    makeButton(k, "HIGH SCORE", k.vec2(400, 420), async () => {
      const user = await getCurrentUser();
      const progress = await loadBattleProgress(user ? user.uid : null);

      const panel = retroPanel(k, k.vec2(400, 300), 500, 350);
      panel.z = 200;

      const title = panel.add([
        k.text("HIGH SCORE", { size: 20, font: "monospace" }),
        k.pos(0, -120),
        k.anchor("center"),
        k.color(34, 197, 94)
      ]);

      const scoreText = panel.add([
        k.text(`BEST: ${progress.highScore || 0}`, { size: 28, font: "monospace" }),
        k.pos(0, -40),
        k.anchor("center"),
        k.color(255, 255, 255)
      ]);

      const closeBtn = panel.add([
        k.rect(36, 36, { radius: 4 }),
        k.pos(210, -140),
        k.anchor("center"),
        k.color(239, 68, 68),
        k.area(),
        "closeBtn"
      ]);

      closeBtn.add([
        k.text("X", { size: 14, font: "monospace" }),
        k.anchor("center"),
        k.color(255, 255, 255)
      ]);

      closeBtn.onClick(() => {
        panel.destroy();
      });
    });

    makeButton(k, "EXIT", k.vec2(400, 490), () => {
      window.location.href = "../../hub.html";
    });
  });
}
