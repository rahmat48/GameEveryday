/**
 * game.js
 * Inisialisasi engine Kaplay dan integrasi seluruh scene Pacman Arcade.
 */

import kaplay from "https://unpkg.com/kaplay@3001.0.19/dist/kaplay.mjs";
import { menuScene } from "./scenes/menu.js";
import { howToPlayScene } from "./scenes/howToPlay.js";
import { gameplayScene } from "./scenes/gameplay.js";
import { gameOverScene } from "./scenes/gameOver.js";
import { initAudio } from "./audio.js";
import { initMobileController } from "./mobileController.js";

const k = kaplay({
  width: 800,
  height: 600,
  background: "#060614",
  letterbox: true,
  touchToMouse: true,
  maxFPS: 60,
  crisp: true,
  global: false,
  root: document.getElementById("game-container")
});

k.loadRoot("./assets/img/");

// Registrasi Seluruh Scene
menuScene(k);
howToPlayScene(k);
gameplayScene(k);
gameOverScene(k);

// Scene Preload
k.scene("preload", () => {
  k.add([
    k.text("LOADING PACMAN PROTOCOL...", { size: 18, font: "monospace" }),
    k.pos(400, 300),
    k.anchor("center"),
    k.color(250, 204, 21)
  ]);

  initAudio(k);
  initMobileController();

  k.wait(0.8, () => {
    k.go("menu");
  });
});

window.k = k;
k.go("preload");

export default k;
