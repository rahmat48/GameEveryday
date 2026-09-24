/**
 * gameplay.js
 * Scene Utama Gameplay Pacman Arcade (Cyber Pacman Protocol):
 * - Grid tile navigation dengan cornering buffer mulus
 * - 4 Sikap AI Hantu (Blinky, Pinky, Inky, Clyde)
 * - Energizer frightened mode & ghost chain scoring (200 - 1600 pts)
 * - Progresi 4 Stage labirin unik, buah kosmik & sinkronisasi Firebase
 */

import { STAGES, isWalkableForPacman, getTileAt } from "../stages.js";
import { GHOST_ARRAY, getGhostTargetTile, getNextGhostDirection } from "../ghostAi.js";
import { initInput } from "../input.js";
import { initSwipe } from "../swipe.js";
import { setDirectionHandler, updateDpadSceneVisibility } from "../mobileController.js";
import { getCurrentUser, savePacmanScore, updateGameStats, loadPacmanProgress } from "../user.js";
import { retroPanel, floatingText, screenShake, flashScreen, burstParticles } from "../ui.js";
import { playSfx, playBgm, stopBgm } from "../audio.js";

export function gameplayScene(k) {
  k.scene("gameplay", async (stageIndex = 0) => {
    const stageData = STAGES[stageIndex % STAGES.length];
    const CELL_SIZE = 16;
    const COLS = 28;
    const ROWS = 31;
    const OFFSET_X = 176;
    const OFFSET_Y = 52;

    const user = await getCurrentUser();
    const uid = user ? user.uid : null;
    const progress = await loadPacmanProgress(uid);

    // ==========================================
    // STATE PERMAINAN
    // ==========================================
    const state = {
      score: window.__pacmanCarryScore || 0,
      highScore: Math.max(progress.highScore || 0, window.__pacmanCarryScore || 0),
      lives: window.__pacmanCarryLives !== undefined ? window.__pacmanCarryLives : 3,
      stageNumber: (stageIndex % STAGES.length) + 1,
      dotsTotal: 0,
      dotsEaten: 0,
      ghostsEatenTotal: window.__pacmanCarryGhosts || 0,
      ghostStreak: 0,
      isPaused: false,
      isGameOver: false,
      isDying: false,
      isStageClear: false,
      readyTimer: 3.0, // countdown sebelum game dimulai
      startTime: window.__pacmanCarryStartTime || Date.now(),
      frightenedTimer: 0,
      globalMode: "scatter",
      modeTimer: 0,
      fruitActive: false,
      fruitTimer: 0,
      fruitSpawned70: false,
      fruitSpawned170: false
    };

    // Bersihkan carryover window state
    window.__pacmanCarryScore = 0;
    window.__pacmanCarryLives = 3;

    // Starfield Background
    for (let i = 0; i < 35; i++) {
      k.add([
        k.rect(k.rand(1, 2), k.rand(1, 2)),
        k.pos(k.rand(0, 800), k.rand(0, 600)),
        k.color(255, 255, 255),
        k.opacity(k.rand(0.1, 0.4)),
        k.z(-10)
      ]);
    }

    // ==========================================
    // RENDER LABIRIN & PELLETS
    // ==========================================
    const wallColor = k.Color.fromHex(stageData.wallColor);
    const dotsMap = new Map(); // key: `${col},${row}` -> { obj, isEnergizer }
    let pacmanSpawn = { col: 13.5, row: 23 };
    let fruitSpawn = { col: 13.5, row: 17 };

    // Background Panel Labirin
    retroPanel(k, {
      pos: k.vec2(OFFSET_X - 4, OFFSET_Y - 4),
      width: COLS * CELL_SIZE + 8,
      height: ROWS * CELL_SIZE + 8,
      borderColor: wallColor,
      bgColor: k.rgb(4, 4, 13),
      z: 0
    });

    for (let r = 0; r < ROWS; r++) {
      const line = stageData.map[r];
      for (let c = 0; c < COLS; c++) {
        const ch = line[c];
        const px = OFFSET_X + c * CELL_SIZE;
        const py = OFFSET_Y + r * CELL_SIZE;

        if (ch === "#") {
          // Tembok Labirin Neon
          k.add([
            k.rect(CELL_SIZE, CELL_SIZE),
            k.pos(px, py),
            k.color(15, 23, 42),
            k.outline(1, wallColor),
            k.z(1)
          ]);
        } else if (ch === "=") {
          // Pintu Gerbang Rumah Hantu
          k.add([
            k.rect(CELL_SIZE, 4),
            k.pos(px, py + 6),
            k.color(244, 114, 182),
            k.z(2)
          ]);
        } else if (ch === ".") {
          // Data Pellet Normal (+10 pts)
          const dot = k.add([
            k.circle(2.5),
            k.pos(px + CELL_SIZE / 2, py + CELL_SIZE / 2),
            k.anchor("center"),
            k.color(254, 240, 138),
            k.z(2)
          ]);
          dotsMap.set(`${c},${r}`, { obj: dot, isEnergizer: false });
          state.dotsTotal++;
        } else if (ch === "O") {
          // Energizer / Power Pellet (+50 pts)
          const energizer = k.add([
            k.circle(6),
            k.pos(px + CELL_SIZE / 2, py + CELL_SIZE / 2),
            k.anchor("center"),
            k.color(255, 255, 255),
            k.z(2)
          ]);
          dotsMap.set(`${c},${r}`, { obj: energizer, isEnergizer: true });
          state.dotsTotal++;
        } else if (ch === "P") {
          pacmanSpawn = { col: c, row: r };
        } else if (ch === "F") {
          fruitSpawn = { col: c, row: r };
        }
      }
    }

    // ==========================================
    // ENTITAS PACMAN
    // ==========================================
    const DIRS = {
      up: { x: 0, y: -1, angle: -Math.PI / 2 },
      down: { x: 0, y: 1, angle: Math.PI / 2 },
      left: { x: -1, y: 0, angle: Math.PI },
      right: { x: 1, y: 0, angle: 0 }
    };

    const pacman = {
      col: pacmanSpawn.col,
      row: pacmanSpawn.row,
      x: OFFSET_X + pacmanSpawn.col * CELL_SIZE + CELL_SIZE / 2,
      y: OFFSET_Y + pacmanSpawn.row * CELL_SIZE + CELL_SIZE / 2,
      dir: DIRS.left,
      bufferedDir: DIRS.left,
      speed: stageData.pacmanSpeed,
      mouthAngle: 0.2,
      mouthSpeed: 10,
      obj: null
    };

    pacman.obj = k.add([
      k.circle(7),
      k.pos(pacman.x, pacman.y),
      k.anchor("center"),
      k.color(250, 204, 21),
      k.z(20)
    ]);

    // ==========================================
    // ENTITAS 4 HANTU CYBER
    // ==========================================
    const ghosts = GHOST_ARRAY.map(cfg => {
      const g = {
        config: cfg,
        col: cfg.spawnOffset.col,
        row: cfg.spawnOffset.row,
        x: OFFSET_X + cfg.spawnOffset.col * CELL_SIZE + CELL_SIZE / 2,
        y: OFFSET_Y + cfg.spawnOffset.row * CELL_SIZE + CELL_SIZE / 2,
        dir: DIRS.up,
        state: cfg.startState, // 'house', 'leaving', 'chase', 'scatter', 'frightened', 'eaten'
        target: { col: 13, row: 11 },
        houseBounceY: 0,
        obj: null,
        eyesObj: null
      };

      g.obj = k.add([
        k.rect(14, 14, { radius: 3 }),
        k.pos(g.x, g.y),
        k.anchor("center"),
        k.color(k.Color.fromHex(cfg.color)),
        k.z(15)
      ]);

      // Pupil Mata Hantu
      g.eyesObj = g.obj.add([
        k.rect(8, 4, { radius: 1 }),
        k.pos(0, -2),
        k.anchor("center"),
        k.color(255, 255, 255)
      ]);

      return g;
    });

    const blinky = ghosts.find(g => g.config.name === "BLINKY");

    // ==========================================
    // ENTITAS BUAH KOSMIK (FRUIT)
    // ==========================================
    const fruitObj = k.add([
      k.text(stageData.fruit.symbol, { size: 14 }),
      k.pos(OFFSET_X + fruitSpawn.col * CELL_SIZE + CELL_SIZE / 2, OFFSET_Y + fruitSpawn.row * CELL_SIZE + CELL_SIZE / 2),
      k.anchor("center"),
      k.opacity(0),
      k.z(10)
    ]);

    // ==========================================
    // HUD SISI KIRI (INFO MISI & SKOR)
    // ==========================================
    const LEFT_HUD_X = 16;
    retroPanel(k, {
      pos: k.vec2(LEFT_HUD_X, OFFSET_Y - 4),
      width: 148,
      height: 496,
      borderColor: wallColor,
      bgColor: k.rgb(10, 10, 26),
      z: 5
    });

    k.add([
      k.text(`STAGE ${state.stageNumber}`, { size: 14, font: "monospace" }),
      k.pos(LEFT_HUD_X + 10, OFFSET_Y + 12),
      k.color(wallColor),
      k.z(6)
    ]);

    k.add([
      k.text(stageData.name, { size: 9, font: "monospace" }),
      k.pos(LEFT_HUD_X + 10, OFFSET_Y + 32),
      k.color(148, 163, 184),
      k.z(6)
    ]);

    k.add([
      k.text("SKOR", { size: 11, font: "monospace" }),
      k.pos(LEFT_HUD_X + 10, OFFSET_Y + 65),
      k.color(148, 163, 184),
      k.z(6)
    ]);

    const scoreLabel = k.add([
      k.text(`${state.score}`, { size: 16, font: "monospace" }),
      k.pos(LEFT_HUD_X + 10, OFFSET_Y + 82),
      k.color(250, 204, 21),
      k.z(6)
    ]);

    k.add([
      k.text("HIGH SCORE", { size: 10, font: "monospace" }),
      k.pos(LEFT_HUD_X + 10, OFFSET_Y + 115),
      k.color(148, 163, 184),
      k.z(6)
    ]);

    const highScoreLabel = k.add([
      k.text(`${state.highScore}`, { size: 14, font: "monospace" }),
      k.pos(LEFT_HUD_X + 10, OFFSET_Y + 132),
      k.color(245, 158, 11),
      k.z(6)
    ]);

    k.add([
      k.text("NYAWA", { size: 11, font: "monospace" }),
      k.pos(LEFT_HUD_X + 10, OFFSET_Y + 170),
      k.color(148, 163, 184),
      k.z(6)
    ]);

    const livesContainer = k.add([
      k.pos(LEFT_HUD_X + 10, OFFSET_Y + 195),
      k.z(6)
    ]);

    function renderLivesIcons() {
      livesContainer.removeAll();
      for (let i = 0; i < state.lives; i++) {
        livesContainer.add([
          k.circle(6),
          k.pos(i * 18 + 6, 0),
          k.anchor("center"),
          k.color(250, 204, 21)
        ]);
      }
    }
    renderLivesIcons();

    k.add([
      k.text("DATA PELLET", { size: 10, font: "monospace" }),
      k.pos(LEFT_HUD_X + 10, OFFSET_Y + 235),
      k.color(148, 163, 184),
      k.z(6)
    ]);

    const dotsCounterLabel = k.add([
      k.text(`0 / ${state.dotsTotal}`, { size: 12, font: "monospace" }),
      k.pos(LEFT_HUD_X + 10, OFFSET_Y + 252),
      k.color(224, 224, 255),
      k.z(6)
    ]);

    // ==========================================
    // HUD SISI KANAN (STATUS HANTU & RADAR)
    // ==========================================
    const RIGHT_HUD_X = 636;
    retroPanel(k, {
      pos: k.vec2(RIGHT_HUD_X, OFFSET_Y - 4),
      width: 148,
      height: 496,
      borderColor: wallColor,
      bgColor: k.rgb(10, 10, 26),
      z: 5
    });

    k.add([
      k.text("STATUS HANTU", { size: 11, font: "monospace" }),
      k.pos(RIGHT_HUD_X + 10, OFFSET_Y + 12),
      k.color(wallColor),
      k.z(6)
    ]);

    const ghostBadges = ghosts.map((g, idx) => {
      const by = OFFSET_Y + 35 + idx * 36;
      k.add([
        k.rect(10, 10, { radius: 2 }),
        k.pos(RIGHT_HUD_X + 12, by + 4),
        k.color(k.Color.fromHex(g.config.color)),
        k.z(6)
      ]);
      const nameTxt = k.add([
        k.text(g.config.name, { size: 9, font: "monospace" }),
        k.pos(RIGHT_HUD_X + 28, by),
        k.color(224, 224, 255),
        k.z(6)
      ]);
      const statusTxt = k.add([
        k.text("PATROL", { size: 8, font: "monospace" }),
        k.pos(RIGHT_HUD_X + 28, by + 12),
        k.color(148, 163, 184),
        k.z(6)
      ]);
      return { ghost: g, statusTxt, nameTxt };
    });

    // Indikator Frightened Mode
    const powerBarHeader = k.add([
      k.text("ENERGIZER", { size: 10, font: "monospace" }),
      k.pos(RIGHT_HUD_X + 10, OFFSET_Y + 200),
      k.color(56, 189, 248),
      k.z(6)
    ]);

    const powerBarBg = k.add([
      k.rect(128, 8, { radius: 2 }),
      k.pos(RIGHT_HUD_X + 10, OFFSET_Y + 218),
      k.color(15, 23, 42),
      k.outline(1, k.rgb(56, 189, 248)),
      k.z(6)
    ]);

    const powerBarFill = powerBarBg.add([
      k.rect(0, 8, { radius: 2 }),
      k.pos(0, 0),
      k.color(56, 189, 248)
    ]);

    // Indikator Buah
    k.add([
      k.text("TARGET BUAH", { size: 10, font: "monospace" }),
      k.pos(RIGHT_HUD_X + 10, OFFSET_Y + 250),
      k.color(148, 163, 184),
      k.z(6)
    ]);

    k.add([
      k.text(`${stageData.fruit.symbol} ${stageData.fruit.name}`, { size: 9, font: "monospace" }),
      k.pos(RIGHT_HUD_X + 10, OFFSET_Y + 268),
      k.color(250, 204, 21),
      k.z(6)
    ]);

    k.add([
      k.text(`+${stageData.fruit.points} PTS`, { size: 10, font: "monospace" }),
      k.pos(RIGHT_HUD_X + 10, OFFSET_Y + 284),
      k.color(245, 158, 11),
      k.z(6)
    ]);

    // Timer Durasi
    k.add([
      k.text("WAKTU MISI", { size: 10, font: "monospace" }),
      k.pos(RIGHT_HUD_X + 10, OFFSET_Y + 325),
      k.color(148, 163, 184),
      k.z(6)
    ]);

    const timerLabel = k.add([
      k.text("00:00", { size: 13, font: "monospace" }),
      k.pos(RIGHT_HUD_X + 10, OFFSET_Y + 342),
      k.color(224, 224, 255),
      k.z(6)
    ]);

    // ==========================================
    // KONTROL INPUT (KEYBOARD, VIRTUAL DPAD, SWIPE)
    // ==========================================
    function onDirectionInput(dirName) {
      if (DIRS[dirName]) {
        pacman.bufferedDir = DIRS[dirName];
      }
    }

    const inputHandler = initInput(k, onDirectionInput, () => {
      state.isPaused = !state.isPaused;
    });
    setDirectionHandler(onDirectionInput);
    initSwipe(onDirectionInput);
    updateDpadSceneVisibility(true);

    // Label "READY!" saat countdown
    const readyLabel = k.add([
      k.text("READY!", { size: 28, font: "monospace" }),
      k.pos(400, 300),
      k.anchor("center"),
      k.color(250, 204, 21),
      k.z(100)
    ]);

    // ==========================================
    // LOGIKA PERGERAKAN PACMAN
    // ==========================================
    function updatePacman(dt) {
      if (state.readyTimer > 0 || state.isPaused || state.isGameOver || state.isDying || state.isStageClear) return;

      const currentSpeed = (state.frightenedTimer > 0) ? pacman.speed * 1.1 : pacman.speed;

      // Animasi mulut mengunyah
      pacman.mouthAngle += pacman.mouthSpeed * dt;

      // Cek apakah pemain ingin membalik arah langsung (180°)
      if (pacman.bufferedDir.x === -pacman.dir.x && pacman.bufferedDir.y === -pacman.dir.y) {
        pacman.dir = pacman.bufferedDir;
      }

      // Hitung koordinat sel saat ini
      const curCol = Math.floor((pacman.x - OFFSET_X) / CELL_SIZE);
      const curRow = Math.floor((pacman.y - OFFSET_Y) / CELL_SIZE);

      const cellCenterX = OFFSET_X + curCol * CELL_SIZE + CELL_SIZE / 2;
      const cellCenterY = OFFSET_Y + curRow * CELL_SIZE + CELL_SIZE / 2;
      const distToCenterX = pacman.x - cellCenterX;
      const distToCenterY = pacman.y - cellCenterY;

      // Cornering: tolerance = kecepatan * 1 frame (16ms) + 2px margin
      const SNAP_TOLERANCE = currentSpeed * 0.018 + 2;
      if (pacman.bufferedDir !== pacman.dir) {
        const canTurnH = (pacman.bufferedDir.x !== 0 && Math.abs(distToCenterY) <= SNAP_TOLERANCE);
        const canTurnV = (pacman.bufferedDir.y !== 0 && Math.abs(distToCenterX) <= SNAP_TOLERANCE);

        if (canTurnH || canTurnV) {
          const tCol = curCol + pacman.bufferedDir.x;
          const tRow = curRow + pacman.bufferedDir.y;
          if (isWalkableForPacman(getTileAt(stageData.map, tCol, tRow))) {
            if (canTurnH) pacman.y = cellCenterY;
            if (canTurnV) pacman.x = cellCenterX;
            pacman.dir = pacman.bufferedDir;
          }
        }
      }

      // Cek apakah jalur di depan terhalang tembok
      const nextCol = curCol + pacman.dir.x;
      const nextRow = curRow + pacman.dir.y;
      const canMoveForward = isWalkableForPacman(getTileAt(stageData.map, nextCol, nextRow));

      if (canMoveForward) {
        pacman.x += pacman.dir.x * currentSpeed * dt;
        pacman.y += pacman.dir.y * currentSpeed * dt;
      } else {
        // Berhenti tepat di center sel agar tidak menembus tembok
        if (pacman.dir.x > 0 && pacman.x < cellCenterX) pacman.x = Math.min(pacman.x + pacman.dir.x * currentSpeed * dt, cellCenterX);
        else if (pacman.dir.x < 0 && pacman.x > cellCenterX) pacman.x = Math.max(pacman.x + pacman.dir.x * currentSpeed * dt, cellCenterX);
        else if (pacman.dir.y > 0 && pacman.y < cellCenterY) pacman.y = Math.min(pacman.y + pacman.dir.y * currentSpeed * dt, cellCenterY);
        else if (pacman.dir.y < 0 && pacman.y > cellCenterY) pacman.y = Math.max(pacman.y + pacman.dir.y * currentSpeed * dt, cellCenterY);
        else {
          if (pacman.dir.x !== 0) pacman.x = cellCenterX;
          if (pacman.dir.y !== 0) pacman.y = cellCenterY;
        }
      }

      // Warp Tunnel Horizontal (Baris 14)
      const tunnelMinX = OFFSET_X - CELL_SIZE;
      const tunnelMaxX = OFFSET_X + COLS * CELL_SIZE;
      if (pacman.x < tunnelMinX) {
        pacman.x = tunnelMaxX - 2;
      } else if (pacman.x > tunnelMaxX) {
        pacman.x = tunnelMinX + 2;
      }

      pacman.col = (pacman.x - OFFSET_X) / CELL_SIZE;
      pacman.row = (pacman.y - OFFSET_Y) / CELL_SIZE;

      pacman.obj.pos = k.vec2(pacman.x, pacman.y);

      // ==========================================
      // MAKAN PELLET & ENERGIZER
      // ==========================================
      const eatCol = Math.round((pacman.x - OFFSET_X - CELL_SIZE / 2) / CELL_SIZE);
      const eatRow = Math.round((pacman.y - OFFSET_Y - CELL_SIZE / 2) / CELL_SIZE);
      const dotKey = `${eatCol},${eatRow}`;

      if (dotsMap.has(dotKey)) {
        const item = dotsMap.get(dotKey);
        dotsMap.delete(dotKey);
        k.destroy(item.obj);
        state.dotsEaten++;

        if (item.isEnergizer) {
          // Energizer Eaten
          state.score += 50;
          state.ghostStreak = 0;
          state.frightenedTimer = stageData.frightenedDuration;
          playSfx("powerup");
          flashScreen(k, k.rgb(56, 189, 248), 0.2);
          burstParticles(k, pacman.obj.pos, k.rgb(255, 255, 255), 10);

          // Seluruh hantu yang tidak berstatus 'eaten' masuk mode ketakutan
          ghosts.forEach(g => {
            if (g.state !== "eaten" && g.state !== "house") {
              g.state = "frightened";
            }
          });
        } else {
          // Normal Dot Eaten
          state.score += 10;
          playSfx("waka");
        }

        // Cek spawn buah di ambang 70 dan 170 dot
        if (state.dotsEaten >= 70 && !state.fruitSpawned70) {
          state.fruitSpawned70 = true;
          spawnBonusFruit();
        }
        if (state.dotsEaten >= 170 && !state.fruitSpawned170) {
          state.fruitSpawned170 = true;
          spawnBonusFruit();
        }

        // Cek Stage Clear
        if (dotsMap.size === 0 && !state.isStageClear) {
          triggerStageClear();
        }
      }

      // Cek Makan Buah Kosmik
      if (state.fruitActive) {
        const fruitPixelX = OFFSET_X + fruitSpawn.col * CELL_SIZE + CELL_SIZE / 2;
        const fruitPixelY = OFFSET_Y + fruitSpawn.row * CELL_SIZE + CELL_SIZE / 2;
        const distFruit = Math.hypot(pacman.x - fruitPixelX, pacman.y - fruitPixelY);
        if (distFruit < 12) {
          state.fruitActive = false;
          fruitObj.opacity = 0;
          state.score += stageData.fruit.points;
          playSfx("fruit");
          floatingText(k, `+${stageData.fruit.points}`, fruitObj.pos, k.rgb(250, 204, 21), 16);
          burstParticles(k, fruitObj.pos, k.Color.fromHex(stageData.fruit.color), 14);
        }
      }
    }

    function spawnBonusFruit() {
      state.fruitActive = true;
      state.fruitTimer = 10; // Aktif selama 10 detik
      fruitObj.opacity = 1;
      floatingText(k, "FRUIT SPAWNED!", fruitObj.pos, k.rgb(56, 189, 248), 12);
    }

    // ==========================================
    // LOGIKA PERGERAKAN HANTU (GHOST AI)
    // ==========================================
    function updateGhosts(dt) {
      if (state.readyTimer > 0 || state.isPaused || state.isGameOver || state.isDying || state.isStageClear) return;

      // Siklus Mode Global Scatter / Chase
      state.modeTimer += dt;
      if (state.globalMode === "scatter" && state.modeTimer > 7) {
        state.globalMode = "chase";
        state.modeTimer = 0;
      } else if (state.globalMode === "chase" && state.modeTimer > 20) {
        state.globalMode = "scatter";
        state.modeTimer = 0;
      }

      ghosts.forEach(ghost => {
        // Cek apakah hantu di dalam rumah sudah boleh keluar
        if (ghost.state === "house") {
          ghost.houseBounceY += dt * 4;
          ghost.y = OFFSET_Y + ghost.config.spawnOffset.row * CELL_SIZE + Math.sin(ghost.houseBounceY) * 3;
          ghost.obj.pos = k.vec2(ghost.x, ghost.y);

          if (state.dotsEaten >= ghost.config.exitDotThreshold) {
            ghost.state = "leaving";
          }
          return;
        }

        if (ghost.state === "leaving") {
          // Meluncur ke pintu gerbang (col: 13.5, row: 11)
          const targetGateX = OFFSET_X + 13.5 * CELL_SIZE;
          const targetGateY = OFFSET_Y + 11 * CELL_SIZE;
          const dx = targetGateX - ghost.x;
          const dy = targetGateY - ghost.y;

          if (Math.abs(dx) > 1) {
            ghost.x += Math.sign(dx) * stageData.ghostSpeed * 0.8 * dt;
          } else if (Math.abs(dy) > 1) {
            ghost.y += Math.sign(dy) * stageData.ghostSpeed * 0.8 * dt;
          } else {
            ghost.state = (state.frightenedTimer > 0) ? "frightened" : state.globalMode;
          }
          ghost.obj.pos = k.vec2(ghost.x, ghost.y);
          return;
        }

        // Tentukan kecepatan hantu berdasarkan state
        let speed = stageData.ghostSpeed;
        if (ghost.state === "frightened") speed *= 0.6;
        if (ghost.state === "eaten") speed *= 2.2;

        const curCol = Math.floor((ghost.x - OFFSET_X) / CELL_SIZE);
        const curRow = Math.floor((ghost.y - OFFSET_Y) / CELL_SIZE);
        const cellCenterX = OFFSET_X + curCol * CELL_SIZE + CELL_SIZE / 2;
        const cellCenterY = OFFSET_Y + curRow * CELL_SIZE + CELL_SIZE / 2;

        const distToCenterX = Math.abs(ghost.x - cellCenterX);
        const distToCenterY = Math.abs(ghost.y - cellCenterY);

        // Jika berada di dekat titik tengah persimpangan, tentukan arah baru
        if (distToCenterX <= 3 && distToCenterY <= 3) {
          ghost.col = curCol;
          ghost.row = curRow;

          // Snap ke center untuk presisi
          ghost.x = cellCenterX;
          ghost.y = cellCenterY;

          const pacTile = {
            x: Math.round((pacman.x - OFFSET_X) / CELL_SIZE),
            y: Math.round((pacman.y - OFFSET_Y) / CELL_SIZE),
            col: Math.round((pacman.x - OFFSET_X) / CELL_SIZE),
            row: Math.round((pacman.y - OFFSET_Y) / CELL_SIZE),
            dir: ghost.dir
          };
          const blinkyTile = blinky ? {
            x: Math.round((blinky.x - OFFSET_X) / CELL_SIZE),
            y: Math.round((blinky.y - OFFSET_Y) / CELL_SIZE)
          } : null;

          ghost.target = getGhostTargetTile(ghost, pacTile, blinkyTile, state.globalMode);
          const nextDir = getNextGhostDirection(ghost, ghost.target, stageData.map, ghost.state === "frightened");

          if (nextDir) {
            ghost.dir = nextDir;
          }

          // Jika hantu mata (eaten) sudah tiba di area rumah hantu
          if (ghost.state === "eaten" && curCol >= 12 && curCol <= 15 && curRow >= 11 && curRow <= 14) {
            ghost.state = "leaving";
          }
        }

        ghost.x += ghost.dir.x * speed * dt;
        ghost.y += ghost.dir.y * speed * dt;

        // Warp tunnel untuk hantu
        const tunnelMinX = OFFSET_X - CELL_SIZE;
        const tunnelMaxX = OFFSET_X + COLS * CELL_SIZE;
        if (ghost.x < tunnelMinX) ghost.x = tunnelMaxX - 2;
        if (ghost.x > tunnelMaxX) ghost.x = tunnelMinX + 2;

        ghost.obj.pos = k.vec2(ghost.x, ghost.y);

        // Update warna visual hantu
        if (ghost.state === "frightened") {
          // Berkedip putih jika durasi frightened hampir habis
          const isFlashing = (state.frightenedTimer < 2 && Math.floor(state.frightenedTimer * 6) % 2 === 0);
          ghost.obj.color = isFlashing ? k.rgb(255, 255, 255) : k.rgb(56, 189, 248);
        } else if (ghost.state === "eaten") {
          ghost.obj.color = k.rgb(15, 23, 42); // Tubuh tak kasat mata (hanya mata)
        } else {
          ghost.obj.color = k.Color.fromHex(ghost.config.color);
        }

        // ==========================================
        // TABRAKAN PACMAN VS HANTU
        // ==========================================
        const distToPacman = Math.hypot(pacman.x - ghost.x, pacman.y - ghost.y);
        if (distToPacman < 12) {
          if (ghost.state === "frightened") {
            // Hantu dimakan oleh Pacman!
            state.ghostStreak++;
            const points = 200 * Math.pow(2, state.ghostStreak - 1);
            state.score += points;
            state.ghostsEatenTotal++;

            ghost.state = "eaten";
            playSfx("eat-ghost");
            floatingText(k, `+${points}`, ghost.obj.pos, k.rgb(250, 204, 21), 16);
            burstParticles(k, ghost.obj.pos, k.rgb(56, 189, 248), 16);
          } else if (ghost.state !== "eaten" && ghost.state !== "house" && ghost.state !== "leaving") {
            // Pacman tertangkap oleh hantu!
            handlePacmanDeath();
          }
        }
      });
    }

    // ==========================================
    // REAKSI KEMATIAN PACMAN
    // ==========================================
    function handlePacmanDeath() {
      if (state.isDying || state.isGameOver) return;
      state.isDying = true;
      state.lives--;
      renderLivesIcons();
      screenShake(k, 8, 0.4);
      playSfx("death");
      burstParticles(k, pacman.obj.pos, k.rgb(250, 204, 21), 20);

      k.wait(1.5, () => {
        if (state.lives <= 0) {
          triggerGameOver();
        } else {
          resetPositions();
          state.isDying = false;
        }
      });
    }

    function resetPositions() {
      pacman.x = OFFSET_X + pacmanSpawn.col * CELL_SIZE + CELL_SIZE / 2;
      pacman.y = OFFSET_Y + pacmanSpawn.row * CELL_SIZE + CELL_SIZE / 2;
      pacman.dir = DIRS.left;
      pacman.bufferedDir = DIRS.left;
      pacman.obj.pos = k.vec2(pacman.x, pacman.y);

      ghosts.forEach(g => {
        g.x = OFFSET_X + g.config.spawnOffset.col * CELL_SIZE + CELL_SIZE / 2;
        g.y = OFFSET_Y + g.config.spawnOffset.row * CELL_SIZE + CELL_SIZE / 2;
        g.dir = DIRS.up;
        g.state = g.config.startState;
        g.obj.pos = k.vec2(g.x, g.y);
      });
    }

    // ==========================================
    // STAGE CLEAR & GAME OVER
    // ==========================================
    function triggerStageClear() {
      state.isStageClear = true;
      playSfx("clear");
      flashScreen(k, k.rgb(34, 197, 94), 0.6);

      k.add([
        k.text("STAGE BERSIH!", { size: 32, font: "monospace" }),
        k.pos(400, 300),
        k.anchor("center"),
        k.color(34, 197, 94),
        k.z(100)
      ]);

      // Bawa state skor & nyawa ke stage berikutnya
      window.__pacmanCarryScore = state.score;
      window.__pacmanCarryLives = state.lives;
      window.__pacmanCarryGhosts = state.ghostsEatenTotal;
      window.__pacmanCarryStartTime = state.startTime;

      k.wait(2.2, () => {
        k.go("gameplay", stageIndex + 1);
      });
    }

    async function triggerGameOver() {
      state.isGameOver = true;
      updateDpadSceneVisibility(false);
      const durationSecs = (Date.now() - state.startTime) / 1000;
      const isNewRecord = state.score > state.highScore;

      // Simpan skor ke Firebase & LocalStorage
      await savePacmanScore(uid, state.score, state.stageNumber, durationSecs, state.dotsEaten, state.ghostsEatenTotal);
      await updateGameStats(uid, durationSecs);

      k.go("gameOver", {
        score: state.score,
        stage: state.stageNumber,
        dotsEaten: state.dotsEaten,
        ghostsEaten: state.ghostsEatenTotal,
        duration: durationSecs,
        isNewRecord,
        stageName: stageData.name
      });
    }

    // ==========================================
    // LOOP UPDATE UTAMA
    // ==========================================
    k.onUpdate(() => {
      const dt = k.dt();
      if (state.isPaused) return;

      // Countdown READY sebelum game mulai
      if (state.readyTimer > 0) {
        state.readyTimer -= dt;
        if (state.readyTimer <= 0) {
          state.readyTimer = 0;
          k.destroy(readyLabel);
          state.startTime = Date.now(); // mulai hitung waktu misi setelah ready
        }
        return;
      }

      // Update timer Frightened
      if (state.frightenedTimer > 0) {
        state.frightenedTimer -= dt;
        powerBarFill.width = (state.frightenedTimer / stageData.frightenedDuration) * 128;
        if (state.frightenedTimer <= 0) {
          ghosts.forEach(g => {
            if (g.state === "frightened") g.state = state.globalMode;
          });
        }
      } else {
        powerBarFill.width = 0;
      }

      // Update timer buah
      if (state.fruitActive) {
        state.fruitTimer -= dt;
        if (state.fruitTimer <= 0) {
          state.fruitActive = false;
          fruitObj.opacity = 0;
        }
      }

      updatePacman(dt);
      updateGhosts(dt);

      // Sinkronisasi HUD
      scoreLabel.text = `${state.score}`;
      if (state.score > state.highScore) {
        state.highScore = state.score;
        highScoreLabel.text = `${state.highScore}`;
      }
      dotsCounterLabel.text = `${state.dotsEaten} / ${state.dotsTotal}`;

      // Update timer durasi
      const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
      const m = Math.floor(elapsed / 60);
      const s = elapsed % 60;
      timerLabel.text = `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;

      // Update badge status hantu
      ghostBadges.forEach(b => {
        b.statusTxt.text = b.ghost.state.toUpperCase();
        b.statusTxt.color = (b.ghost.state === "frightened")
          ? k.rgb(56, 189, 248)
          : (b.ghost.state === "eaten")
            ? k.rgb(239, 68, 68)
            : k.rgb(148, 163, 184);
      });
    });

    k.onSceneLeave(() => {
      updateDpadSceneVisibility(false);
      if (inputHandler && typeof inputHandler.destroy === "function") {
        inputHandler.destroy();
      }
    });
  });
}
