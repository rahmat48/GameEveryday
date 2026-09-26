/**
 * audio.js
 * Modul audio dan efek suara Pulse Runner (Gravity Tunnel).
 */

let isMute = localStorage.getItem("pulseRunner_muted") === "true";
let currentBgm = null;
const sounds = {};

export function initAudio(k) {
  const soundList = [
    "flip",
    "orb",
    "fuel",
    "powerup",
    "nearmiss",
    "gameover",
    "click",
    "bgm-menu",
    "bgm-gameplay"
  ];

  soundList.forEach((s) => {
    try {
      k.loadSound(s, `./assets/audio/${s}.mp3`).catch(() => {});
      sounds[s] = true;
    } catch (e) {
      console.warn(`Audio ${s} tidak ditemukan.`);
    }
  });
}

export function playSfx(k, name) {
  if (isMute) return;
  try {
    if (sounds[name]) {
      k.play(name, { volume: 0.8 });
    }
  } catch (err) {}
}

export function playBgm(k, name) {
  if (isMute) return;
  stopBgm();
  try {
    if (sounds[name]) {
      currentBgm = k.play(name, { loop: true, volume: 0.3 });
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
  localStorage.setItem("pulseRunner_muted", String(isMute));
  if (isMute) stopBgm();
  return isMute;
}

export function isMuted() {
  return isMute;
}
