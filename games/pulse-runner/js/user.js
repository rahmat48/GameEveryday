/**
 * user.js
 * Modul integrasi Firebase Auth & Realtime Database untuk Pulse Runner.
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
 * @param {number} addedPlayTime
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

const DEFAULT_PROGRESS = { highScore: 0, bestDistance: 0, bestCombo: 0 };

/**
 * Menyimpan skor Pulse Runner ke Firebase Realtime Database / LocalStorage (guest).
 * @param {string|null} uid
 * @param {number} score
 * @param {number} distance meter
 * @param {number} bestCombo multiplier tertinggi
 */
export async function saveRunnerScore(uid, score, distance, bestCombo) {
  if (!uid) {
    const local = JSON.parse(localStorage.getItem("pulseRunner_guest") || JSON.stringify(DEFAULT_PROGRESS));
    local.highScore = Math.max(local.highScore || 0, score);
    local.bestDistance = Math.max(local.bestDistance || 0, Math.round(distance));
    local.bestCombo = Math.max(local.bestCombo || 0, bestCombo);
    localStorage.setItem("pulseRunner_guest", JSON.stringify(local));
    return;
  }

  try {
    const runnerRef = ref(db, `users/${uid}/pulseRunner`);
    const snap = await get(runnerRef);
    const existing = snap.exists() ? snap.val() : { ...DEFAULT_PROGRESS };

    const updates = {};
    if (score > (existing.highScore || 0)) {
      updates[`users/${uid}/pulseRunner/highScore`] = score;
    }
    if (Math.round(distance) > (existing.bestDistance || 0)) {
      updates[`users/${uid}/pulseRunner/bestDistance`] = Math.round(distance);
    }
    if (bestCombo > (existing.bestCombo || 0)) {
      updates[`users/${uid}/pulseRunner/bestCombo`] = bestCombo;
    }

    const globalRef = ref(db, `users/${uid}/highScore`);
    const globalSnap = await get(globalRef);
    const prevGlobal = globalSnap.exists() ? globalSnap.val() : 0;
    if (score > prevGlobal) {
      updates[`users/${uid}/highScore`] = score;
    }

    if (Object.keys(updates).length > 0) {
      await update(ref(db), updates);
    }
  } catch (err) {
    console.warn("Gagal menyimpan skor Pulse Runner:", err);
  }
}

/**
 * Memuat rekor terbaik Pulse Runner.
 * @param {string|null} uid
 * @returns {Promise<{highScore: number, bestDistance: number, bestCombo: number}>}
 */
export async function loadRunnerProgress(uid) {
  if (!uid) {
    const local = JSON.parse(localStorage.getItem("pulseRunner_guest") || JSON.stringify(DEFAULT_PROGRESS));
    return { ...DEFAULT_PROGRESS, ...local };
  }

  try {
    const snap = await get(ref(db, `users/${uid}/pulseRunner`));
    if (snap.exists()) {
      const data = snap.val();
      return {
        highScore: data.highScore || 0,
        bestDistance: data.bestDistance || 0,
        bestCombo: data.bestCombo || 0
      };
    }
  } catch (err) {
    console.warn("Gagal memuat rekor Pulse Runner:", err);
  }

  return { ...DEFAULT_PROGRESS };
}
