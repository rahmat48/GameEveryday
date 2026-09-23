/**
 * user.js
 * Modul integrasi Firebase Auth & Realtime Database untuk Snake Arcade (Data Worm).
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

/**
 * Menyimpan skor Snake Arcade ke Firebase Realtime Database / LocalStorage.
 * @param {string} uid
 * @param {number} score
 * @param {number} length
 * @param {number} duration
 */
export async function saveSnakeScore(uid, score, length, duration) {
  if (!uid) {
    const local = JSON.parse(localStorage.getItem("snakeArcade_guest") || '{"highScore":0,"highLength":0,"bestDuration":0}');
    local.highScore = Math.max(local.highScore, score);
    local.highLength = Math.max(local.highLength, length);
    local.bestDuration = Math.max(local.bestDuration, Math.round(duration));
    localStorage.setItem("snakeArcade_guest", JSON.stringify(local));
    return;
  }

  try {
    const snakeRef = ref(db, `users/${uid}/snakeArcade`);
    const snap = await get(snakeRef);
    const existing = snap.exists() ? snap.val() : { highScore: 0, highLength: 0, bestDuration: 0 };

    const updates = {};
    if (score > (existing.highScore || 0)) {
      updates[`users/${uid}/snakeArcade/highScore`] = score;
    }
    if (length > (existing.highLength || 0)) {
      updates[`users/${uid}/snakeArcade/highLength`] = length;
    }
    if (duration > (existing.bestDuration || 0)) {
      updates[`users/${uid}/snakeArcade/bestDuration`] = Math.round(duration);
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
    console.warn("Gagal menyimpan skor Snake:", err);
  }
}

/**
 * Memuat progres dan rekor terbaik Snake Arcade.
 * @param {string} uid
 * @returns {Promise<{highScore: number, highLength: number, bestDuration: number}>}
 */
export async function loadSnakeProgress(uid) {
  if (!uid) {
    const local = JSON.parse(localStorage.getItem("snakeArcade_guest") || '{"highScore":0,"highLength":0,"bestDuration":0}');
    return local;
  }

  try {
    const snap = await get(ref(db, `users/${uid}/snakeArcade`));
    if (snap.exists()) {
      const data = snap.val();
      return {
        highScore: data.highScore || 0,
        highLength: data.highLength || 0,
        bestDuration: data.bestDuration || 0
      };
    }
  } catch (err) {
    console.warn("Gagal memuat rekor Snake:", err);
  }

  return { highScore: 0, highLength: 0, bestDuration: 0 };
}
