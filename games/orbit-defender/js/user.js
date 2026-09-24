/**
 * user.js
 * Modul integrasi Firebase Auth & Realtime Database untuk Orbit Defender.
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
 * Menyimpan skor Orbit Defender ke Firebase Realtime Database / LocalStorage.
 * @param {string} uid
 * @param {number} score
 * @param {number} wave
 * @param {number} duration
 */
export async function saveDefenderScore(uid, score, wave, duration) {
  if (!uid) {
    const local = JSON.parse(localStorage.getItem("orbitDefender_guest") || '{"highScore":0,"bestWave":1,"bestDuration":0}');
    local.highScore = Math.max(local.highScore, score);
    local.bestWave = Math.max(local.bestWave, wave);
    local.bestDuration = Math.max(local.bestDuration, Math.round(duration));
    localStorage.setItem("orbitDefender_guest", JSON.stringify(local));
    return;
  }

  try {
    const defenderRef = ref(db, `users/${uid}/orbitDefender`);
    const snap = await get(defenderRef);
    const existing = snap.exists() ? snap.val() : { highScore: 0, bestWave: 1, bestDuration: 0 };

    const updates = {};
    if (score > (existing.highScore || 0)) {
      updates[`users/${uid}/orbitDefender/highScore`] = score;
    }
    if (wave > (existing.bestWave || 0)) {
      updates[`users/${uid}/orbitDefender/bestWave`] = wave;
    }
    if (duration > (existing.bestDuration || 0)) {
      updates[`users/${uid}/orbitDefender/bestDuration`] = Math.round(duration);
    }

    // Update global highScore profil jika skor lebih tinggi
    const userSnap = await get(ref(db, `users/${uid}/highScore`));
    const globalHighScore = userSnap.exists() ? userSnap.val() : 0;
    if (score > globalHighScore) {
      updates[`users/${uid}/highScore`] = score;
    }

    if (Object.keys(updates).length > 0) {
      await update(ref(db), updates);
    }
  } catch (err) {
    console.warn("Gagal menyimpan skor Orbit Defender:", err);
  }
}

/**
 * Memuat progres tersimpan user untuk Orbit Defender.
 * @param {string} uid
 * @returns {Promise<{highScore: number, bestWave: number, bestDuration: number}>}
 */
export async function loadDefenderProgress(uid) {
  if (!uid) {
    return JSON.parse(localStorage.getItem("orbitDefender_guest") || '{"highScore":0,"bestWave":1,"bestDuration":0}');
  }

  try {
    const snap = await get(ref(db, `users/${uid}/orbitDefender`));
    if (snap.exists()) {
      const data = snap.val();
      return {
        highScore: data.highScore || 0,
        bestWave: data.bestWave || 1,
        bestDuration: data.bestDuration || 0
      };
    }
    return { highScore: 0, bestWave: 1, bestDuration: 0 };
  } catch (err) {
    console.warn("Gagal memuat rekor:", err);
    return { highScore: 0, bestWave: 1, bestDuration: 0 };
  }
}
