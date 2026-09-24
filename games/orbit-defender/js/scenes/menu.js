/**
 * menu.js
 * Scene Menu Utama Orbit Defender (360° Turret Defense Protocol).
 */

import { makeButton, retroPanel } from "../ui.js";
import { getCurrentUser, loadDefenderProgress } from "../user.js";

export function menuScene(k) {
  k.scene("menu", async () => {
    // Starfield Warp Tunnel (Bintang meluncur dari pusat radar ke luar)
    const warpStars = [];
    for (let i = 0; i < 60; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = k.rand(30, 480);
      const spd = k.rand(80, 220);
      const star = k.add([
        k.rect(k.rand(1, 3), k.rand(1, 3)),
        k.pos(400 + Math.cos(angle) * dist, 240 + Math.sin(angle) * dist),
        k.anchor("center"),
        k.color(255, 255, 255),
        k.opacity(k.rand(0.2, 0.8)),
        k.z(-10)
      ]);
      warpStars.push({ obj: star, angle, dist, spd });
    }

    // Data Komandan & Skor
    const user = await getCurrentUser();
    const uid = user ? user.uid : null;
    const progress = await loadDefenderProgress(uid);

    const commanderName = localStorage.getItem("user_name") || (user ? user.email : "Commander");
    const commanderAvatar = localStorage.getItem("user_avatar") || "🚀";

    // ==========================================
    // SISI KIRI: JUDUL, INFO & TOMBOL NAVIGASI
    // ==========================================
    const LEFT_X = 95;

    // Title
    k.add([
      k.text("ORBIT DEFENDER", { size: 36, font: "monospace" }),
      k.pos(LEFT_X, 85),
      k.anchor("left"),
      k.color(34, 197, 94)
    ]);

    // Subtitle
    k.add([
      k.text("360° TURRET DEFENSE PROTOCOL", { size: 16, font: "monospace" }),
      k.pos(LEFT_X, 130),
      k.anchor("left"),
      k.color(0, 212, 255)
    ]);

    // Info Komandan
    k.add([
      k.text(`KOMANDAN: ${commanderAvatar} ${commanderName}`, { size: 15, font: "monospace" }),
      k.pos(LEFT_X, 165),
      k.anchor("left"),
      k.color(224, 224, 255)
    ]);

    // Info Rekor
    k.add([
      k.text(`REKOR: ${progress.highScore} PTS | MAX WAVE: ${progress.bestWave}`, { size: 13, font: "monospace" }),
      k.pos(LEFT_X, 192),
      k.anchor("left"),
      k.color(245, 158, 11)
    ]);

    // Tombol Navigasi di Sisi Kiri
    makeButton(k, "MULAI MISI", k.vec2(LEFT_X + 110, 260), () => {
      k.go("gameplay");
    }, 220, 44);

    makeButton(k, "CARA MAIN", k.vec2(LEFT_X + 110, 320), () => {
      k.go("howToPlay");
    }, 220, 44);

    makeButton(k, "DATA REKOR", k.vec2(LEFT_X + 110, 380), () => {
      showHighScore(progress);
    }, 220, 44);

    makeButton(k, "KELUAR", k.vec2(LEFT_X + 110, 440), () => {
      window.location.href = "../../dashboard.html";
    }, 220, 44);

    // ==========================================
    // SISI KANAN: RADAR BESAR & TURRET INTERAKTIF
    // ==========================================
    const radarCenter = k.vec2(600, 300);
    const radarRings = [55, 100, 150];
    for (const r of radarRings) {
      k.add([
        k.circle(r),
        k.pos(radarCenter),
        k.anchor("center"),
        k.color(0, 0, 0),
        k.outline(1, k.rgb(34, 197, 94)),
        k.opacity(0.18),
        k.z(-5)
      ]);
    }

    // Inti Pangkalan Luar Angkasa
    const stationCoreGlow = k.add([
      k.circle(38),
      k.pos(radarCenter),
      k.anchor("center"),
      k.color(0, 212, 255),
      k.opacity(0.2),
      k.z(-4)
    ]);

    k.add([
      k.circle(28),
      k.pos(radarCenter),
      k.anchor("center"),
      k.color(10, 15, 30),
      k.outline(2, k.rgb(34, 197, 94)),
      k.z(-3)
    ]);

    // Turret Mount Base
    k.add([
      k.circle(16),
      k.pos(radarCenter),
      k.anchor("center"),
      k.color(30, 41, 59),
      k.outline(1.5, k.rgb(148, 163, 184)),
      k.z(10)
    ]);

    // Twin Rail Cannon Turret di Sisi Kanan (Membidik Kursor Mouse)
    const menuTurret = k.add([
      k.rect(34, 10, { radius: 2 }),
      k.pos(radarCenter),
      k.anchor(k.vec2(0, 0.5)),
      k.color(15, 23, 42),
      k.outline(1.5, k.rgb(0, 212, 255)),
      k.rotate(0),
      k.z(12)
    ]);
    menuTurret.add([
      k.rect(30, 2),
      k.pos(2, -2.5),
      k.anchor("left"),
      k.color(0, 212, 255)
    ]);
    menuTurret.add([
      k.rect(30, 2),
      k.pos(2, 2.5),
      k.anchor("left"),
      k.color(0, 212, 255)
    ]);

    // Turret Dome Cockpit
    const menuDome = k.add([
      k.circle(8),
      k.pos(radarCenter),
      k.anchor("center"),
      k.color(0, 212, 255),
      k.outline(2, k.rgb(255, 255, 255)),
      k.z(14)
    ]);
    menuDome.add([
      k.circle(3),
      k.pos(0, 0),
      k.anchor("center"),
      k.color(255, 255, 255)
    ]);

    // 2 Satelit Mengorbit Pangkalan Kanan
    const sat1 = k.add([
      k.rect(8, 8, { radius: 2 }),
      k.pos(radarCenter),
      k.anchor("center"),
      k.color(245, 158, 11),
      k.outline(1, k.rgb(255, 255, 255)),
      k.z(15)
    ]);
    const sat2 = k.add([
      k.circle(5),
      k.pos(radarCenter),
      k.anchor("center"),
      k.color(217, 70, 239),
      k.z(15)
    ]);

    // Sweeping Radar Beam
    let sweepAngle = 0;
    const sweepLine = k.add([
      k.rect(150, 2),
      k.pos(radarCenter),
      k.color(34, 197, 94),
      k.opacity(0.3),
      k.rotate(0),
      k.z(-4)
    ]);

    // Blip musuh di radar
    const blip = k.add([
      k.circle(5),
      k.pos(radarCenter.x + 95, radarCenter.y - 40),
      k.anchor("center"),
      k.color(239, 68, 68),
      k.opacity(0),
      k.z(5)
    ]);

    let blipTimer = 0;

    k.onUpdate(() => {
      const dt = k.dt();

      // Warp Stars meluncur ke luar
      for (const ws of warpStars) {
        ws.dist += ws.spd * dt;
        if (ws.dist > 520) {
          ws.dist = k.rand(20, 50);
          ws.angle = Math.random() * Math.PI * 2;
        }
        ws.obj.pos.x = radarCenter.x + Math.cos(ws.angle) * ws.dist;
        ws.obj.pos.y = radarCenter.y + Math.sin(ws.angle) * ws.dist;
      }

      // Animasi Denyut Inti
      stationCoreGlow.opacity = 0.2 + Math.sin(Date.now() / 250) * 0.1;

      // Radar Sweep
      sweepAngle += dt * 90;
      sweepLine.angle = sweepAngle;

      // Turret membidik kursor mouse pemain secara real-time
      const mpos = k.mousePos ? k.mousePos() : null;
      if (mpos) {
        const dx = mpos.x - radarCenter.x;
        const dy = mpos.y - radarCenter.y;
        menuTurret.angle = k.rad2deg(Math.atan2(dy, dx));
      }

      // Satelit 1 & 2 berputar mengelilingi pangkalan
      const t = Date.now() / 1000;
      sat1.pos.x = radarCenter.x + Math.cos(t * 1.4) * 55;
      sat1.pos.y = radarCenter.y + Math.sin(t * 1.4) * 55;

      sat2.pos.x = radarCenter.x + Math.cos(-t * 0.9) * 100;
      sat2.pos.y = radarCenter.y + Math.sin(-t * 0.9) * 100;

      // Blip Sensor Radar muncul berkala
      blipTimer += dt;
      blip.opacity = Math.max(0, Math.sin(blipTimer * 3));
    });

    // Overlay High Score
    function showHighScore(p) {
      const menuBtns = k.get("btn");
      menuBtns.forEach(b => { b.paused = true; });

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
        k.outline(2, k.rgb(34, 197, 94)),
        k.z(151),
        "hsModal"
      ]);

      panel.add([
        k.text("CATATAN PERTAHANAN ORBIT", { size: 20, font: "monospace" }),
        k.pos(0, -115),
        k.anchor("center"),
        k.color(245, 158, 11)
      ]);

      panel.add([
        k.text(`Skor Tertinggi : ${p.highScore} PTS`, { size: 17, font: "monospace" }),
        k.pos(0, -50),
        k.anchor("center"),
        k.color(34, 197, 94)
      ]);

      panel.add([
        k.text(`Gelombang Maksimum : Wave ${p.bestWave}`, { size: 17, font: "monospace" }),
        k.pos(0, -10),
        k.anchor("center"),
        k.color(0, 212, 255)
      ]);

      panel.add([
        k.text(`Waktu Bertahan : ${p.bestDuration} Detik`, { size: 17, font: "monospace" }),
        k.pos(0, 30),
        k.anchor("center"),
        k.color(224, 224, 255)
      ]);

      const closeBtn = k.add([
        k.rect(160, 40, { radius: 4 }),
        k.pos(400, 390),
        k.anchor("center"),
        k.color(239, 68, 68),
        k.area(),
        k.z(152),
        "hsModal"
      ]);

      closeBtn.add([
        k.text("TUTUP", { size: 16, font: "monospace" }),
        k.anchor("center"),
        k.color(255, 255, 255)
      ]);

      closeBtn.onClick(() => {
        k.destroyAll("hsModal");
        menuBtns.forEach(b => { b.paused = false; });
      });
    }
  });
}
