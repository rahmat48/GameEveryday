/**
 * audio.js
 * Modul audio dan efek suara Snake Arcade (Data Worm).
 */

let isMute = localStorage.getItem("snakeArcade_muted") === "true";
let currentBgm = null;
const sounds = {};

export function initAudio(k) {
  const soundList = [
    "eat",
    "powerup",
    "gameover",
    "click",
    "bgm-menu",
    "bgm-gameplay"
  ];

  soundList.forEach((s) => {
    try {
      k.loadSound(s, `../audio/${s}.mp3`).catch(() => {});
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
  localStorage.setItem("snakeArcade_muted", String(isMute));
  if (isMute) stopBgm();
  return isMute;
}

export function isMuted() {
  return isMute;
}
