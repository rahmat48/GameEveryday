/**
 * gameplay.js
 * Scene Utama Gameplay Snake Arcade (Data Worm Protocol).
 */

import { initInput } from "../input.js";
import { initSwipe } from "../swipe.js";
import { initMobileController } from "../mobileController.js";
import { getCurrentUser, saveSnakeScore, updateGameStats } from "../user.js";
import { retroPanel, screenShake, floatingText } from "../ui.js";
import { playSfx, playBgm, stopBgm } from "../audio.js";

export function gameplayScene(k) {
  k.scene("gameplay", async () => {
    // Dimensi Grid & Play Area
    const GRID_SIZE = 20; // 20x20 sel
    const CELL_SIZE = 24; // 24px per sel = 480x480
    const OFFSET_X = 160; // Posisi X awal grid di layar 800x600
    const OFFSET_Y = 80;  // Posisi Y awal grid
    const INITIAL_SPEED = 5;
    const MAX_SPEED = 14;

    const user = await getCurrentUser();
    const uid = user ? user.uid : null;

    // State Gameplay
    const state = {
      snake: [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 }
      ],
      direction: { x: 1, y: 0, name: "right" },
      nextDirection: { x: 1, y: 0, name: "right" },
      food: null,
      powerup: null, // { x, y, type: 'slowmo'|'ghost', expires }
      score: 0,
      length: 3,
      speed: INITIAL_SPEED,
      foodEaten: 0,
      isPaused: false,
      isGameOver: false,
      startTime: Date.now(),
      slowmoTimer: 0,
      ghostTimer: 0
    };

    playBgm(k, "bgm-gameplay");

    // Starfield Background
    for (let i = 0; i < 30; i++) {
      k.add([
        k.rect(2, 2),
        k.pos(k.rand(0, 800), k.rand(0, 600)),
        k.color(255, 255, 255),
        k.opacity(k.rand(0.15, 0.5)),
        k.z(-10)
      ]);
    }

    // Border Grid Area
    k.add([
      k.rect(GRID_SIZE * CELL_SIZE + 4, GRID_SIZE * CELL_SIZE + 4),
      k.pos(OFFSET_X - 2, OFFSET_Y - 2),
      k.color(10, 10, 26),
      k.outline(2, k.rgb(34, 197, 94)),
      k.z(1)
    ]);

    // Garis Grid Tipis
    for (let x = 0; x <= GRID_SIZE; x++) {
      k.add([
        k.rect(1, GRID_SIZE * CELL_SIZE),
        k.pos(OFFSET_X + x * CELL_SIZE, OFFSET_Y),
        k.color(255, 255, 255),
        k.opacity(0.04),
        k.z(2)
      ]);
    }
    for (let y = 0; y <= GRID_SIZE; y++) {
      k.add([
        k.rect(GRID_SIZE * CELL_SIZE, 1),
        k.pos(OFFSET_X, OFFSET_Y + y * CELL_SIZE),
        k.color(255, 255, 255),
        k.opacity(0.04),
        k.z(2)
      ]);
    }

    // HUD Header Gameplay
    const scoreText = k.add([
      k.text("SKOR: 0", { size: 18, font: "monospace" }),
      k.pos(OFFSET_X, 45),
      k.color(34, 197, 94),
      k.z(50)
    ]);

    const lengthText = k.add([
      k.text("PANJANG: 3", { size: 18, font: "monospace" }),
      k.pos(OFFSET_X + 140, 45),
      k.color(56, 189, 248),
      k.z(50)
    ]);

    const speedText = k.add([
      k.text("SPEED: 5.0", { size: 18, font: "monospace" }),
      k.pos(OFFSET_X + 280, 45),
      k.color(245, 158, 11),
      k.z(50)
    ]);

    const powerupBadge = k.add([
      k.text("", { size: 16, font: "monospace" }),
      k.pos(OFFSET_X + 390, 45),
      k.color(217, 70, 239),
      k.z(50)
    ]);

    // Kontainer Render Ular & Makanan
    let snakeSegments = [];
    let foodObj = null;
    let powerupObj = null;

    function toPixelPos(gx, gy) {
      return k.vec2(OFFSET_X + gx * CELL_SIZE + CELL_SIZE / 2, OFFSET_Y + gy * CELL_SIZE + CELL_SIZE / 2);
    }

    function renderSnake() {
      snakeSegments.forEach((s) => s.destroy());
      snakeSegments = [];

      state.snake.forEach((seg, idx) => {
        const isHead = idx === 0;
        const color = isHead 
          ? k.rgb(34, 197, 94) 
          : (state.ghostTimer > 0 ? k.rgb(250, 204, 21) : k.rgb(74, 222, 128));
        const opacity = state.ghostTimer > 0 ? 0.6 : (isHead ? 1 : 0.85);

        const s = k.add([
          k.rect(CELL_SIZE - 2, CELL_SIZE - 2, { radius: isHead ? 4 : 2 }),
          k.pos(toPixelPos(seg.x, seg.y)),
          k.anchor("center"),
          k.color(color),
          k.opacity(opacity),
          k.z(10)
        ]);

        if (isHead) {
          s.add([
            k.rect(4, 4),
            k.pos(0, 0),
            k.anchor("center"),
            k.color(15, 23, 42)
          ]);
        }

        snakeSegments.push(s);
      });
    }

    function spawnFood() {
      if (foodObj) foodObj.destroy();

      let validPos = null;
      let attempts = 0;
      while (!validPos && attempts < 150) {
        attempts++;
        const rx = Math.floor(Math.random() * GRID_SIZE);
        const ry = Math.floor(Math.random() * GRID_SIZE);
        const onSnake = state.snake.some((s) => s.x === rx && s.y === ry);
        const onPower = state.powerup && state.powerup.x === rx && state.powerup.y === ry;
        if (!onSnake && !onPower) {
          validPos = { x: rx, y: ry };
        }
      }

      if (!validPos) validPos = { x: 0, y: 0 };
      state.food = validPos;

      foodObj = k.add([
        k.rect(CELL_SIZE - 4, CELL_SIZE - 4, { radius: 3 }),
        k.pos(toPixelPos(validPos.x, validPos.y)),
        k.anchor("center"),
        k.color(168, 85, 247),
        k.outline(2, k.rgb(217, 70, 239)),
        k.z(8)
      ]);
    }

    function spawnPowerup() {
      if (powerupObj) powerupObj.destroy();
      if (Math.random() > 0.12) return; // 12% kemungkinan muncul powerup

      const type = Math.random() < 0.5 ? "slowmo" : "ghost";
      let validPos = null;
      for (let i = 0; i < 50; i++) {
        const rx = Math.floor(Math.random() * GRID_SIZE);
        const ry = Math.floor(Math.random() * GRID_SIZE);
        const onSnake = state.snake.some((s) => s.x === rx && s.y === ry);
        const onFood = state.food && state.food.x === rx && state.food.y === ry;
        if (!onSnake && !onFood) {
          validPos = { x: rx, y: ry };
          break;
        }
      }

      if (!validPos) return;
      state.powerup = { x: validPos.x, y: validPos.y, type, expires: Date.now() + 8000 };

      const col = type === "slowmo" ? k.rgb(56, 189, 248) : k.rgb(250, 204, 21);
      powerupObj = k.add([
        k.rect(CELL_SIZE - 4, CELL_SIZE - 4, { radius: 6 }),
        k.pos(toPixelPos(validPos.x, validPos.y)),
        k.anchor("center"),
        k.color(col),
        k.outline(2, k.rgb(255, 255, 255)),
        k.z(9)
      ]);
    }

    // Handler Perubahan Arah
    function changeDirection(dirName) {
      if (state.isPaused || state.isGameOver) return;
      const cur = state.direction.name;
      if (dirName === "up" && cur !== "down") {
        state.nextDirection = { x: 0, y: -1, name: "up" };
      } else if (dirName === "down" && cur !== "up") {
        state.nextDirection = { x: 0, y: 1, name: "down" };
      } else if (dirName === "left" && cur !== "right") {
        state.nextDirection = { x: -1, y: 0, name: "left" };
      } else if (dirName === "right" && cur !== "left") {
        state.nextDirection = { x: 1, y: 0, name: "right" };
      }
    }

    // Inisialisasi Semua Kontroler
    initInput(k, changeDirection, togglePause);
    const swipeCtrl = initSwipe(changeDirection);
    const mobileCtrl = initMobileController(changeDirection);

    // Pause Modal Logic
    let pausePanel = null;
    function togglePause() {
      if (state.isGameOver) return;
      state.isPaused = !state.isPaused;
      if (state.isPaused) {
        pausePanel = retroPanel(k, k.vec2(400, 300), 320, 180);
        pausePanel.add([
          k.text("GAME DIPAUSET", { size: 22, font: "monospace" }),
          k.pos(0, -35),
          k.anchor("center"),
          k.color(245, 158, 11)
        ]);
        const resBtn = pausePanel.add([
          k.rect(160, 40, { radius: 4 }),
          k.pos(0, 35),
          k.anchor("center"),
          k.color(34, 197, 94),
          k.area()
        ]);
        resBtn.add([
          k.text("LANJUT", { size: 18, font: "monospace" }),
          k.anchor("center"),
          k.color(10, 10, 26)
        ]);
        resBtn.onClick(() => togglePause());
      } else if (pausePanel) {
        pausePanel.destroy();
        pausePanel = null;
      }
    }

    async function triggerGameOver() {
      if (state.isGameOver) return;
      state.isGameOver = true;
      stopBgm();
      playSfx(k, "gameover");
      screenShake(k, 12);

      const duration = (Date.now() - state.startTime) / 1000;
      await saveSnakeScore(uid, state.score, state.length, duration);
      await updateGameStats(uid, duration);

      // Notifikasi ke hub jika embed / opener
      if (typeof window !== "undefined") {
        window.postMessage({
          type: "GAME_EVENT",
          name: "snake_arcade_gameover",
          payload: { score: state.score, length: state.length, duration }
        }, "*");
      }

      k.wait(1.2, () => {
        swipeCtrl.destroy();
        k.go("gameOver", {
          score: state.score,
          length: state.length,
          duration: Math.round(duration)
        });
      });
    }

    // Step Pergerakan Ular
    function step() {
      if (state.isPaused || state.isGameOver) return;

      state.direction = state.nextDirection;
      const head = state.snake[0];
      let nx = head.x + state.direction.x;
      let ny = head.y + state.direction.y;

      // Wrap-around Border Luar Angkasa
      if (nx < 0) nx = GRID_SIZE - 1;
      else if (nx >= GRID_SIZE) nx = 0;
      if (ny < 0) ny = GRID_SIZE - 1;
      else if (ny >= GRID_SIZE) ny = 0;

      // Cek Menabrak Diri Sendiri (kecuali saat mode ghost aktif)
      if (state.ghostTimer <= 0) {
        for (let i = 0; i < state.snake.length - 1; i++) {
          if (state.snake[i].x === nx && state.snake[i].y === ny) {
            triggerGameOver();
            return;
          }
        }
      }

      // Posisi Kepala Baru
      const newHead = { x: nx, y: ny };
      state.snake.unshift(newHead);

      // Cek Makan Food
      if (state.food && nx === state.food.x && ny === state.food.y) {
        state.score += 10;
        state.length += 1;
        state.foodEaten += 1;
        playSfx(k, "eat");
        floatingText(k, "+10", toPixelPos(nx, ny), k.rgb(34, 197, 94));

        if (state.foodEaten % 5 === 0 && state.speed < MAX_SPEED) {
          state.speed += 0.5;
        }

        spawnFood();
        spawnPowerup();
      } else {
        // Hapus ekor jika tidak makan
        state.snake.pop();
      }

      // Cek Makan Powerup
      if (state.powerup && nx === state.powerup.x && ny === state.powerup.y) {
        playSfx(k, "powerup");
        if (state.powerup.type === "slowmo") {
          state.slowmoTimer = 3;
          floatingText(k, "SLOW-MO!", toPixelPos(nx, ny), k.rgb(56, 189, 248));
        } else {
          state.ghostTimer = 5;
          floatingText(k, "GHOST PROTOCOL!", toPixelPos(nx, ny), k.rgb(250, 204, 21));
        }
        state.powerup = null;
        if (powerupObj) {
          powerupObj.destroy();
          powerupObj = null;
        }
      }

      // Update Teks HUD
      scoreText.text = `SKOR: ${state.score}`;
      lengthText.text = `PANJANG: ${state.length}`;
      const effectiveSpd = state.slowmoTimer > 0 ? (state.speed * 0.5) : state.speed;
      speedText.text = `SPEED: ${effectiveSpd.toFixed(1)}`;

      renderSnake();
    }

    // Render Awal
    renderSnake();
    spawnFood();

    // Game Loop dengan Dynamic Timing (Speed)
    let moveAccumulator = 0;
    k.onUpdate(() => {
      if (state.isPaused || state.isGameOver) return;

      const dt = k.dt();

      // Countdown Power-ups
      if (state.slowmoTimer > 0) {
        state.slowmoTimer -= dt;
        if (state.slowmoTimer < 0) state.slowmoTimer = 0;
      }
      if (state.ghostTimer > 0) {
        state.ghostTimer -= dt;
        if (state.ghostTimer < 0) state.ghostTimer = 0;
      }

      // Expire Powerup di grid
      if (state.powerup && Date.now() > state.powerup.expires) {
        state.powerup = null;
        if (powerupObj) {
          powerupObj.destroy();
          powerupObj = null;
        }
      }

      // Update HUD Powerup Badge
      if (state.slowmoTimer > 0) {
        powerupBadge.text = `SLOW: ${Math.ceil(state.slowmoTimer)}s`;
        powerupBadge.color = k.rgb(56, 189, 248);
      } else if (state.ghostTimer > 0) {
        powerupBadge.text = `GHOST: ${Math.ceil(state.ghostTimer)}s`;
        powerupBadge.color = k.rgb(250, 204, 21);
      } else {
        powerupBadge.text = "";
      }

      // Interval pergerakan berdasarkan speed
      const curSpeed = state.slowmoTimer > 0 ? (state.speed * 0.5) : state.speed;
      const stepInterval = 1 / curSpeed;

      moveAccumulator += dt;
      if (moveAccumulator >= stepInterval) {
        moveAccumulator = 0;
        step();
      }
    });
  });
}
