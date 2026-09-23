/**
 * stageSelect.js
 * Scene pemilihan level/stage Battle MTK (Stage 1-10).
 */

import { makeButton } from "../ui.js";
import { getCurrentUser, loadBattleProgress } from "../user.js";

export function stageSelectScene(k) {
  k.scene("stageSelect", async () => {
    k.add([
      k.text("PILIH STAGE", { size: 24, font: "monospace" }),
      k.pos(400, 60),
      k.anchor("center"),
      k.color(34, 197, 94)
    ]);

    const user = await getCurrentUser();
    const progress = await loadBattleProgress(user ? user.uid : null);
    const stagesData = progress.stages || {};

    // Render Grid 5x2 (10 Stage)
    const startX = 140;
    const startY = 170;
    const gapX = 130;
    const gapY = 140;

    for (let i = 1; i <= 10; i++) {
      const col = (i - 1) % 5;
      const row = Math.floor((i - 1) / 5);
      const posX = startX + col * gapX;
      const posY = startY + row * gapY;

      // Stage 1 selalu terbuka, stage n terbuka jika stage n-1 memiliki bintang > 0
      const prevCleared = i === 1 || (stagesData[i - 1] && (stagesData[i - 1].stars || 0) > 0);
      const stageInfo = stagesData[i] || { stars: 0, score: 0 };

      const card = k.add([
        k.rect(110, 90, { radius: 6 }),
        k.pos(posX, posY),
        k.anchor("center"),
        k.color(prevCleared ? k.rgb(20, 30, 45) : k.rgb(20, 20, 25)),
        k.outline(2, prevCleared ? k.rgb(34, 197, 94) : k.rgb(80, 80, 90)),
        k.area(),
        "stageCard"
      ]);

      card.add([
        k.text(`STAGE ${i}`, { size: 16, font: "monospace" }),
        k.pos(0, -15),
        k.anchor("center"),
        k.color(prevCleared ? k.rgb(255, 255, 255) : k.rgb(120, 120, 130))
      ]);

      const starsCount = stageInfo.stars || 0;
      const starText = "★".repeat(starsCount) + "☆".repeat(3 - starsCount);
      card.add([
        k.text(starText, { size: 18, font: "monospace" }),
        k.pos(0, 15),
        k.anchor("center"),
        k.color(starsCount > 0 ? k.rgb(245, 158, 11) : k.rgb(100, 100, 110))
      ]);

      if (prevCleared) {
        card.onHoverUpdate(() => {
          card.scale = k.vec2(1.06);
          k.setCursor("pointer");
        });
        card.onHoverEnd(() => {
          card.scale = k.vec2(1);
          k.setCursor("default");
        });
        card.onClick(() => {
          k.go("gameplay", { stage: i });
        });
      }
    }

    makeButton(k, "KEMBALI", k.vec2(400, 540), () => {
      k.go("menu");
    });
  });
}
