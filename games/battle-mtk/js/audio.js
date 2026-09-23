/**
 * audio.js
 * Modul manajer audio dan efek suara Battle MTK.
 */

let isMute = localStorage.getItem("battleMTK_muted") === "true";
let currentBgm = null;
const sounds = {};

/**
 * Memuat daftar sound efek dan musik.
 */
export function initAudio(k) {
  const soundList = [
    "benar", "salah", "combo", "slash",
    "gameover", "stage-clear", "victory", "click",
    "bgm-battle", "bgm-menu"
  ];

  soundList.forEach((s) => {
    try {
      k.loadSound(s, `./assets/audio/${s}.mp3`).catch(() => {
        // Abaikan file audio jika belum ada di folder aset
      });
      sounds[s] = true;
    } catch (e) {
      console.warn(`Audio ${s} tidak ditemukan, audio dinonaktifkan sementara.`);
    }
  });
}

/**
 * Memainkan sound effect pendek.
 */
export function playSfx(k, name) {
  if (isMute) return;
  try {
    if (sounds[name]) {
      k.play(name, { volume: 0.8 });
    }
  } catch (err) {
    // Fail silently
  }
}

/**
 * Memutar background music berulang.
 */
export function playBgm(k, name) {
  if (isMute) return;
  stopBgm();
  try {
    if (sounds[name]) {
      currentBgm = k.play(name, { loop: true, volume: 0.3 });
    }
  } catch (err) {
    // Fail silently
  }
}

/**
 * Menghentikan BGM yang sedang berjalan.
 */
export function stopBgm() {
  if (currentBgm) {
    try {
      currentBgm.stop();
    } catch (e) {
      // Fail silently
    }
    currentBgm = null;
  }
}

/**
 * Mengubah status mute/unmute audio.
 */
export function toggleMute() {
  isMute = !isMute;
  localStorage.setItem("battleMTK_muted", String(isMute));
  if (isMute) stopBgm();
  return isMute;
}

/**
 * Memeriksa status mute saat ini.
 */
export function isMuted() {
  return isMute;
}
