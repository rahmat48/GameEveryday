/**
 * menu.js
 * Scene Menu Utama Pacman Arcade (Cyber Pacman Protocol).
 */

import { makeButton, retroPanel } from "../ui.js";
import { getCurrentUser, loadPacmanProgress } from "../user.js";
import { playBgm } from "../audio.js";
import { updateDpadSceneVisibility } from "../mobileController.js";

export function menuScene(k) {
  k.scene("menu", async () => {
    updateDpadSceneVisibility(false);
    // Starfield Background
    for (let i = 0; i < 40; i++) {
      k.add([
        k.rect(k.rand(1, 3), k.rand(1, 3)),
        k.pos(k.rand(0, 800), k.rand(0, 600)),
        k.color(255, 255, 255),
        k.opacity(k.rand(0.2, 0.7)),
        k.z(-10)
      ]);
    }

    playBgm(k, "bgm-menu");

    // Load progress user
    const user = await getCurrentUser();
    const uid = user ? user.uid : null;
    const progress = await loadPacmanProgress(uid);

    const commanderName = localStorage.getItem("user_name") || (user ? user.email : "Commander");
    const commanderAvatar = localStorage.getItem("user_avatar") || "🚀";

    // Title Header
    k.add([
      k.text("PACMAN ARCADE", { size: 36, font: "monospace" }),
      k.pos(400, 75),
      k.anchor("center"),
      k.color(250, 204, 21),
      k.z(10)
    ]);

    k.add([
      k.text("CYBER LABYRINTH PROTOCOL", { size: 16, font: "monospace" }),
      k.pos(400, 115),
      k.anchor("center"),
      k.color(0, 212, 255),
      k.z(10)
    ]);

    // Commander & Stats Badge
    k.add([
      k.text(`KOMANDAN: ${commanderAvatar} ${commanderName}`, { size: 14, font: "monospace" }),
      k.pos(400, 150),
      k.anchor("center"),
      k.color(224, 224, 255),
      k.z(10)
    ]);

    k.add([
      k.text(`HIGH SCORE: ${progress.highScore} PTS | MAX STAGE: ${progress.bestStage || 1}`, { size: 13, font: "monospace" }),
      k.pos(400, 175),
      k.anchor("center"),
      k.color(245, 158, 11),
      k.z(10)
    ]);

    // ==========================================
    // ARCADE ATTRACTION DEMO ANIMATION (Center)
    // ==========================================
    const demoY = 250;
    retroPanel(k, {
      pos: k.vec2(100, demoY - 45),
      width: 600,
      height: 90,
      borderColor: k.rgb(37, 99, 235),
      bgColor: k.rgb(6, 6, 20),
      z: 5
    });

    // Demo dots
    const dots = [];
    for (let x = 140; x <= 660; x += 35) {
      const d = k.add([
        k.circle(3),
        k.pos(x, demoY),
        k.anchor("center"),
        k.color(254, 240, 138),
        k.z(6)
      ]);
      dots.push({ obj: d, origX: x });
    }

    // Energizer
    const energizer = k.add([
      k.circle(7),
      k.pos(640, demoY),
      k.anchor("center"),
      k.color(255, 255, 255),
      k.z(6)
    ]);

    // Pacman Demo Object
    const pacDemo = k.add([
      k.circle(15),
      k.pos(120, demoY),
      k.anchor("center"),
      k.color(250, 204, 21),
      k.z(8)
    ]);

    // Ghost Demo Objects
    const ghostColors = [
      { name: "BLINKY", col: k.rgb(239, 68, 68), off: 45 },
      { name: "PINKY", col: k.rgb(244, 114, 182), off: 80 },
      { name: "INKY", col: k.rgb(6, 182, 212), off: 115 },
      { name: "CLYDE", col: k.rgb(249, 115, 22), off: 150 }
    ];

    const ghostDemoObjs = ghostColors.map(g => {
      const ghost = k.add([
        k.rect(20, 20, { radius: 4 }),
        k.pos(120 - g.off, demoY),
        k.anchor("center"),
        k.color(g.col),
        k.z(7)
      ]);
      return { ...g, obj: ghost };
    });

    let demoTime = 0;
    pacDemo.onUpdate(() => {
      demoTime += k.dt();
      const cycle = (demoTime % 8); // 8-second cycle
      const isReverse = cycle > 4;

      if (!isReverse) {
        // Phase 1: Pacman moves right, ghosts chase
        const progressPhase = cycle / 4;
        pacDemo.pos.x = 120 + progressPhase * 520;
        ghostDemoObjs.forEach(g => {
          g.obj.pos.x = pacDemo.pos.x - g.off;
          g.obj.color = g.col;
        });
      } else {
        // Phase 2: Energizer eaten! Pacman moves left, ghosts flee in blue
        const progressPhase = (cycle - 4) / 4;
        pacDemo.pos.x = 640 - progressPhase * 520;
        ghostDemoObjs.forEach(g => {
          g.obj.pos.x = pacDemo.pos.x + g.off;
          g.obj.color = (cycle > 7 && Math.floor(demoTime * 6) % 2 === 0)
            ? k.rgb(255, 255, 255)
            : k.rgb(56, 189, 248);
        });
      }

      // Hide / show dots
      dots.forEach(d => {
        d.obj.opacity = (!isReverse && pacDemo.pos.x > d.origX) ? 0.2 : 1;
      });
      energizer.opacity = (Math.floor(demoTime * 4) % 2 === 0) ? 1 : 0.3;
    });

    // Ghost Legend text under demo box
    k.add([
      k.text("🔴 BLINKY (SHADOW)  🌸 PINKY (SPEEDY)  💧 INKY (BASHFUL)  🍊 CLYDE (POKEY)", {
        size: 11,
        font: "monospace"
      }),
      k.pos(400, demoY + 60),
      k.anchor("center"),
      k.color(148, 163, 184),
      k.z(10)
    ]);

    // ==========================================
    // ACTION BUTTONS (Bottom)
    // ==========================================
    makeButton(k, "▶ MULAI PERMAINAN", k.vec2(400, 395), () => {
      k.go("gameplay");
    }, 280, 50);

    makeButton(k, "📖 CARA BERMAIN", k.vec2(400, 460), () => {
      k.go("howToPlay");
    }, 280, 44);

    makeButton(k, "🚪 KEMBALI KE HUB", k.vec2(400, 520), () => {
      window.location.href = "../../dashboard.html";
    }, 280, 42);

    // Keyboard Shortcuts
    k.onKeyPress("space", () => k.go("gameplay"));
    k.onKeyPress("enter", () => k.go("gameplay"));
    k.onKeyPress("h", () => k.go("howToPlay"));
    k.onKeyPress("escape", () => {
      window.location.href = "../../dashboard.html";
    });
  });
}
