/**
 * gameOver.js
 * Scene Game Over Orbit Defender.
 */

import { makeButton } from "../ui.js";
import { getCurrentUser, loadDefenderProgress } from "../user.js";

export function gameOverScene(k) {
  k.scene("gameOver", async (data = { score: 0, wave: 1, kills: 0, duration: 0 }) => {
    // Starfield Background
    for (let i = 0; i < 35; i++) {
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
      k.text("PERTAHANAN JEBOL", { size: 36, font: "monospace" }),
      k.pos(400, 115),
      k.anchor("center"),
      k.color(239, 68, 68)
    ]);

    // Data User Rekor
    const user = await getCurrentUser();
    const uid = user ? user.uid : null;
    const progress = await loadDefenderProgress(uid);

    const isNewRecord = data.score >= progress.highScore && data.score > 0;

    if (isNewRecord) {
      k.add([
        k.text("★ REKOR BARU TERCIPTA KOMANDAN! ★", { size: 16, font: "monospace" }),
        k.pos(400, 165),
        k.anchor("center"),
        k.color(245, 158, 11)
      ]);
    }

    // Detail Hasil Misi
    const startY = 195;
    const stats = [
      { lbl: "SKOR AKHIR", val: `${data.score} PTS`, col: k.rgb(34, 197, 94) },
      { lbl: "GELOMBANG BERTAHAN", val: `WAVE ${data.wave}`, col: k.rgb(0, 212, 255) },
      { lbl: "TOTAL MUSUH MUSNAH", val: `${data.kills} UNIT`, col: k.rgb(245, 158, 11) },
      { lbl: "DURASI SURVIVE", val: `${data.duration} DETIK`, col: k.rgb(224, 224, 255) },
      { lbl: "REKOR TERTINGGI", val: `${progress.highScore} PTS`, col: k.rgb(217, 70, 239) }
    ];

    stats.forEach((s, idx) => {
      k.add([
        k.text(`${s.lbl} : ${s.val}`, { size: 18, font: "monospace" }),
        k.pos(400, startY + idx * 36),
        k.anchor("center"),
        k.color(s.col)
      ]);
    });

    // Tombol Navigasi
    makeButton(k, "COBA LAGI", k.vec2(400, 410), () => {
      k.go("gameplay");
    }, 220, 44);

    makeButton(k, "MENU UTAMA", k.vec2(400, 465), () => {
      k.go("menu");
    }, 220, 44);

    makeButton(k, "KELUAR KE HUB", k.vec2(400, 520), () => {
      window.location.href = "../../dashboard.html";
    }, 220, 44);
  });
}
