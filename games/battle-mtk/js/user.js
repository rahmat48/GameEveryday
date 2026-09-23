/**
 * user.js
 * Modul integrasi Firebase Auth & Realtime Database untuk Battle MTK dengan fallback localStorage.
 */

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getDatabase, ref, get, set, update, increment } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBtIJ1m2Jcg_4xUzeDeobhWN3H4KjXyAls",
  authDomain: "gameeveryday-98db3.firebaseapp.com",
  databaseURL: "https://gameeveryday-98db3-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "gameeveryday-98db3",
  storageBucket: "gameeveryday-98db3.firebasestorage.app",
  messagingSenderId: "447356300912",
  appId: "1:447356300912:web:68c10f6b66762bce4b0eb5",
  measurementId: "G-TJK71F081W"
};

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
 * Menyimpan skor pertarungan, bintang stage, dan memperbarui high score.
 * @param {string} uid
 * @param {number} stage
 * @param {number} score
 * @param {number} stars
 * @param {number} bestCombo
 */
export async function saveBattleScore(uid, stage, score, stars, bestCombo = 0) {
  if (!uid) {
    // Fallback simpan ke localStorage jika user tamu
    const local = JSON.parse(localStorage.getItem("battleMTK_guest") || '{"highScore":0,"stages":{}}');
    if (!local.stages[stage] || score > (local.stages[stage].score || 0)) {
      local.stages[stage] = { score, stars, bestCombo };
    }
    if (score > (local.highScore || 0)) {
      local.highScore = score;
    }
    localStorage.setItem("battleMTK_guest", JSON.stringify(local));
    return;
  }

  try {
    const stageRef = ref(db, `users/${uid}/battleMTK/stages/${stage}`);
    const stageSnap = await get(stageRef);
    const existing = stageSnap.exists() ? stageSnap.val() : { score: 0, stars: 0 };

    const updates = {};
    if (score > (existing.score || 0) || stars > (existing.stars || 0)) {
      updates[`users/${uid}/battleMTK/stages/${stage}`] = {
        score: Math.max(score, existing.score || 0),
        stars: Math.max(stars, existing.stars || 0),
        bestCombo: Math.max(bestCombo, existing.bestCombo || 0)
      };
    }

    const battleRef = ref(db, `users/${uid}/battleMTK/highScore`);
    const battleSnap = await get(battleRef);
    const prevBattleHigh = battleSnap.exists() ? battleSnap.val() : 0;
    if (score > prevBattleHigh) {
      updates[`users/${uid}/battleMTK/highScore`] = score;
    }

    const globalRef = ref(db, `users/${uid}/highScore`);
    const globalSnap = await get(globalRef);
    const prevGlobalHigh = globalSnap.exists() ? globalSnap.val() : 0;
    if (score > prevGlobalHigh) {
      updates[`users/${uid}/highScore`] = score;
    }

    if (Object.keys(updates).length > 0) {
      await update(ref(db), updates);
    }
  } catch (err) {
    console.warn("Gagal simpan skor ke Firebase, fallback localStorage:", err);
    const key = `battleMTK_${uid}`;
    const local = JSON.parse(localStorage.getItem(key) || '{"highScore":0,"stages":{}}');
    local.stages[stage] = { score, stars, bestCombo };
    if (score > (local.highScore || 0)) local.highScore = score;
    localStorage.setItem(key, JSON.stringify(local));
  }
}

/**
 * Memuat progres permainan Battle MTK user.
 * @param {string} uid
 * @returns {Promise<{ highScore: number, stages: object }>}
 */
export async function loadBattleProgress(uid) {
  const defaultProgress = { highScore: 0, stages: {} };
  if (!uid) {
    const local = localStorage.getItem("battleMTK_guest");
    return local ? JSON.parse(local) : defaultProgress;
  }

  try {
    const snap = await get(ref(db, `users/${uid}/battleMTK`));
    if (snap.exists()) {
      const val = snap.val();
      return {
        highScore: val.highScore || 0,
        stages: val.stages || {}
      };
    }
    return defaultProgress;
  } catch (err) {
    console.warn("Gagal membaca progres dari Firebase:", err);
    const local = localStorage.getItem(`battleMTK_${uid}`);
    return local ? JSON.parse(local) : defaultProgress;
  }
}
