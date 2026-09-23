/**
 * game.js
 * Inisialisasi game engine Kaplay, registrasi seluruh scene, dan preload.
 */

import kaplay from "https://unpkg.com/kaplay@3001.0.19/dist/kaplay.mjs";
import { menuScene } from "./scenes/menu.js?v=2";
import { stageSelectScene } from "./scenes/stageSelect.js";
import { gameplayScene } from "./scenes/gameplay.js";
import { gameOverScene } from "./scenes/gameOver.js";
import { victoryScene } from "./scenes/victory.js";
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

k.loadRoot("./assets/img/");

// Registrasi semua Scene
menuScene(k);
stageSelectScene(k);
gameplayScene(k);
gameOverScene(k);
victoryScene(k);

// Scene Preload
k.scene("preload", () => {
  k.add([
    k.text("LOADING BATTLE MTK...", { size: 20, font: "monospace" }),
    k.pos(400, 300),
    k.anchor("center"),
    k.color(34, 197, 94)
  ]);

  initAudio(k);

  k.wait(0.5, () => {
    k.go("menu");
  });
});

window.k = k;
k.go("preload");

