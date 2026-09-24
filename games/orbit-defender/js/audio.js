/**
 * audio.js
 * Modul audio dan efek suara Orbit Defender dengan fallback Web Audio API Synthesizer.
 */

let isMute = localStorage.getItem("orbitDefender_muted") === "true";
let currentBgm = null;
const sounds = {};

// Fallback Web Audio API Synth (jaminan SFX terdengar tanpa ketergantungan file)
let audioCtx = null;
function getAudioContext() {
  if (!audioCtx && typeof window !== "undefined") {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

function playSynth(type) {
  if (isMute) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  if (type === "shoot") {
    // Laser pew: frekuensi turun cepat 880Hz -> 110Hz
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.12);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
    osc.start(now);
    osc.stop(now + 0.12);
  } else if (type === "explosion") {
    // Ledakan: frekuensi rendah + pitch drop
    osc.type = "square";
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.28);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);
    osc.start(now);
    osc.stop(now + 0.28);
  } else if (type === "hit") {
    // Core damaged: nada peringatan
    osc.type = "triangle";
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.setValueAtTime(160, now + 0.08);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    osc.start(now);
    osc.stop(now + 0.2);
  } else if (type === "bomb") {
    // EMP Superweapon sweep: frekuensi naik cepat lalu boom
    osc.type = "sine";
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.25);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.6);
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
    osc.start(now);
    osc.stop(now + 0.6);
  } else if (type === "click") {
    // UI Click
    osc.type = "sine";
    osc.frequency.setValueAtTime(600, now);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
    osc.start(now);
    osc.stop(now + 0.05);
  }
}

export function initAudio(k) {
  const soundList = [
    "shoot",
    "explosion",
    "hit",
    "bomb",
    "click",
    "gameover",
    "bgm-menu",
    "bgm-gameplay"
  ];

  soundList.forEach((s) => {
    try {
      k.loadSound(s, `./assets/audio/${s}.mp3`).then(() => {
        sounds[s] = true;
      }).catch(() => {
        // Fallback synth akan menangani
      });
    } catch (e) {
      console.warn(`Audio ${s} load error, synth fallback active.`);
    }
  });
}

export function playSfx(k, name) {
  if (isMute) return;
  getAudioContext(); // Wake up web audio context
  try {
    if (sounds[name]) {
      k.play(name, { volume: 0.7 });
    } else {
      playSynth(name);
    }
  } catch (err) {
    playSynth(name);
  }
}

export function playBgm(k, name) {
  if (isMute) return;
  stopBgm();
  try {
    if (sounds[name]) {
      currentBgm = k.play(name, { loop: true, volume: 0.25 });
    }
  } catch (err) {}
}

export function stopBgm() {
  if (currentBgm) {
    try {
      currentBgm.stop();
    } catch (e) {}
    currentBgm = null;
  }
}

export function toggleMute() {
  isMute = !isMute;
  localStorage.setItem("orbitDefender_muted", String(isMute));
  if (isMute) stopBgm();
  return isMute;
}

export function isMuted() {
  return isMute;
}
