/**
 * audio.js
 * Modul audio dan synthesizer Web Audio API retro untuk Pacman Arcade.
 * Menyediakan fallback SFX sintetis penuh tanpa ketergantungan file eksternal.
 */

let isMute = typeof localStorage !== "undefined" ? localStorage.getItem("pacmanArcade_muted") === "true" : false;
let currentBgm = null;
let kapInstance = null;
let sirenTimer = null;
const sounds = {};

// Web Audio API Context
let audioCtx = null;
function getAudioContext() {
  if (!audioCtx && typeof window !== "undefined") {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// Lepas oscillator & gain node setelah pemutaran selesai mencegah kebocoran memori
function cleanupNodes(osc, gain) {
  osc.onended = () => {
    try {
      osc.disconnect();
      gain.disconnect();
    } catch (e) {}
  };
}

let wakaStep = 0;

/**
 * Synthesizer retro SFX menggunakan Web Audio API.
 * Menghasilkan suara khas arcade 8-bit.
 */
function playSynth(type) {
  if (isMute) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  switch (type) {
    case "waka":
    case "eat": {
      // Alternating dual-tone retro pitch (chomp)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";

      const isStep0 = (wakaStep % 2 === 0);
      wakaStep++;
      const startFreq = isStep0 ? 260 : 440;
      const peakFreq = isStep0 ? 460 : 280;
      const endFreq = isStep0 ? 180 : 160;

      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.linearRampToValueAtTime(peakFreq, now + 0.04);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.08);

      gain.gain.setValueAtTime(0.24, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);
      cleanupNodes(osc, gain);
      osc.start(now);
      osc.stop(now + 0.08);
      break;
    }

    case "powerup":
    case "energizer": {
      // Pulsing oscillator sweep
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";

      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(750, now + 0.2);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.35);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.linearRampToValueAtTime(0.22, now + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      cleanupNodes(osc, gain);
      osc.start(now);
      osc.stop(now + 0.35);
      break;
    }

    case "eat-ghost":
    case "eatghost": {
      // Ascending staccato arpeggio (5 nada cepat)
      const notes = [392, 523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const t = now + idx * 0.045;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.042);

        osc.connect(gain);
        gain.connect(ctx.destination);
        cleanupNodes(osc, gain);
        osc.start(t);
        osc.stop(t + 0.042);
      });
      break;
    }

    case "death":
    case "gameover": {
      // Classic Pacman descending pitch warble (boop-boop-down-fade)
      const warbles = [
        { f: 550, d: 0.065 },
        { f: 500, d: 0.065 },
        { f: 450, d: 0.065 },
        { f: 410, d: 0.065 },
        { f: 370, d: 0.065 },
        { f: 330, d: 0.07 },
        { f: 290, d: 0.075 },
        { f: 250, d: 0.08 },
        { f: 210, d: 0.085 },
        { f: 170, d: 0.09 },
        { f: 130, d: 0.1 },
        { f: 80,  d: 0.15 }
      ];
      let offset = 0;
      warbles.forEach((w) => {
        const t = now + offset;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(w.f, t);
        osc.frequency.exponentialRampToValueAtTime(Math.max(25, w.f * 0.8), t + w.d);

        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + w.d);

        osc.connect(gain);
        gain.connect(ctx.destination);
        cleanupNodes(osc, gain);
        osc.start(t);
        osc.stop(t + w.d);
        offset += w.d;
      });
      break;
    }

    case "fruit": {
      // High-pitch coin chime (B5 -> E6 dual bell)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(987.77, now);
      osc.frequency.setValueAtTime(1318.51, now + 0.07);

      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);
      cleanupNodes(osc, gain);
      osc.start(now);
      osc.stop(now + 0.28);
      break;
    }

    case "clear": {
      // Triumphant 5-note fanfare (C5, E5, G5, B5, C6)
      const fanfare = [
        { f: 523.25, d: 0.09 },
        { f: 659.25, d: 0.09 },
        { f: 783.99, d: 0.09 },
        { f: 987.77, d: 0.11 },
        { f: 1046.50, d: 0.3 }
      ];
      let offset = 0;
      fanfare.forEach((n) => {
        const t = now + offset;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(n.f, t);

        gain.gain.setValueAtTime(0.22, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + n.d);

        osc.connect(gain);
        gain.connect(ctx.destination);
        cleanupNodes(osc, gain);
        osc.start(t);
        osc.stop(t + n.d);
        offset += n.d * 0.85;
      });
      break;
    }

    case "click": {
      // Short UI blip
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(720, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);
      cleanupNodes(osc, gain);
      osc.start(now);
      osc.stop(now + 0.04);
      break;
    }

    case "siren": {
      // Pulsing ambient ghost siren pulse
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(360, now);
      osc.frequency.linearRampToValueAtTime(540, now + 0.16);
      osc.frequency.linearRampToValueAtTime(360, now + 0.32);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);

      osc.connect(gain);
      gain.connect(ctx.destination);
      cleanupNodes(osc, gain);
      osc.start(now);
      osc.stop(now + 0.32);
      break;
    }
  }
}

/**
 * Inisialisasi modul audio dan coba muat aset audio jika tersedia.
 * @param {object} k - Instance Kaplay
 */
export function initAudio(k) {
  kapInstance = k;
  const soundList = [
    "waka",
    "eat",
    "powerup",
    "energizer",
    "eat-ghost",
    "death",
    "fruit",
    "clear",
    "click",
    "siren",
    "bgm-menu",
    "bgm-gameplay"
  ];

  // Murni synthesizer audio retro 8-bit tanpa dependensi berkas luar
  // AudioContext dibangunkan saat interaksi pengguna pertama kali

  // Bangunkan AudioContext saat interaksi pengguna pertama kali
  if (typeof window !== "undefined") {
    const unlock = () => {
      getAudioContext();
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
  }
}

/**
 * Memainkan efek suara (SFX).
 * Menerima signature: playSfx(type) atau playSfx(k, type)
 * @param {string|object} arg1
 * @param {string} [arg2]
 */
export function playSfx(arg1, arg2) {
  if (isMute) return;
  let k = kapInstance;
  let type = arg1;

  if (typeof arg1 === "object" && typeof arg2 === "string") {
    k = arg1;
    type = arg2;
  } else if (typeof arg1 === "string" && typeof arg2 === "object") {
    type = arg1;
    k = arg2;
  }

  getAudioContext();

  try {
    if (k && sounds[type] && typeof k.play === "function") {
      k.play(type, { volume: 0.7 });
      return;
    }
  } catch (err) {}

  playSynth(type);
}

/**
 * Memulai ambient ghost siren looping jika BGM tidak menggunakan berkas audio.
 */
function startSirenLoop() {
  if (sirenTimer || isMute) return;
  const tick = () => {
    if (isMute) {
      stopSirenLoop();
      return;
    }
    playSynth("siren");
  };
  tick();
  sirenTimer = setInterval(tick, 360);
}

function stopSirenLoop() {
  if (sirenTimer) {
    clearInterval(sirenTimer);
    sirenTimer = null;
  }
}

/**
 * Memutar musik latar belakang (BGM).
 * @param {object} [k] - Instance Kaplay opsional
 * @param {string} name
 */
export function playBgm(k, name) {
  if (typeof k === "string") {
    name = k;
    k = kapInstance;
  }
  if (!k) k = kapInstance;

  if (isMute) return;
  stopBgm();

  try {
    if (k && sounds[name] && typeof k.play === "function") {
      currentBgm = k.play(name, { loop: true, volume: 0.25 });
      return;
    }
  } catch (err) {}

  // Fallback ambient siren jika bgm-gameplay / siren diminta
  if (name === "siren" || name === "bgm-gameplay") {
    startSirenLoop();
  }
}

/**
 * Menghentikan semua BGM dan looping siren.
 */
export function stopBgm() {
  stopSirenLoop();
  if (currentBgm) {
    try {
      currentBgm.stop();
    } catch (e) {}
    currentBgm = null;
  }
}

/**
 * Mengubah status mute dan menyimpan ke LocalStorage.
 * @returns {boolean}
 */
export function toggleMute() {
  isMute = !isMute;
  if (typeof localStorage !== "undefined") {
    localStorage.setItem("pacmanArcade_muted", String(isMute));
  }
  if (isMute) stopBgm();
  return isMute;
}

/**
 * Mengecek apakah audio dalam kondisi mute.
 * @returns {boolean}
 */
export function isMuted() {
  return isMute;
}
