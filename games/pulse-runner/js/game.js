/**
 * game.js
 * Inisialisasi game engine Kaplay dan integrasi seluruh scene Pulse Runner (Gravity Tunnel Protocol).
 */

import kaplay from "https://unpkg.com/kaplay@3001.0.19/dist/kaplay.mjs";
import { menuScene } from "./scenes/menu.js";
import { howToPlayScene } from "./scenes/howToPlay.js";
import { gameplayScene } from "./scenes/gameplay.js?v=6";
import { gameOverScene } from "./scenes/gameOver.js";
import { initAudio } from "./audio.js";

const k = kaplay({
  width: 800,
  height: 600,
  background: "#0a0a1a",
  letterbox: true,
  touchToMouse: true,
  maxFPS: 60,
  crisp: true,
  global: false,
  root: document.getElementById("game-container")
});

// Registrasi Seluruh Scene
menuScene(k);
howToPlayScene(k);
gameplayScene(k);
gameOverScene(k);

// Scene Preload
k.scene("preload", () => {
  k.add([
    k.text("LOADING GRAVITY TUNNEL PROTOCOL...", { size: 18, font: "monospace" }),
    k.pos(400, 300),
    k.anchor("center"),
    k.color(0, 212, 255)
  ]);

  initAudio(k);

  k.wait(1.2, () => {
    k.go("menu");
  });
});

window.k = k;
k.go("preload");

export default k;
