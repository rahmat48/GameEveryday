/**
 * user.js
 * Modul integrasi Firebase Auth & Realtime Database untuk Pacman Arcade.
 * Mengelola sinkronisasi rekor skor, stage terbaik, durasi bermain, dan fallback tamu.
 */

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getDatabase, ref, get, update, increment } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { firebaseConfig } from "../../../firebase-config.js";

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getDatabase(app);

/**
 * Mendapatkan user saat ini dari Firebase Auth.
 * @returns {Promise<object|null>}
 */
export async function getCurrentUser() {
  return new Promise((resolve) => {
    try {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        resolve(user || null);
      }, (err) => {
        console.warn("Auth check error:", err);
        resolve(null);
      });
    } catch (e) {
      console.warn("Firebase Auth gagal:", e);
      resolve(null);
    }
  });
}

/**
 * Mengambil profil user dari Realtime Database.
 * @param {string} uid
 * @returns {Promise<object|null>}
 */
export async function getUserProfile(uid) {
  if (!uid) return null;
  try {
    const snap = await get(ref(db, `users/${uid}`));
    if (snap.exists()) {
      return snap.val();
    }
    return null;
  } catch (err) {
    console.warn("Gagal memuat profil user:", err);
    return null;
  }
}

/**
 * Memperbarui statistik total game dimainkan dan waktu bermain.
 * @param {string} uid
 * @param {number} addedPlayTime - Durasi bermain dalam detik
 */
export async function updateGameStats(uid, addedPlayTime = 0) {
  if (!uid) return;
  try {
    await update(ref(db, `users/${uid}`), {
      gamesPlayed: increment(1),
      totalPlayTime: increment(Math.round(addedPlayTime))
    });
  } catch (err) {
    console.warn("Gagal update statistik user:", err);
  }
}

/**
 * Menyimpan skor Pacman Arcade ke Firebase Realtime Database / LocalStorage tamu.
 * @param {string} uid
 * @param {number} score
 * @param {number} stage
 * @param {number} duration
 * @param {number} [dotsEaten=0]
 * @param {number} [ghostsEaten=0]
 */
export async function savePacmanScore(uid, score, stage = 1, duration = 0, dotsEaten = 0, ghostsEaten = 0) {
  const safeScore = Math.max(0, Math.min(1000000, Math.round(Number(score) || 0)));
  const safeStage = Math.max(1, Math.round(Number(stage) || 1));
  const safeDuration = Math.max(0, Math.round(Number(duration) || 0));

  if (!uid) {
    if (typeof localStorage === "undefined") return;
    const local = JSON.parse(
      localStorage.getItem("pacmanArcade_guest") ||
      '{"highScore":0,"bestStage":1,"bestDuration":0,"dotsEaten":0,"ghostsEaten":0}'
    );
    local.highScore = Math.max(local.highScore || 0, safeScore);
    local.bestStage = Math.max(local.bestStage || 1, safeStage);
    local.bestDuration = Math.max(local.bestDuration || 0, safeDuration);
    local.dotsEaten = (local.dotsEaten || 0) + (Number(dotsEaten) || 0);
    local.ghostsEaten = (local.ghostsEaten || 0) + (Number(ghostsEaten) || 0);
    localStorage.setItem("pacmanArcade_guest", JSON.stringify(local));
    return;
  }

  try {
    const pacmanRef = ref(db, `users/${uid}/pacmanArcade`);
    const snap = await get(pacmanRef);
    const existing = snap.exists() ? snap.val() : { highScore: 0, bestStage: 1, bestDuration: 0 };

    const userUpdates = {};
    if (safeScore > (existing.highScore || 0)) {
      userUpdates["pacmanArcade/highScore"] = safeScore;
    }
    if (safeStage > (existing.bestStage || 0)) {
      userUpdates["pacmanArcade/bestStage"] = safeStage;
    }
    if (safeDuration > (existing.bestDuration || 0)) {
      userUpdates["pacmanArcade/bestDuration"] = safeDuration;
    }

    const globalRef = ref(db, `users/${uid}/highScore`);
    const globalSnap = await get(globalRef);
    const prevGlobal = globalSnap.exists() ? globalSnap.val() : 0;
    if (safeScore > prevGlobal) {
      userUpdates["highScore"] = safeScore;
    }

    if (Object.keys(userUpdates).length > 0) {
      await update(ref(db, `users/${uid}`), userUpdates);
    }
  } catch (err) {
    console.warn("Gagal menyimpan skor Pacman:", err);
  } finally {
    // Fallback & sync local cache
    if (typeof localStorage !== "undefined") {
      const key = `pacmanArcade_${uid}`;
      const local = JSON.parse(
        localStorage.getItem(key) ||
        '{"highScore":0,"bestStage":1,"bestDuration":0,"dotsEaten":0,"ghostsEaten":0}'
      );
      local.highScore = Math.max(local.highScore || 0, safeScore);
      local.bestStage = Math.max(local.bestStage || 1, safeStage);
      local.bestDuration = Math.max(local.bestDuration || 0, safeDuration);
      local.dotsEaten = (local.dotsEaten || 0) + (Number(dotsEaten) || 0);
      local.ghostsEaten = (local.ghostsEaten || 0) + (Number(ghostsEaten) || 0);
      localStorage.setItem(key, JSON.stringify(local));
    }
  }
}

/**
 * Memuat progres dan rekor terbaik Pacman Arcade.
 * @param {string} uid
 * @returns {Promise<{highScore: number, bestStage: number, bestDuration: number}>}
 */
export async function loadPacmanProgress(uid) {
  if (!uid) {
    if (typeof localStorage === "undefined") {
      return { highScore: 0, bestStage: 1, bestDuration: 0 };
    }
    const local = JSON.parse(
      localStorage.getItem("pacmanArcade_guest") ||
      '{"highScore":0,"bestStage":1,"bestDuration":0}'
    );
    return {
      highScore: local.highScore || 0,
      bestStage: local.bestStage || 1,
      bestDuration: local.bestDuration || 0
    };
  }

  try {
    const snap = await get(ref(db, `users/${uid}/pacmanArcade`));
    if (snap.exists()) {
      const data = snap.val();
      return {
        highScore: data.highScore || 0,
        bestStage: data.bestStage || 1,
        bestDuration: data.bestDuration || 0
      };
    }
  } catch (err) {
    console.warn("Gagal memuat rekor Pacman:", err);
  }

  return { highScore: 0, bestStage: 1, bestDuration: 0 };
}
