/**
 * gameplay.js
 * Scene gameplay utama Battle MTK: duel matematika, boss HP, timer bar, skor, dan combo.
 */

import { generateQuestion, getDamage } from "../questions.js";
import { makeHpBar, makeTimerBar, floatingText, screenShake, damageFlash } from "../ui.js";
import { getCurrentUser, saveBattleScore, updateGameStats } from "../user.js";

export function gameplayScene(k) {
  k.scene("gameplay", async (data = {}) => {
    const stage = data.stage || 1;

    // Monster max HP per stage
    let maxMonsterHp = 100;
    if (stage >= 4 && stage <= 6) maxMonsterHp = 200;
    else if (stage >= 7 && stage <= 8) maxMonsterHp = 300;
    else if (stage === 9) maxMonsterHp = 400;
    else if (stage === 10) maxMonsterHp = 500;

    const state = {
      hpPlayer: 100,
      hpMonster: maxMonsterHp,
      stage: stage,
      score: 0,
      combo: 0,
      maxCombo: 0,
      lives: 3,
      timeLeft: stage >= 9 ? 7 : (stage >= 8 ? 8 : 10),
      maxTime: stage >= 9 ? 7 : (stage >= 8 ? 8 : 10),
      isAnswering: false,
      currentQ: null,
      startTime: Date.now(),
      answerButtons: []
    };

    const user = await getCurrentUser();
    const uid = user ? user.uid : null;

    // UI Layout
    const playerBar = makeHpBar(k, k.vec2(20, 80), 100, k.rgb(34, 197, 94), 260, 20);
    const monsterBar = makeHpBar(k, k.vec2(520, 80), maxMonsterHp, k.rgb(168, 85, 247), 260, 20);
    const timerBar = makeTimerBar(k, k.vec2(20, 120), state.maxTime, 760, 12);

    k.add([
      k.text(`STAGE ${stage}/10`, { size: 16, font: "monospace" }),
      k.pos(400, 30),
      k.anchor("center"),
      k.color(34, 197, 94)
    ]);

    const scoreLabel = k.add([
      k.text(`SKOR: ${state.score}`, { size: 22, font: "monospace" }),
      k.pos(20, 30),
      k.color(224, 224, 255)
    ]);

    const livesLabel = k.add([
      k.text(`LIVES: ${state.lives}`, { size: 22, font: "monospace" }),
      k.pos(780, 30),
      k.anchor("topright"),
      k.color(239, 68, 68)
    ]);

    const comboLabel = k.add([
      k.text("", { size: 24, font: "monospace" }),
      k.pos(400, 540),
      k.anchor("center"),
      k.color(34, 197, 94)
    ]);

    const questionContainer = k.add([
      k.pos(400, 240),
      k.z(20)
    ]);

    function renderQuestionText(soalStr) {
      // Bersihkan teks soal lama
      questionContainer.removeAll();

      const tokens = soalStr.split(" ");
      const charWidth = 28;
      const totalWidth = tokens.join(" ").length * charWidth;
      let curX = -totalWidth / 2;

      tokens.forEach((t) => {
        const isOp = ["+", "-", "*", "/"].includes(t);
        const color = isOp ? k.rgb(245, 158, 11) : k.rgb(255, 255, 255);
        const displayToken = t === "*" ? "×" : (t === "/" ? "÷" : t);

        const txt = questionContainer.add([
          k.text(displayToken, { size: 52, font: "monospace" }),
          k.pos(curX, 0),
          k.color(color),
          "questionToken"
        ]);

        if (isOp) {
          // Efek glow / outline ekstra untuk operator
          txt.add([
            k.text(displayToken, { size: 52, font: "monospace" }),
            k.pos(0, 0),
            k.color(245, 158, 11),
            k.opacity(0.4),
            k.scale(1.1)
          ]);
        }

        curX += (displayToken.length + 1) * charWidth;
      });
    }

    function checkCombo() {
      if (state.combo >= 5) return 3;
      if (state.combo >= 3) return 2;
      return 1;
    }

    async function endStage() {
      const stars = state.lives === 3 ? 3 : (state.lives === 2 ? 2 : 1);
      const duration = (Date.now() - state.startTime) / 1000;
      await saveBattleScore(uid, state.stage, state.score, stars, state.maxCombo);
      await updateGameStats(uid, duration);
      k.go("victory", {
        stage: state.stage,
        score: state.score,
        stars,
        maxCombo: state.maxCombo,
        duration
      });
    }

    async function gameOver() {
      const duration = (Date.now() - state.startTime) / 1000;
      await updateGameStats(uid, duration);
      k.go("gameOver", {
        stage: state.stage,
        score: state.score,
        maxCombo: state.maxCombo
      });
    }

    function handleAnswer(pilihan) {
      if (state.isAnswering) return;
      state.isAnswering = true;

      const benar = state.currentQ && pilihan === state.currentQ.jawaban;

      if (benar) {
        state.combo++;
        if (state.combo > state.maxCombo) state.maxCombo = state.combo;
        const multiplier = checkCombo();
        const dmg = getDamage(state.stage) * multiplier;

        state.hpMonster = Math.max(0, state.hpMonster - dmg);
        state.score += dmg * 10;
        scoreLabel.text = `SKOR: ${state.score}`;

        floatingText(k, `+${dmg} DMG!`, k.vec2(650, 160), k.rgb(34, 197, 94));
        if (multiplier > 1) {
          comboLabel.text = `COMBO x${multiplier}! (${state.combo} IN A ROW)`;
        } else {
          comboLabel.text = `COMBO: ${state.combo}`;
        }

        monsterBar.setValue(state.hpMonster);

        if (state.hpMonster <= 0) {
          k.wait(0.8, endStage);
          return;
        }
      } else {
        state.combo = 0;
        comboLabel.text = "";
        state.hpPlayer = Math.max(0, state.hpPlayer - 20);
        state.lives--;
        livesLabel.text = `LIVES: ${state.lives}`;

        screenShake(k, 14);
        damageFlash(k);

        // Efek partikel serpihan merah
        for (let i = 0; i < 12; i++) {
          const spark = k.add([
            k.rect(4, 4),
            k.pos(150 + (Math.random() - 0.5) * 40, 100 + (Math.random() - 0.5) * 40),
            k.color(239, 68, 68),
            k.opacity(1),
            k.z(80)
          ]);
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 120 + 80;
          spark.onUpdate(() => {
            spark.pos.x += Math.cos(angle) * speed * k.dt();
            spark.pos.y += Math.sin(angle) * speed * k.dt();
            spark.opacity -= 1.5 * k.dt();
            if (spark.opacity <= 0) spark.destroy();
          });
        }

        floatingText(k, "CRITICAL HIT! -20 HP", k.vec2(180, 140), k.rgb(239, 68, 68));
        playerBar.setValue(state.hpPlayer);

        if (state.hpPlayer <= 0 || state.lives <= 0) {
          k.wait(0.8, gameOver);
          return;
        }
      }

      k.wait(0.8, () => {
        nextQuestion();
      });
    }

    function nextQuestion() {
      state.currentQ = generateQuestion(state.stage);
      state.timeLeft = state.maxTime;
      state.isAnswering = false;

      renderQuestionText(state.currentQ.soal);

      // Hapus tombol jawaban sebelumnya
      state.answerButtons.forEach(btn => btn.destroy());
      state.answerButtons = [];

      const buttonPositions = [
        k.vec2(250, 360),
        k.vec2(550, 360),
        k.vec2(250, 450),
        k.vec2(550, 450)
      ];

      state.currentQ.pilihan.forEach((val, idx) => {
        const pos = buttonPositions[idx] || k.vec2(400, 400);
        const btn = k.add([
          k.rect(260, 64, { radius: 6 }),
          k.pos(pos),
          k.anchor("center"),
          k.color(20, 25, 40),
          k.outline(2, k.rgb(34, 197, 94)),
          k.area(),
          "choiceBtn"
        ]);

        btn.add([
          k.text(String(val), { size: 30, font: "monospace" }),
          k.anchor("center"),
          k.color(255, 255, 255)
        ]);

        btn.onHoverUpdate(() => {
          btn.scale = k.vec2(1.04);
          k.setCursor("pointer");
        });

        btn.onHoverEnd(() => {
          btn.scale = k.vec2(1);
          k.setCursor("default");
        });

        btn.onClick(() => {
          handleAnswer(val);
        });

        state.answerButtons.push(btn);
      });

      timerBar.setValue(state.timeLeft);
    }

    // Timer loop per frame
    k.onUpdate(() => {
      if (state.isAnswering) return;

      state.timeLeft -= k.dt();
      timerBar.setValue(state.timeLeft);

      if (state.timeLeft <= 0) {
        handleAnswer(-999); // Waktu habis dianggap jawaban salah
      }
    });

    nextQuestion();
  });
}
