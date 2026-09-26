/**
 * gameplay.js
 * Scene Utama Gameplay Pulse Runner: Gravity Flip, Pattern Spawner,
 * Fuel System, Combo Multiplier, Power-ups, Near-Miss & Laser Gate.
 */

import { makeBar, floatingText, screenShake, flashScreen, getGameThemeColors } from "../ui.js";
import { playSfx, playBgm, stopBgm } from "../audio.js";
import { getCurrentUser, saveRunnerScore, updateGameStats } from "../user.js";
import { CHUNK_W, pickPattern } from "../patterns.js";

// ── Konstanta Fisika & Tunnel ──
const FLOOR_Y = 520;
const CEIL_Y = 80;
const SHIP_X = 160;
const GRAVITY = 2600;
const MAX_VY = 1200;
const BASE_SPEED = 280;
const MAX_SPEED = 620;
const FLIP_COOLDOWN = 0.12;

export function gameplayScene(k) {
  k.scene("gameplay", async () => {
    document.body.classList.add("in-gameplay");
    const theme = getGameThemeColors(k);

    const user = await getCurrentUser();
    const uid = user ? user.uid : null;

    const state = {
      dist: 0,          // pixel world yang sudah dilewati (10px = 1m)
      score: 0,
      speed: BASE_SPEED,
      g: 1,             // gravitasi: 1 = lantai, -1 = plafon
      vy: 0,
      fuel: 100,
      combo: 0,
      comboTimer: 0,
      mult: 1,
      bestCombo: 1,
      phase: 0,
      magnet: 0,
      slowmo: 0,
      canFlipAt: 0,
      isPaused: false,
      dead: false,
      lastPatternId: null,
      prevPatternId: null,
      startTime: Date.now()
    };

    playBgm(k, "bgm-gameplay");

    // ─────────────────────────────────────────────
    // BACKGROUND PARALLAX (3 lapis)
    // ─────────────────────────────────────────────
    const stars = [];
    for (let i = 0; i < 45; i++) {
      stars.push(k.add([
        k.rect(k.rand(1, 3), k.rand(1, 3)),
        k.pos(k.rand(0, 800), k.rand(0, 600)),
        k.color(255, 255, 255),
        k.opacity(k.rand(0.15, 0.6)),
        k.z(-20)
      ]));
    }

    const midLines = [];
    for (let i = 0; i < 10; i++) {
      midLines.push(k.add([
        k.rect(2, 380),
        k.pos(i * 90, 100),
        k.color(theme.primary),
        k.opacity(0.08),
        k.z(-15)
      ]));
    }

    const pipes = [];
    for (let i = 0; i < 5; i++) {
      pipes.push(k.add([
        k.rect(18, k.rand(60, 160), { radius: 4 }),
        k.pos(k.rand(0, 800), k.rand(140, 420)),
        k.color(15, 23, 42),
        k.outline(1, theme.border),
        k.opacity(0.25),
        k.z(-12)
      ]));
    }

    // ── Tunnel Walls ──
    k.add([k.rect(800, CEIL_Y), k.pos(0, 0), k.color(10, 15, 30), k.z(-8)]);
    k.add([k.rect(800, 600 - FLOOR_Y), k.pos(0, FLOOR_Y), k.color(10, 15, 30), k.z(-8)]);
    k.add([k.rect(800, 4), k.pos(0, CEIL_Y - 2), k.color(theme.primary), k.opacity(0.9), k.z(-7)]);
    k.add([k.rect(800, 4), k.pos(0, FLOOR_Y - 2), k.color(theme.primary), k.opacity(0.9), k.z(-7)]);

    const wallTicks = [];
    for (let i = 0; i < 14; i++) {
      wallTicks.push(k.add([k.rect(22, 3), k.pos(i * 60, FLOOR_Y + 16), k.color(51, 65, 85), k.z(-6)]));
    }

    // ─────────────────────────────────────────────
    // KAPAL (PLAYER)
    // ─────────────────────────────────────────────
    const ship = k.add([
      k.rect(36, 18, { radius: 4 }),
      k.outline(2, k.WHITE),
      k.color(0, 212, 255),
      k.pos(SHIP_X, FLOOR_Y - 11),
      k.anchor("center"),
      k.rotate(0),
      k.area({ width: 26, height: 12 }),
      "ship"
    ]);

    ship.add([
      k.rect(10, 8, { radius: 2 }),
      k.pos(20, 0),
      k.anchor("center"),
      k.color(255, 255, 255),
      k.opacity(0.85)
    ]);
    const flame = ship.add([
      k.rect(10, 6),
      k.pos(-24, 0),
      k.anchor("center"),
      k.color(245, 158, 11),
      k.opacity(0.9)
    ]);

    // ─────────────────────────────────────────────
    // HUD
    // ─────────────────────────────────────────────
    const fuelBar = makeBar(k, k.vec2(22, 34), 100, 190, 16, "FUEL");

    const distLabel = k.add([
      k.text("0 M", { size: 22, font: "monospace" }),
      k.pos(400, 26),
      k.anchor("center"),
      k.color(245, 158, 11),
      k.z(50)
    ]);

    const scoreLabel = k.add([
      k.text("SKOR: 0", { size: 20, font: "monospace" }),
      k.pos(778, 26),
      k.anchor("topright"),
      k.color(224, 224, 255),
      k.z(50)
    ]);

    const comboLabel = k.add([
      k.text("", { size: 16, font: "monospace" }),
      k.pos(778, 52),
      k.anchor("topright"),
      k.color(theme.secondary),
      k.z(50)
    ]);

    const powerLabel = k.add([
      k.text("", { size: 13, font: "monospace" }),
      k.pos(22, 578),
      k.color(theme.cyan),
      k.z(50)
    ]);

    // ─────────────────────────────────────────────
    // WORLD SCROLL — semua entity bergerak ke kiri
    // ─────────────────────────────────────────────
    k.onUpdate("scrolls", (e) => {
      const sp = state.speed * (state.slowmo > 0 ? 0.6 : 1);
      e.pos.x -= sp * (e.scrollFactor || 1) * k.dt();
      if (e.pos.x < -140) e.destroy();
    });

    // ─────────────────────────────────────────────
    // SPAWN HELPERS
    // ─────────────────────────────────────────────
    function spawnOrb(x, y) {
      const o = k.add([
        k.circle(8),
        k.outline(2, theme.secondary),
        k.color(theme.primary),
        k.pos(x, y),
        k.anchor("center"),
        k.area({ radius: 13 }),
        k.z(6),
        "orb", "scrolls"
      ]);
      o.baseY = y;
      o.phase = k.rand(0, Math.PI * 2);
      o.onUpdate(() => {
        o.pos.y = o.baseY + Math.sin(k.time() * 3 + o.phase) * 4;
        if (state.magnet > 0) {
          const d = ship.pos.sub(o.pos);
          if (d.length() < 170) o.pos = o.pos.add(d.unit().scale(260 * k.dt()));
        }
      });
      return o;
    }

    function spawnFuelCell(x) {
      const lanes = [FLOOR_Y - 60, (FLOOR_Y + CEIL_Y) / 2, CEIL_Y + 60];
      const y = lanes[Math.floor(k.rand(0, 3))];
      const f = k.add([
        k.rect(14, 22, { radius: 3 }),
        k.outline(2, k.rgb(34, 197, 94)),
        k.color(16, 185, 129),
        k.pos(x, y),
        k.anchor("center"),
        k.area({ radius: 16 }),
        k.z(6),
        "fuelcell", "scrolls"
      ]);
      f.add([k.text("+", { size: 16, font: "monospace" }), k.pos(0, 0), k.anchor("center"), k.color(0, 0, 0)]);
      f.onUpdate(() => { f.opacity = 0.75 + Math.sin(k.time() * 6) * 0.25; });
    }

    function spawnPowerUp(x) {
      const types = [
        { id: "phase", glyph: ">>", color: k.rgb(0, 212, 255), dur: 5 },
        { id: "magnet", glyph: "@", color: k.rgb(168, 85, 247), dur: 7 },
        { id: "slowmo", glyph: "~", color: k.rgb(245, 158, 11), dur: 4 }
      ];
      const t = types[Math.floor(k.rand(0, 3))];
      const y = k.rand(CEIL_Y + 80, FLOOR_Y - 80);
      const p = k.add([
        k.circle(14),
        k.outline(2, t.color),
        k.color(15, 23, 42),
        k.pos(x, y),
        k.anchor("center"),
        k.area({ radius: 18 }),
        k.z(6),
        "powerup", "scrolls"
      ]);
      p.powerId = t.id;
      p.powerDur = t.dur;
      p.add([
        k.text(t.glyph, { size: 14, font: "monospace" }),
        k.pos(0, 0),
        k.anchor("center"),
        k.color(t.color)
      ]);
      p.onUpdate(() => { p.angle = Math.sin(k.time() * 4) * 12; });
    }

    function spawnLaserGate(x0, ox, side, telegraph, active) {
      const beamH = FLOOR_Y - CEIL_Y;
      const gate = k.add([
        k.pos(x0 + ox, side === "F" ? FLOOR_Y : CEIL_Y),
        k.anchor("center"),
        "scrolls", "laserGate"
      ]);
      gate.telegraph = telegraph || 0.5;
      gate.activeDur = active || 0.45;
      gate.t = k.rand(0, 1.2);

      gate.add([k.rect(30, 16, { radius: 3 }), k.pos(0, 0), k.color(15, 23, 42), k.outline(1.5, theme.border)]);
      const dot = gate.add([k.circle(4), k.pos(0, side === "F" ? -3 : 3), k.color(239, 68, 68)]);

      const warn = gate.add([
        k.rect(4, beamH),
        k.pos(0, side === "F" ? -beamH / 2 : beamH / 2),
        k.color(239, 68, 68),
        k.opacity(0.2),
        k.z(7)
      ]);

      const beam = gate.add([
        k.rect(14, beamH),
        k.pos(0, side === "F" ? -beamH / 2 : beamH / 2),
        k.color(255, 90, 60),
        k.opacity(0),
        k.area({ width: 14, height: beamH }),
        k.z(8),
        "hazard"
      ]);
      beam.hazardKind = "laser";
      beam.area().enabled = false;

      gate.onUpdate(() => {
        if (state.isPaused || state.dead) return;
        const period = gate.telegraph + gate.activeDur + 0.5;
        const ph = gate.t % period;
        if (ph < gate.telegraph) {
          dot.color = k.rgb(239, 68, 68);
          warn.opacity = 0.25 + Math.sin(ph * 35) * 0.2;
          beam.opacity = 0;
          beam.area().enabled = false;
        } else if (ph < gate.telegraph + gate.activeDur) {
          dot.color = k.rgb(255, 255, 255);
          warn.opacity = 0.1;
          beam.opacity = 0.95;
          beam.area().enabled = true;
        } else {
          dot.color = k.rgb(34, 197, 94);
          warn.opacity = 0.08;
          beam.opacity = 0;
          beam.area().enabled = false;
        }
        gate.t += k.dt();
      });
    }

    // SPAWN CHUNK POLA
    function spawnChunk(x0) {
      const meters = state.dist / 10;
      const pattern = pickPattern(meters, state.lastPatternId, state.prevPatternId);
      state.prevPatternId = state.lastPatternId;
      state.lastPatternId = pattern.id;

      if (pattern.blocks) {
        for (const [ox, side, h] of pattern.blocks) {
          const b = k.add([
            k.rect(46, h, { radius: 3 }),
            k.color(30, 41, 59),
            k.outline(2, theme.border),
            k.pos(x0 + ox, side === "F" ? FLOOR_Y : CEIL_Y),
            k.anchor(side === "F" ? "bot" : "top"),
            k.area(),
            k.z(5),
            "hazard", "scrolls"
          ]);
          b.hazardKind = "block";
          b.add([k.rect(8, Math.max(6, h - 12)), k.pos(0, 0), k.color(15, 23, 42)]);
        }
      }

      if (pattern.mines) {
        for (const [ox, yAbs] of pattern.mines) {
          const m = k.add([
            k.circle(10),
            k.color(239, 68, 68),
            k.outline(2, k.rgb(127, 29, 29)),
            k.pos(x0 + ox, yAbs),
            k.anchor("center"),
            k.area({ radius: 11 }),
            k.z(6),
            "hazard", "scrolls", "mine"
          ]);
          m.hazardKind = "mine";
          for (let i = 0; i < 4; i++) {
            m.add([k.rect(20, 3), k.pos(0, 0), k.rotate(i * 45), k.color(127, 29, 29)]);
          }
          m.onUpdate(() => { m.angle += 120 * k.dt(); });
        }
      }

      if (pattern.laser) {
        spawnLaserGate(x0, pattern.laser.x, pattern.laser.side, pattern.laser.telegraph, pattern.laser.active);
      }

      if (pattern.orbs) {
        for (const [ox, lane] of pattern.orbs) {
          const y = lane === 1 ? FLOOR_Y - 46 : lane === -1 ? CEIL_Y + 46 : (FLOOR_Y + CEIL_Y) / 2;
          spawnOrb(x0 + ox, y);
        }
      }
    }

    // ─────────────────────────────────────────────
    // INPUT — SATU TOMBOL FLIP (desktop + touch)
    // ─────────────────────────────────────────────
    let flipBuffer = 0;
    function tryFlip() {
      if (state.dead || state.isPaused) return;
      if (k.time() < state.canFlipAt) { flipBuffer = k.time(); return; }
      state.canFlipAt = k.time() + FLIP_COOLDOWN;
      state.g *= -1;
      state.vy = 0;
      playSfx(k, "flip");
      // Rotasi kapal: interpolate angle dari 0→180° atau sebaliknya
      const startAngle = typeof ship.angle === 'number' ? ship.angle : (state.g === 1 ? 0 : 180);
      const endAngle = state.g === 1 ? 0 : 180;
      k.tween(startAngle, endAngle, 0.14, (a) => { ship.angle = a; }, k.easings.easeOutQuad);
      ship.scale = k.vec2(1); // reset scale dulu untuk konsistensi
    }
    k.onKeyPress("space", tryFlip);
    k.onKeyPress("up", tryFlip);
    k.onMousePress("left", tryFlip);
    k.onTouchStart(tryFlip);

    // Tombol FLIP pada HUD mobile (index.html men-dispatch event ini).
    const onFlipBtn = () => tryFlip();
    window.addEventListener("pulse-flip", onFlipBtn);
    k.onSceneLeave(() => window.removeEventListener("pulse-flip", onFlipBtn));

    //─ PAUSE ──
    const pauseLayer = k.add([k.rect(800, 600), k.pos(0, 0), k.color(0, 0, 0), k.opacity(0.6), k.z(90)]);
    const pauseText = pauseLayer.add([
      k.text("JEDA — TEKAN P / ESC", { size: 22, font: "monospace" }),
      k.pos(400, 300),
      k.anchor("center"),
      k.color(245, 158, 11)
    ]);
    pauseLayer.hidden = true;
    function togglePause() {
      if (state.dead) return;
      state.isPaused = !state.isPaused;
      pauseLayer.hidden = !state.isPaused;
    }
    k.onKeyPress("p", togglePause);
    k.onKeyPress("escape", togglePause);

    // ─────────────────────────────────────────────
    // COLLISION
    // ─────────────────────────────────────────────
    function addScore(base, x, y, color, txt) {
      state.score += base;
      floatingText(k, txt, k.vec2(x, y), color);
    }

    ship.onCollide("orb", (o) => {
      o.destroy();
      state.combo++;
      state.comboTimer = 1.5;
      state.mult = Math.min(8, 1 + Math.floor(state.combo / 3));
      state.bestCombo = Math.max(state.bestCombo, state.mult);
      addScore(50 * state.mult, o.pos.x, o.pos.y, theme.primary, `+${50 * state.mult}`);
      playSfx(k, "orb");
    });

    ship.onCollide("fuelcell", (f) => {
      f.destroy();
      state.fuel = Math.min(100, state.fuel + 18);
      addScore(100, f.pos.x, f.pos.y, k.rgb(16, 185, 129), "+FUEL 100");
      playSfx(k, "fuel");
    });

    ship.onCollide("powerup", (p) => {
      p.destroy();
      state[p.powerId] = p.powerDur;
      const names = { phase: "PHASE SHIFT!", magnet: "ORB MAGNET!", slowmo: "SLOW-MO!" };
      floatingText(k, names[p.powerId], ship.pos.add(k.vec2(0, -40)), theme.cyan);
      playSfx(k, "powerup");
    });

    ship.onCollide("hazard", (h) => {
      if (state.dead) return;
      // Laser hanya berbahaya saat beam menyala
      if (h.hazardKind === "laser" && h.opacity < 0.5) return;
      if (state.phase > 0) {
        // Phase Shift: hancurkan hazard, konsumsi shield
        state.phase = 0;
        h.destroy();
        addScore(25, h.pos.x, h.pos.y, theme.cyan, "PHASE +25");
        playSfx(k, "nearmiss");
        return;
      }
      die(h.hazardKind === "mine" ? "RANJAP DATA" : h.hazardKind === "laser" ? "GERBANG LASER" : "DINDING TUNNEL");
    });

    // ─────────────────────────────────────────────
    // DEATH & SAVE
    // ─────────────────────────────────────────────
    function die(reason) {
      if (state.dead) return;
      state.dead = true;
      stopBgm();
      playSfx(k, "gameover");
      screenShake(k, 12);
      flashScreen(k, k.rgb(239, 68, 68));
      ship.hidden = true;

      // Ledakan partikel prosedural
      for (let i = 0; i < 24; i++) {
        const p = k.add([
          k.rect(k.rand(3, 7), k.rand(3, 7)),
          k.pos(ship.pos),
          k.color(i % 2 === 0 ? 0 : 245, i % 2 === 0 ? 212 : 158, i % 2 === 0 ? 255 : 11),
          k.opacity(1),
          k.z(60)
        ]);
        const dir = k.Vec2.fromAngle(k.rand(0, 360));
        const dist = k.rand(40, 160);
        k.tween(p.pos, p.pos.add(dir.scale(dist)), k.rand(0.4, 0.9), (v) => { p.pos = v; }, k.easings.easeOutQuad);
        k.tween(1, 0, 0.9, (v) => { p.opacity = v; });
        k.wait(0.95, () => p.destroy());
      }

      const distance = state.dist / 10;
      const duration = Math.round((Date.now() - state.startTime) / 1000);

      saveRunnerScore(uid, state.score, distance, state.bestCombo);
      updateGameStats(uid, duration);

      try {
        if (window.parent !== window) {
          window.parent.postMessage({
            type: "GAME_EVENT",
            name: "pulse_runner_death",
            payload: { score: state.score, distance: Math.round(distance) }
          }, "*");
        }
      } catch (e) {}

      k.wait(1.2, () => {
        k.go("gameOver", {
          score: state.score,
          distance: Math.round(distance),
          bestCombo: state.bestCombo,
          duration,
          reason
        });
      });
    }

    // ─────────────────────────────────────────────
    // GAME LOOP UTAMA
    // ─────────────────────────────────────────────
    let spawnAcc = 0;
    let nextGap = 0;
    let fuelTimer = k.rand(6, 9);
    let powerTimer = 12;
    let lastMilestone = 0;

    k.onUpdate(() => {
      if (state.isPaused || state.dead) return;
      const dt = k.dt();
      const effSpeed = state.speed * (state.slowmo > 0 ? 0.6 : 1);

      // ── Gravitasi & posisi kapal ──
      state.vy = Math.min(MAX_VY, state.vy + GRAVITY * dt);
      ship.pos.y += state.g * state.vy * dt;
      const floorLimit = FLOOR_Y - 11;
      const ceilLimit = CEIL_Y + 11;
      if (state.g === 1 && ship.pos.y >= floorLimit) { ship.pos.y = floorLimit; state.vy = 0; }
      if (state.g === -1 && ship.pos.y <= ceilLimit) { ship.pos.y = ceilLimit; state.vy = 0; }

      // Eksekusi flip yang ter-buffer
      if (flipBuffer && k.time() - flipBuffer > 0.1 && k.time() >= state.canFlipAt) {
        flipBuffer = 0;
        tryFlip();
      }

      // ── Progresi jarak, kecepatan, fuel ──
      state.dist += effSpeed * dt;
      const meters = state.dist / 10;
      state.speed = Math.min(MAX_SPEED, BASE_SPEED + Math.floor(meters / 500) * 40);
      state.fuel -= dt * (meters > 1500 ? 5.85 : 4.5);
      if (state.fuel <= 0) { state.fuel = 0; die("BAHAN BAKAR HABIS"); return; }

      // ── Timer status ──
      if (state.comboTimer > 0) {
        state.comboTimer -= dt;
        if (state.comboTimer <= 0) { state.combo = 0; state.mult = 1; }
      }
      for (const pw of ["phase", "magnet", "slowmo"]) {
        if (state[pw] > 0) state[pw] = Math.max(0, state[pw] - dt);
      }

      // ── Milestone & spawner ──
      const milestone = Math.floor(meters / 500);
      if (milestone > lastMilestone && milestone > 0) {
        lastMilestone = milestone;
        addScore(250, SHIP_X + 80, ship.pos.y - 40, k.rgb(245, 158, 11), `${milestone * 500}M +250`);
      }

      spawnAcc += effSpeed * dt;
      if (spawnAcc >= nextGap) {
        spawnAcc = 0;
        const pressure = Math.min(1, meters / 2500);
        nextGap = CHUNK_W + k.rand(50, 160) * (1 - pressure * 0.55);
        spawnChunk(900);
      }

      fuelTimer -= dt;
      if (fuelTimer <= 0) {
        fuelTimer = k.rand(7, 11);
        spawnFuelCell(880);
      }
      powerTimer -= dt;
      if (powerTimer <= 0) {
        powerTimer = k.rand(14, 22);
        if (meters > 800) spawnPowerUp(880);
      }

      // ── Parallax background ──
      for (const s of stars) { s.pos.x -= effSpeed * 0.12 * dt; if (s.pos.x < 0) { s.pos.x = 800; s.pos.y = k.rand(0, 600); } }
      for (const l of midLines) { l.pos.x -= effSpeed * 0.3 * dt; if (l.pos.x < -4) l.pos.x = 804; }
      for (const p of pipes) { p.pos.x -= effSpeed * 0.55 * dt; if (p.pos.x < -30) { p.pos.x = 820; p.pos.y = k.rand(140, 420); } }
      for (const t of wallTicks) { t.pos.x -= effSpeed * dt; if (t.pos.x < -30) t.pos.x += 840; }

      // ── Near-miss tracker ──
      for (const h of k.get("hazard")) {
        if (h.nmPassed || !h.pos) continue;
        if (h.pos.x < SHIP_X - 10) {
          h.nmPassed = true;
          if (h.hazardKind !== "laser" && Math.abs(h.pos.y - ship.pos.y) < 52) {
            state.score += 75;
            floatingText(k, "NEAR MISS +75", k.vec2(SHIP_X, ship.pos.y - 52), theme.secondary);
            playSfx(k, "nearmiss");
          }
        }
      }

      // ── Efek visual kapal ──
      ship.color = state.phase > 0 ? k.rgb(0, 212, 255) : state.g === 1 ? k.rgb(0, 212, 255) : k.rgb(255, 255, 255);
      if (state.phase > 0) ship.opacity = 0.55 + Math.sin(k.time() * 14) * 0.25;
      else ship.opacity = 1;
      flame.width = 6 + (effSpeed / MAX_SPEED) * 14;
      flame.opacity = 0.5 + k.rand(0, 0.4);

      // ── HUD ──
      distLabel.text = `${Math.floor(meters)} M`;
      scoreLabel.text = `SKOR: ${state.score}`;
      comboLabel.text = state.mult > 1 ? `COMBO x${state.mult}` : "";
      fuelBar.setValue(state.fuel);
      const parts = [];
      if (state.phase > 0) parts.push(`PHASE ${state.phase.toFixed(1)}s`);
      if (state.magnet > 0) parts.push(`MAGNET ${state.magnet.toFixed(1)}s`);
      if (state.slowmo > 0) parts.push(`SLOW ${state.slowmo.toFixed(1)}s`);
      powerLabel.text = parts.join("  |  ");
    });
  });
}
