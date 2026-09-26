/**
 * menu.js
 * Scene Menu Utama Pulse Runner (Gravity Tunnel Protocol).
 */

import { makeButton, getGameThemeColors } from "../ui.js";
import { playSfx, playBgm, stopBgm } from "../audio.js";
import { getCurrentUser, loadRunnerProgress } from "../user.js";

export function menuScene(k) {
  k.scene("menu", async () => {
    document.body.classList.remove("in-gameplay");
    const theme = getGameThemeColors(k);
    playBgm(k, "bgm-menu");

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

    // Tunnel Frame Dekoratif (lantai & plafon bergulir)
    const floorStrip = k.add([
      k.rect(800, 10),
      k.pos(0, 560),
      k.color(theme.primary),
      k.opacity(0.35),
      k.z(-5)
    ]);
    const ceilStrip = k.add([
      k.rect(800, 10),
      k.pos(0, 30),
      k.color(theme.primary),
      k.opacity(0.35),
      k.z(-5)
    ]);
    let stripeX = 0;
    k.onUpdate(() => {
      stripeX = (stripeX + 60 * k.dt()) % 40;
      floorStrip.pos.x = -40 + stripeX;
      ceilStrip.pos.x = -40 + stripeX;
    });

    // Kapal Demo Melayang dengan Flip Gravitasi
    const demoShip = k.add([
      k.rect(36, 18, { radius: 4 }),
      k.outline(2, k.WHITE),
      k.color(0, 212, 255),
      k.pos(180, 300),
      k.anchor("center"),
      k.z(4)
    ]);
    let demoT = 0;
    let demoG = 1;
    k.onUpdate(() => {
      demoT += k.dt();
      if (demoT > 2.2) { demoT = 0; demoG *= -1; demoShip.angle = demoG === 1 ? 0 : 180; }
      demoShip.pos.y = 300 + Math.sin(demoT * 3.5) * 90 * demoG;
    });

    // Title
    k.add([
      k.text("PULSE RUNNER", { size: 38, font: "monospace" }),
      k.pos(400, 110),
      k.anchor("center"),
      k.color(theme.primary)
    ]);

    k.add([
      k.text("GRAVITY TUNNEL PROTOCOL", { size: 18, font: "monospace" }),
      k.pos(400, 152),
      k.anchor("center"),
      k.color(theme.cyan)
    ]);

    // Data Komandan & Rekor
    const user = await getCurrentUser();
    const uid = user ? user.uid : null;
    const progress = await loadRunnerProgress(uid);

    const commanderName = localStorage.getItem("user_name") || (user ? user.email : "Commander");
    const commanderAvatar = localStorage.getItem("user_avatar") || "🚀";

    k.add([
      k.text(`KOMANDAN: ${commanderAvatar} ${commanderName}`, { size: 15, font: "monospace" }),
      k.pos(400, 192),
      k.anchor("center"),
      k.color(224, 224, 255)
    ]);

    k.add([
      k.text(`REKOR: ${progress.highScore} PTS | ${progress.bestDistance} M`, { size: 13, font: "monospace" }),
      k.pos(400, 216),
      k.anchor("center"),
      k.color(245, 158, 11)
    ]);

    // Tombol Navigasi
    makeButton(k, "PLAY", k.vec2(400, 300), () => {
      playSfx(k, "click");
      stopBgm();
      k.go("gameplay");
    }, 240, 46);

    makeButton(k, "CARA MAIN", k.vec2(400, 360), () => {
      playSfx(k, "click");
      k.go("howToPlay");
    }, 240, 46);

    makeButton(k, "HIGH SCORE", k.vec2(400, 420), () => {
      playSfx(k, "click");
      showHighScore(progress);
    }, 240, 46);

    makeButton(k, "EXIT", k.vec2(400, 480), () => {
      playSfx(k, "click");
      window.location.href = "../../dashboard.html";
    }, 240, 46);

    // Overlay HIGH SCORE
    function showHighScore(p) {
      const menuBtns = k.get("btn");
      menuBtns.forEach((b) => { b.paused = true; });

      const blocker = k.add([
        k.rect(800, 600),
        k.pos(0, 0),
        k.color(0, 0, 0),
        k.opacity(0.7),
        k.area(),
        k.z(150),
        "hsModal"
      ]);

      const panel = k.add([
        k.rect(500, 320, { radius: 8 }),
        k.pos(400, 300),
        k.anchor("center"),
        k.color(10, 10, 26),
        k.outline(2, theme.border),
        k.z(151),
        "hsModal"
      ]);

      panel.add([
        k.text("CATATAN REKOR TUNNEL", { size: 20, font: "monospace" }),
        k.pos(0, -110),
        k.anchor("center"),
        k.color(245, 158, 11)
      ]);

      panel.add([
        k.text(`SKOR TERTINGGI : ${p.highScore} PTS`, { size: 16, font: "monospace" }),
        k.pos(0, -50),
        k.anchor("center"),
        k.color(theme.primary)
      ]);

      panel.add([
        k.text(`DISTANCE MAKS  : ${p.bestDistance} M`, { size: 16, font: "monospace" }),
        k.pos(0, -15),
        k.anchor("center"),
        k.color(theme.cyan)
      ]);

      panel.add([
        k.text(`COMBO TERBAIK  : x${p.bestCombo}`, { size: 16, font: "monospace" }),
        k.pos(0, 20),
        k.anchor("center"),
        k.color(224, 224, 255)
      ]);

      const closeBtn = makeButton(k, "TUTUP", k.vec2(400, 300 + 90), () => {
        playSfx(k, "click");
        k.get("hsModal").forEach((e) => e.destroy());
        k.get("btn").forEach((b) => { b.paused = false; });
      }, 180, 42);
      closeBtn.z = 152;
    }
  });
}
