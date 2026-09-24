/**
 * gameplay.js
 * Scene Utama Gameplay Orbit Defender: 360° Turret, Bullet Pooling, Enemy Waves, EMP Superweapon.
 */

import { makeHpBar, floatingText, screenShake, flashScreen } from "../ui.js";
import { playSfx, playBgm, stopBgm } from "../audio.js";
import { getCurrentUser, saveDefenderScore, updateGameStats } from "../user.js";

export function gameplayScene(k) {
  k.scene("gameplay", async () => {
    const CENTER = k.vec2(400, 300);
    const CORE_RADIUS = 30;

    const user = await getCurrentUser();
    const uid = user ? user.uid : null;

    // State Gameplay
    const state = {
      score: 0,
      hp: 100,
      maxHp: 100,
      wave: 1,
      empBombs: 1,
      kills: 0,
      waveKills: 0,
      killsRequiredForWave: 12,
      isPaused: false,
      isGameOver: false,
      bossActive: false,    // Indikator status bos aktif
      startTime: Date.now(),
      aimAngle: 0,
      canShoot: true,
      shootCooldown: 0.18,
      tripleTimer: 0,       // Timer aktif Triple Shot
      destroyerTimer: 0,    // Timer aktif Instant Destroyer
      plasmaNovaTimer: 0    // Timer aktif Plasma Nova (tembakan 360 ring)
    };

    playBgm(k, "bgm-gameplay");

    // Starfield Background Dinamis
    const stars = [];
    for (let i = 0; i < 50; i++) {
      const s = k.add([
        k.rect(k.rand(1, 3), k.rand(1, 3)),
        k.pos(k.rand(0, 800), k.rand(0, 600)),
        k.color(255, 255, 255),
        k.opacity(k.rand(0.2, 0.7)),
        k.z(-10)
      ]);
      stars.push(s);
    }

    // Orbit Ring Visual Guide
    for (const r of [80, 160, 240, 320]) {
      k.add([
        k.circle(r),
        k.pos(CENTER),
        k.anchor("center"),
        k.color(0, 0, 0),
        k.outline(1, k.rgb(34, 197, 94)),
        k.opacity(0.12),
        k.z(-5)
      ]);
    }

    // Central Station Core (Visual Stasiun Luar Angkasa Berlapis & Modern)
    const coreGlow = k.add([
      k.circle(CORE_RADIUS + 8),
      k.pos(CENTER),
      k.anchor("center"),
      k.color(0, 212, 255),
      k.opacity(0.25),
      k.z(10)
    ]);

    // Shield Energy Ring Luar dengan Gap Aksen
    const shieldRing = k.add([
      k.circle(CORE_RADIUS + 2),
      k.pos(CENTER),
      k.anchor("center"),
      k.color(10, 15, 30),
      k.outline(2, k.rgb(34, 197, 94)),
      k.z(11)
    ]);

    // Cincin Detail Reaktor
    k.add([
      k.circle(CORE_RADIUS - 6),
      k.pos(CENTER),
      k.anchor("center"),
      k.color(15, 23, 42),
      k.outline(1, k.rgb(0, 212, 255)),
      k.z(12)
    ]);

    // 4 Lampu Beacon Stasiun di 4 Sudut Mata Angin
    const beacons = [];
    for (let i = 0; i < 4; i++) {
      const bAngle = (i * Math.PI) / 2;
      const bDist = CORE_RADIUS - 2;
      const b = k.add([
        k.circle(2.5),
        k.pos(CENTER.x + Math.cos(bAngle) * bDist, CENTER.y + Math.sin(bAngle) * bDist),
        k.anchor("center"),
        k.color(34, 197, 94),
        k.z(13)
      ]);
      beacons.push(b);
    }

    // Turret Base Mount (Rotator Bawah)
    const turretMount = k.add([
      k.circle(15),
      k.pos(CENTER),
      k.anchor("center"),
      k.color(30, 41, 59),
      k.outline(1.5, k.rgb(148, 163, 184)),
      k.z(14)
    ]);

    // Dual Heavy Barrel (Laras Kembar Modern)
    const turretBarrel = k.add([
      k.rect(36, 11, { radius: 3 }),
      k.pos(CENTER),
      k.anchor(k.vec2(0, 0.5)),
      k.color(15, 23, 42),
      k.outline(1.5, k.rgb(0, 212, 255)),
      k.rotate(0),
      k.z(16)
    ]);

    // Laras Atas & Bawah (Detail Twin Rail)
    turretBarrel.add([
      k.rect(32, 2),
      k.pos(2, -2.5),
      k.anchor("left"),
      k.color(0, 212, 255)
    ]);
    turretBarrel.add([
      k.rect(32, 2),
      k.pos(2, 2.5),
      k.anchor("left"),
      k.color(0, 212, 255)
    ]);

    // Turret Dome Center (Kubah Kokpit Bercahaya)
    const turretDome = k.add([
      k.circle(9),
      k.pos(CENTER),
      k.anchor("center"),
      k.color(0, 212, 255),
      k.outline(2, k.rgb(255, 255, 255)),
      k.z(18)
    ]);
    turretDome.add([
      k.circle(4),
      k.pos(0, 0),
      k.anchor("center"),
      k.color(255, 255, 255)
    ]);

    // HUD Elements
    const hpBar = makeHpBar(k, k.vec2(25, 22), 100, 180, 16);

    k.add([
      k.text("INTI PANGKALAN", { size: 12, font: "monospace" }),
      k.pos(25, 8),
      k.color(34, 197, 94),
      k.fixed ? k.fixed() : k.z(50),
      k.z(50)
    ]);

    const waveLabel = k.add([
      k.text("WAVE 1", { size: 20, font: "monospace" }),
      k.pos(400, 25),
      k.anchor("center"),
      k.color(245, 158, 11),
      k.fixed ? k.fixed() : k.z(50),
      k.z(50)
    ]);

    const scoreLabel = k.add([
      k.text("SKOR: 0", { size: 20, font: "monospace" }),
      k.pos(775, 25),
      k.anchor("topright"),
      k.color(224, 224, 255),
      k.fixed ? k.fixed() : k.z(50),
      k.z(50)
    ]);

    const empLabel = k.add([
      k.text("BOM EMP: 1 [Tekan B]", { size: 14, font: "monospace" }),
      k.pos(400, 570),
      k.anchor("center"),
      k.color(0, 212, 255),
      k.fixed ? k.fixed() : k.z(50),
      k.z(50)
    ]);

    const abilityLabel = k.add([
      k.text("", { size: 14, font: "monospace" }),
      k.pos(400, 540),
      k.anchor("center"),
      k.color(245, 158, 11),
      k.fixed ? k.fixed() : k.z(50),
      k.z(50)
    ]);

    // Wadah Proyektil & Musuh & Powerup
    const bullets = [];
    const enemies = [];
    const particles = [];
    const powerupDrops = [];

    // Aim Tracking
    function updateAim(targetPos) {
      if (state.isPaused || state.isGameOver) return;
      const dx = targetPos.x - CENTER.x;
      const dy = targetPos.y - CENTER.y;
      state.aimAngle = Math.atan2(dy, dx);
      turretBarrel.angle = k.rad2deg(state.aimAngle);
    }

    k.onMouseMove((mpos) => {
      updateAim(mpos);
    });

    // Menembakkan Peluru Laser (Mendukung Multi-Buff Combo)
    function shootBullet() {
      if (state.isPaused || state.isGameOver || !state.canShoot) return;
      state.canShoot = false;

      playSfx(k, "shoot");

      const barrelLen = 34;
      const hasTriple = state.tripleTimer > 0;
      const hasDestroyer = state.destroyerTimer > 0;
      const hasNova = state.plasmaNovaTimer > 0;

      const bulletSpeed = hasDestroyer ? 850 : 650;

      // Konfigurasi Sudut Tembakan
      let angles = [state.aimAngle];
      if (hasNova) {
        // Plasma Nova: 8 tembakan melingkari 360 derajat
        angles = [];
        for (let i = 0; i < 8; i++) {
          angles.push(state.aimAngle + (i * Math.PI) / 4);
        }
      } else if (hasTriple) {
        // Triple cannon: 3 arah menyebar
        angles = [state.aimAngle - 0.22, state.aimAngle, state.aimAngle + 0.22];
      }

      // Warna Peluru (Jika Combo Triple + Destroyer -> Warna Neon Merah/Magenta Mematikan)
      let bulletColor = k.rgb(0, 255, 255);
      if (hasTriple && hasDestroyer) {
        bulletColor = k.rgb(239, 68, 68); // COMBO DESTROYER: Merah Menyala
      } else if (hasDestroyer) {
        bulletColor = k.rgb(245, 158, 11); // Kuning Emas
      } else if (hasNova) {
        bulletColor = k.rgb(217, 70, 239); // Ungu Plasma
      } else if (hasTriple) {
        bulletColor = k.rgb(56, 189, 248); // Cyan Biru
      }

      for (const ang of angles) {
        const startX = CENTER.x + Math.cos(ang) * barrelLen;
        const startY = CENTER.y + Math.sin(ang) * barrelLen;
        const vx = Math.cos(ang) * bulletSpeed;
        const vy = Math.sin(ang) * bulletSpeed;

        const bulletWidth = hasDestroyer ? 24 : (hasNova ? 16 : 14);
        const bulletHeight = hasDestroyer ? 10 : (hasNova ? 8 : 5);

        const b = k.add([
          k.rect(bulletWidth, bulletHeight, { radius: 2 }),
          k.pos(startX, startY),
          k.anchor("center"),
          k.color(bulletColor),
          k.outline(1, k.rgb(255, 255, 255)),
          k.rotate(k.rad2deg(ang)),
          k.z(20),
          "playerBullet"
        ]);

        bullets.push({
          obj: b,
          vx,
          vy,
          life: 1.8,
          isDestroyer: hasDestroyer,
          pierceRemaining: hasDestroyer ? 999 : (hasNova ? 2 : 1)
        });

        // Flash ujung laras
        const flash = k.add([
          k.circle(hasDestroyer ? 14 : 8),
          k.pos(startX, startY),
          k.anchor("center"),
          k.color(bulletColor),
          k.opacity(0.85),
          k.z(22)
        ]);
        k.wait(0.05, () => flash.destroy());
      }

      // Cooldown timer (Combo / Destroyer membuat tembakan lebih cepat)
      const currentCooldown = hasDestroyer ? 0.12 : (hasTriple ? 0.15 : state.shootCooldown);
      k.wait(currentCooldown, () => {
        state.canShoot = true;
      });
    }

    // Aktifkan Ability Khusus (Mendukung Stacking & Combo Bersamaan)
    function activateAbility(type, duration = 9) {
      if (type === "triple") {
        state.tripleTimer = Math.max(state.tripleTimer, duration);
        floatingText(k, "TRIPLE CANNON AKTIF!", CENTER, k.rgb(56, 189, 248));
      } else if (type === "destroyer") {
        state.destroyerTimer = Math.max(state.destroyerTimer, duration);
        floatingText(k, "INSTANT DESTROYER AKTIF!", CENTER, k.rgb(245, 158, 11));
      } else if (type === "nova") {
        state.plasmaNovaTimer = Math.max(state.plasmaNovaTimer, duration);
        floatingText(k, "360° PLASMA NOVA AKTIF!", CENTER, k.rgb(217, 70, 239));
      }

      // Deteksi Efek COMBO
      if (state.tripleTimer > 0 && state.destroyerTimer > 0) {
        floatingText(k, "🔥 HYPER COMBO: TRIPLE DESTROYER! 🔥", k.vec2(CENTER.x, CENTER.y - 45), k.rgb(239, 68, 68));
      }

      playSfx(k, "bomb");
      screenShake(k, 8);
    }

    // Spawn Drop Item Powerup saat Musuh Hancur
    function maybeDropPowerup(pos) {
      if (Math.random() > 0.28) return; // 28% peluang drop item

      // 3 Pilihan Powerup Drop: Triple (3X), Destroyer (DMG), Nova (NOVA)
      const roll = Math.random();
      let type = "triple";
      let col = k.rgb(56, 189, 248);
      let label = "3X";

      if (roll < 0.45) {
        type = "triple";
        col = k.rgb(56, 189, 248);
        label = "3X";
      } else if (roll < 0.8) {
        type = "destroyer";
        col = k.rgb(245, 158, 11);
        label = "DMG";
      } else {
        type = "nova";
        col = k.rgb(217, 70, 239);
        label = "NOVA";
      }

      const pObj = k.add([
        k.circle(14),
        k.pos(pos.x, pos.y),
        k.anchor("center"),
        k.color(15, 23, 42),
        k.outline(2, col),
        k.z(25),
        "powerupDrop"
      ]);

      pObj.add([
        k.text(label, { size: 9, font: "monospace" }),
        k.anchor("center"),
        k.color(col)
      ]);

      // Perlahan melayang menuju pangkalan pusat
      powerupDrops.push({ obj: pObj, type, life: 14 });
    }

    // Input Tembak (Kaplay + Native DOM Event Listener untuk 100% andal)
    let isMouseFiring = false;

    // Kaplay native events
    k.onClick(() => {
      shootBullet();
    });

    k.onMousePress((btn) => {
      if (!btn || btn === "left") {
        isMouseFiring = true;
        shootBullet();
      }
    });

    k.onMouseRelease((btn) => {
      if (!btn || btn === "left") {
        isMouseFiring = false;
      }
    });

    k.onKeyPress("space", () => {
      shootBullet();
    });

    // Native DOM Canvas Listeners (menjamin klik mouse langsung ditembakkan)
    if (k.canvas) {
      k.canvas.addEventListener("pointerdown", (e) => {
        if (e.button === 0) {
          isMouseFiring = true;
          shootBullet();
        }
      });
      window.addEventListener("pointerup", (e) => {
        if (e.button === 0) {
          isMouseFiring = false;
        }
      });
    }

    // Autofire saat mouse atau tombol spasi ditahan
    k.onUpdate(() => {
      if (isMouseFiring || (k.isKeyDown && k.isKeyDown("space")) || (k.isMouseDown && k.isMouseDown("left"))) {
        shootBullet();
      }
    });

    // EMP Superweapon (Tombol 'B' atau double tap)
    function triggerEmpBomb() {
      if (state.isPaused || state.isGameOver) return;
      if (state.empBombs <= 0) {
        floatingText(k, "EMP HABIS!", CENTER, k.rgb(239, 68, 68));
        return;
      }

      state.empBombs--;
      empLabel.text = `BOM EMP: ${state.empBombs} [Tekan B]`;
      playSfx(k, "bomb");
      screenShake(k, 16);
      flashScreen(k, k.rgb(0, 212, 255), 0.35);

      // Gelombang kejut ekspansif
      const shockwave = k.add([
        k.circle(10),
        k.pos(CENTER),
        k.anchor("center"),
        k.color(0, 0, 0),
        k.outline(5, k.rgb(0, 255, 255)),
        k.opacity(1),
        k.z(70)
      ]);

      let swRadius = 10;
      const swLoop = k.onUpdate(() => {
        swRadius += k.dt() * 900;
        shockwave.radius = swRadius;
        shockwave.opacity = Math.max(0, 1 - swRadius / 600);
        if (swRadius >= 600) {
          shockwave.destroy();
          swLoop.cancel();
        }
      });

      // Musnahkan seluruh musuh yang ada di layar
      let wipedCount = 0;
      for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        createExplosion(e.obj.pos, e.type);
        state.score += Math.round(e.scoreValue * 0.75);
        state.kills++;
        state.waveKills++;
        e.obj.destroy();
        enemies.splice(i, 1);
        wipedCount++;
      }

      scoreLabel.text = `SKOR: ${state.score}`;
      floatingText(k, `EMP SWEEP! (${wipedCount} MUSNAH)`, CENTER, k.rgb(0, 255, 255));
      checkWaveProgression();
    }

    k.onKeyPress("b", () => {
      triggerEmpBomb();
    });

    // Sambungkan tombol mobile HTML ke fungsi game
    const mFireBtn = document.getElementById("mobile-fire-btn");
    const mBombBtn = document.getElementById("mobile-bomb-btn");

    if (mFireBtn) {
      mFireBtn.onclick = (e) => {
        e.preventDefault();
        shootBullet();
      };
      mFireBtn.ontouchstart = (e) => {
        e.preventDefault();
        shootBullet();
      };
    }
    if (mBombBtn) {
      mBombBtn.onclick = (e) => {
        e.preventDefault();
        triggerEmpBomb();
      };
      mBombBtn.ontouchstart = (e) => {
        e.preventDefault();
        triggerEmpBomb();
      };
    }

    // Touch Aim pada Canvas
    k.onTouchMove((pos) => {
      updateAim(pos);
      shootBullet();
    });
    k.onTouchStart((pos) => {
      updateAim(pos);
      shootBullet();
    });

    // Partikel Ledakan
    function createExplosion(pos, type) {
      playSfx(k, "explosion");
      screenShake(k, 6);

      const colorMap = {
        drone: k.rgb(239, 68, 68),
        asteroid: k.rgb(168, 85, 247),
        bomber: k.rgb(245, 158, 11),
        shard: k.rgb(217, 70, 239)
      };
      const col = colorMap[type] || k.rgb(255, 255, 255);

      const count = type === "bomber" ? 20 : 12;
      for (let i = 0; i < count; i++) {
        const p = k.add([
          k.rect(k.rand(2, 5), k.rand(2, 5)),
          k.pos(pos.x, pos.y),
          k.anchor("center"),
          k.color(col),
          k.opacity(1),
          k.z(30)
        ]);

        const angle = Math.random() * Math.PI * 2;
        const speed = k.rand(60, 200);
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        const life = k.rand(0.3, 0.7);

        particles.push({ obj: p, vx, vy, life, maxLife: life });
      }
    }

    // Spawner Musuh
    function spawnEnemy(forceType = null, startPos = null) {
      if (state.isPaused || state.isGameOver) return;

      let type = forceType;
      if (!type) {
        // Jika sedang boss wave (kelipatan 5) dan boss belum spawn
        if (state.wave % 5 === 0 && !state.bossActive) {
          type = "boss";
        } else {
          const roll = Math.random();
          if (state.wave === 1) {
            type = roll < 0.7 ? "drone" : "asteroid";
          } else if (state.wave === 2) {
            type = roll < 0.5 ? "drone" : (roll < 0.85 ? "asteroid" : "bomber");
          } else {
            type = roll < 0.4 ? "drone" : (roll < 0.7 ? "asteroid" : "bomber");
          }
        }
      }

      // Tentukan posisi spawn melingkar di luar layar
      let spawnCoord = startPos;
      if (!spawnCoord) {
        const spawnAngle = Math.random() * Math.PI * 2;
        const spawnDist = 480;
        spawnCoord = k.vec2(
          CENTER.x + Math.cos(spawnAngle) * spawnDist,
          CENTER.y + Math.sin(spawnAngle) * spawnDist
        );
      }

      let speed = 90;
      let hp = 1;
      let scoreVal = 10;
      let coreDamage = 10;
      let size = 18;
      let enemyObj = null;

      if (type === "boss") {
        state.bossActive = true;
        const bossTier = Math.floor(state.wave / 5);
        hp = 25 + bossTier * 15;
        speed = 28;
        scoreVal = 250 * bossTier;
        coreDamage = 50;
        size = 52;

        floatingText(k, `⚠️ PERINGATAN: DREADNOUGHT BOSS (WAVE ${state.wave})! ⚠️`, CENTER, k.rgb(239, 68, 68));
        screenShake(k, 14);
        flashScreen(k, k.rgb(239, 68, 68), 0.4);

        enemyObj = k.add([
          k.rect(size, size, { radius: 8 }),
          k.pos(spawnCoord),
          k.anchor("center"),
          k.color(225, 29, 72),
          k.outline(3, k.rgb(255, 255, 255)),
          k.rotate(0),
          k.z(18),
          "enemy",
          "boss"
        ]);

        // Boss Health Bar melayang di atas boss
        const hpBg = enemyObj.add([
          k.rect(48, 6),
          k.pos(0, -32),
          k.anchor("center"),
          k.color(0, 0, 0),
          k.outline(1, k.rgb(255, 255, 255))
        ]);
        const hpFill = hpBg.add([
          k.rect(46, 4),
          k.pos(-23, 0),
          k.anchor("left"),
          k.color(239, 68, 68)
        ]);
        enemyObj.hpFill = hpFill;
      } else if (type === "drone") {
        speed = 135;
        hp = 1;
        scoreVal = 10;
        coreDamage = 10;
        size = 18;

        enemyObj = k.add([
          k.rect(size, size, { radius: 3 }),
          k.pos(spawnCoord),
          k.anchor("center"),
          k.color(239, 68, 68),
          k.outline(2, k.rgb(255, 100, 100)),
          k.rotate(0),
          k.z(15),
          "enemy"
        ]);
      } else if (type === "asteroid") {
        speed = 55;
        hp = 3;
        scoreVal = 25;
        coreDamage = 15;
        size = 26;

        enemyObj = k.add([
          k.circle(size / 2),
          k.pos(spawnCoord),
          k.anchor("center"),
          k.color(168, 85, 247),
          k.outline(2, k.rgb(217, 70, 239)),
          k.z(15),
          "enemy"
        ]);
      } else if (type === "bomber") {
        speed = 45;
        hp = 1;
        scoreVal = 30;
        coreDamage = 30;
        size = 28;

        enemyObj = k.add([
          k.rect(size, size, { radius: 5 }),
          k.pos(spawnCoord),
          k.anchor("center"),
          k.color(245, 158, 11),
          k.outline(3, k.rgb(255, 255, 255)),
          k.rotate(0),
          k.z(15),
          "enemy"
        ]);
      } else if (type === "shard") {
        speed = 95;
        hp = 1;
        scoreVal = 5;
        coreDamage = 5;
        size = 12;

        enemyObj = k.add([
          k.circle(size / 2),
          k.pos(spawnCoord),
          k.anchor("center"),
          k.color(217, 70, 239),
          k.outline(1, k.rgb(255, 255, 255)),
          k.z(15),
          "enemy"
        ]);
      }

      enemies.push({
        obj: enemyObj,
        type,
        hp,
        maxHp: hp,
        speed,
        scoreValue: scoreVal,
        coreDamage,
        size
      });
    }

    // Interval Spawn Loop (kecepatan naik tiap 30 detik)
    let spawnTimer = 0;
    function getSpawnInterval() {
      const elapsedSec = (Date.now() - state.startTime) / 1000;
      const step30s = Math.floor(elapsedSec / 30);
      return Math.max(0.35, 1.4 - step30s * 0.15);
    }

    // Evaluasi Bomb Reward tiap kelipatan 500 Poin
    let nextBombScoreThreshold = 500;
    function checkBombScoreReward() {
      while (state.score >= nextBombScoreThreshold) {
        state.empBombs++;
        nextBombScoreThreshold += 500;
        empLabel.text = `BOM EMP: ${state.empBombs} [Tekan B]`;
        floatingText(k, `+1 BOM EMP (500 PTS)!`, CENTER, k.rgb(0, 212, 255));
        playSfx(k, "bomb");
      }
    }

    // Evaluasi Naik Wave
    function checkWaveProgression() {
      checkBombScoreReward();
      if (state.waveKills >= state.killsRequiredForWave) {
        state.wave++;
        state.waveKills = 0;
        state.killsRequiredForWave = 12 + state.wave * 4;

        waveLabel.text = `WAVE ${state.wave}`;

        floatingText(k, `★ GELOMBANG ${state.wave}! ★`, CENTER, k.rgb(245, 158, 11));
        playSfx(k, "bomb");
        screenShake(k, 8);
      }
    }

    // Trigger Game Over
    async function triggerGameOver() {
      if (state.isGameOver) return;
      state.isGameOver = true;
      stopBgm();
      playSfx(k, "gameover");
      screenShake(k, 16);
      flashScreen(k, k.rgb(239, 68, 68), 0.5);

      const duration = (Date.now() - state.startTime) / 1000;
      await saveDefenderScore(uid, state.score, state.wave, duration);
      await updateGameStats(uid, duration);

      // Sentry / Hub Analytics Event
      if (typeof window !== "undefined") {
        window.postMessage({
          type: "GAME_EVENT",
          name: "orbit_defender_gameover",
          payload: { score: state.score, wave: state.wave, kills: state.kills, duration }
        }, "*");
      }

      k.wait(1.2, () => {
        k.go("gameOver", {
          score: state.score,
          wave: state.wave,
          kills: state.kills,
          duration: Math.round(duration)
        });
      });
    }

    // Pause Feature
    function togglePause() {
      if (state.isGameOver) return;
      state.isPaused = !state.isPaused;

      if (state.isPaused) {
        k.add([
          k.rect(800, 600),
          k.pos(0, 0),
          k.color(0, 0, 0),
          k.opacity(0.55),
          k.z(100),
          "pauseModal"
        ]);
        const p = k.add([
          k.rect(340, 180, { radius: 8 }),
          k.pos(CENTER),
          k.anchor("center"),
          k.color(10, 10, 26),
          k.outline(2, k.rgb(34, 197, 94)),
          k.z(101),
          "pauseModal"
        ]);
        p.add([
          k.text("MISI DIPAUSET", { size: 22, font: "monospace" }),
          k.pos(0, -35),
          k.anchor("center"),
          k.color(245, 158, 11)
        ]);
        const resBtn = k.add([
          k.rect(160, 42, { radius: 4 }),
          k.pos(400, 335),
          k.anchor("center"),
          k.color(34, 197, 94),
          k.area(),
          k.z(102),
          "pauseModal"
        ]);
        resBtn.add([
          k.text("LANJUTKAN", { size: 16, font: "monospace" }),
          k.anchor("center"),
          k.color(10, 10, 26)
        ]);
        resBtn.onClick(() => togglePause());
      } else {
        k.destroyAll("pauseModal");
      }
    }

    k.onKeyPress("p", () => togglePause());
    k.onKeyPress("escape", () => togglePause());

    // Game Loop Utama
    k.onUpdate(() => {
      if (state.isPaused || state.isGameOver) return;

      const dt = k.dt();

      // Pulsing effect pada core shield
      coreGlow.opacity = 0.2 + Math.sin(Date.now() / 200) * 0.1;

      // 1. Spawning
      spawnTimer += dt;
      if (spawnTimer >= getSpawnInterval()) {
        spawnTimer = 0;
        spawnEnemy();
      }

      // 2. Update Bullets
      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.obj.pos.x += b.vx * dt;
        b.obj.pos.y += b.vy * dt;
        b.life -= dt;

        // Cek batas layar
        if (
          b.life <= 0 ||
          b.obj.pos.x < -40 ||
          b.obj.pos.x > 840 ||
          b.obj.pos.y < -40 ||
          b.obj.pos.y > 640
        ) {
          b.obj.destroy();
          bullets.splice(i, 1);
        }
      }

      // 3. Update Enemies
      for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        const dx = CENTER.x - e.obj.pos.x;
        const dy = CENTER.y - e.obj.pos.y;
        const dist = Math.hypot(dx, dy);

        // Putar musuh mengarah ke center
        const moveAngle = Math.atan2(dy, dx);
        e.obj.pos.x += Math.cos(moveAngle) * e.speed * dt;
        e.obj.pos.y += Math.sin(moveAngle) * e.speed * dt;

        if (e.obj.angle !== undefined) {
          e.obj.angle = k.rad2deg(moveAngle);
        }

        // Cek Tabrakan Enemy vs Core Stasiun
        if (dist <= CORE_RADIUS + e.size / 2) {
          state.hp = Math.max(0, state.hp - e.coreDamage);
          hpBar.setValue(state.hp);
          playSfx(k, "hit");
          screenShake(k, 12);
          flashScreen(k, k.rgb(239, 68, 68), 0.2);
          createExplosion(e.obj.pos, e.type);
          floatingText(k, `-${e.coreDamage} HP`, CENTER, k.rgb(239, 68, 68));

          e.obj.destroy();
          enemies.splice(i, 1);

          if (state.hp <= 0) {
            triggerGameOver();
            return;
          }
          continue;
        }

        // Cek Tabrakan Bullet vs Enemy
        let hitByBullet = false;
        for (let j = bullets.length - 1; j >= 0; j--) {
          const b = bullets[j];
          const bDist = Math.hypot(b.obj.pos.x - e.obj.pos.x, b.obj.pos.y - e.obj.pos.y);

          if (bDist <= e.size + 4) {
            // Jika peluru instan destroyer -> musuh langsung tewas (damage 999) dan peluru menembus (piercing)
            const damage = b.isDestroyer ? 999 : 1;
            e.hp -= damage;
            hitByBullet = true;

            b.pierceRemaining--;
            if (b.pierceRemaining <= 0) {
              b.obj.destroy();
              bullets.splice(j, 1);
            }

            // Flash enemy sesaat
            e.obj.color = k.rgb(255, 255, 255);
            k.wait(0.05, () => {
              if (e.obj && !e.obj.isDestroyed) {
                if (e.type === "drone") e.obj.color = k.rgb(239, 68, 68);
                else if (e.type === "asteroid") e.obj.color = k.rgb(168, 85, 247);
                else if (e.type === "bomber") e.obj.color = k.rgb(245, 158, 11);
                else if (e.type === "shard") e.obj.color = k.rgb(217, 70, 239);
              }
            });

            if (e.hp <= 0) {
              createExplosion(e.obj.pos, e.type);
              state.score += e.scoreValue;
              state.kills++;
              state.waveKills++;
              scoreLabel.text = `SKOR: ${state.score}`;
              floatingText(k, `+${e.scoreValue}`, e.obj.pos, k.rgb(34, 197, 94));

              if (e.type === "boss") {
                state.bossActive = false;
                floatingText(k, "👑 BOSS HANCUR! +1 BOM EMP 👑", CENTER, k.rgb(245, 158, 11));
                state.empBombs = Math.min(5, state.empBombs + 1);
                empLabel.text = `BOM EMP: ${state.empBombs} [Tekan B]`;
                screenShake(k, 18);
                // Bos pasti menjatuhkan 2 powerup sekaligus
                maybeDropPowerup(k.vec2(e.obj.pos.x - 15, e.obj.pos.y));
                maybeDropPowerup(k.vec2(e.obj.pos.x + 15, e.obj.pos.y));
              } else {
                maybeDropPowerup(e.obj.pos);
              }

              // Jika Asteroid hancur, pecah menjadi 2 shard kecil
              if (e.type === "asteroid") {
                const offA = k.vec2(e.obj.pos.x + 10, e.obj.pos.y - 10);
                const offB = k.vec2(e.obj.pos.x - 10, e.obj.pos.y + 10);
                spawnEnemy("shard", offA);
                spawnEnemy("shard", offB);
              }

              e.obj.destroy();
              enemies.splice(i, 1);
              checkWaveProgression();
            } else if (e.obj.hpFill) {
              // Update bar darah boss
              const pct = Math.max(0, e.hp / e.maxHp);
              e.obj.hpFill.width = 46 * pct;
            }
            break;
          }
        }
      }

      // 4. Update Powerup Drops & Pengambilan
      for (let i = powerupDrops.length - 1; i >= 0; i--) {
        const p = powerupDrops[i];
        p.life -= dt;

        // Perlahan bergerak ke arah inti pangkalan (daya tarik magnetik stasiun)
        const dx = CENTER.x - p.obj.pos.x;
        const dy = CENTER.y - p.obj.pos.y;
        const dist = Math.hypot(dx, dy);
        const ang = Math.atan2(dy, dx);
        p.obj.pos.x += Math.cos(ang) * 45 * dt;
        p.obj.pos.y += Math.sin(ang) * 45 * dt;

        // Efek berkedip saat hampir expired
        if (p.life < 3) {
          p.obj.opacity = Math.sin(Date.now() / 80) > 0 ? 0.9 : 0.3;
        }

        // Ambil jika tertabrak peluru player ATAU masuk radius pangkalan (CORE_RADIUS + 25)
        let collected = dist <= CORE_RADIUS + 25;
        if (!collected) {
          for (let j = bullets.length - 1; j >= 0; j--) {
            const b = bullets[j];
            if (Math.hypot(b.obj.pos.x - p.obj.pos.x, b.obj.pos.y - p.obj.pos.y) <= 16) {
              collected = true;
              b.obj.destroy();
              bullets.splice(j, 1);
              break;
            }
          }
        }

        if (collected) {
          activateAbility(p.type, 8);
          p.obj.destroy();
          powerupDrops.splice(i, 1);
          continue;
        }

        if (p.life <= 0) {
          p.obj.destroy();
          powerupDrops.splice(i, 1);
        }
      }

      // 5. Update Status Timer Ability & Combo HUD
      const activeBuffs = [];
      if (state.tripleTimer > 0) {
        state.tripleTimer -= dt;
        activeBuffs.push(`3X: ${Math.ceil(state.tripleTimer)}s`);
      }
      if (state.destroyerTimer > 0) {
        state.destroyerTimer -= dt;
        activeBuffs.push(`DMG: ${Math.ceil(state.destroyerTimer)}s`);
      }
      if (state.plasmaNovaTimer > 0) {
        state.plasmaNovaTimer -= dt;
        activeBuffs.push(`NOVA: ${Math.ceil(state.plasmaNovaTimer)}s`);
      }

      if (activeBuffs.length > 0) {
        // Tampilkan status buff aktif dan combo indicator
        const isCombo = state.tripleTimer > 0 && state.destroyerTimer > 0;
        abilityLabel.text = (isCombo ? "🔥 COMBO! " : "⚡ ") + activeBuffs.join(" | ");
        abilityLabel.color = isCombo ? k.rgb(239, 68, 68) : k.rgb(245, 158, 11);

        // Update warna barrel turret mengikuti status combo
        if (isCombo) {
          turretBarrel.color = k.rgb(239, 68, 68);
        } else if (state.destroyerTimer > 0) {
          turretBarrel.color = k.rgb(245, 158, 11);
        } else if (state.plasmaNovaTimer > 0) {
          turretBarrel.color = k.rgb(217, 70, 239);
        } else {
          turretBarrel.color = k.rgb(56, 189, 248);
        }
      } else {
        abilityLabel.text = "";
        turretBarrel.color = k.rgb(0, 212, 255);
      }

      // 6. Update Partikel Ledakan
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.obj.pos.x += p.vx * dt;
        p.obj.pos.y += p.vy * dt;
        p.life -= dt;
        p.obj.opacity = Math.max(0, p.life / p.maxLife);

        if (p.life <= 0) {
          p.obj.destroy();
          particles.splice(i, 1);
        }
      }
    });
  });
}
