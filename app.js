import { firebaseConfig } from "./firebase-config.js";
import { setLanguage, getLanguage, t, applyTranslations } from "./i18n.js";

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const auth = firebase.auth();

// State variables
let currentMode = 'login';
let selectedAvatar = '🚀';
let tempProfileAvatar = '🚀';

// Analytics Event Tracking (Umami)
function trackEvent(eventName, eventData = {}) {
    if (window.umami && typeof window.umami.track === 'function') {
        window.umami.track(eventName, eventData);
    }
}

function launchGame(path, id, title) {
    trackEvent('game_click', { game: id, title });
    trackEvent('game_played', { game: id });
    window.location.href = path;
}

window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'GAME_EVENT') {
        trackEvent(event.data.name || 'game_event', event.data.payload || {});
    }
});

// Load Games
async function loadGames() {
    const container = document.getElementById('game-list');
    if (!container) return;

    const response = await fetch('games.json?v=' + Date.now());
    const games = await response.json();

    if (games.length === 0) {
        container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; opacity: 0.6; font-style: italic;">${t('noNewMission')}</p>`;
        return;
    }

    container.innerHTML = '';
    games.forEach((game, idx) => {
        const card = document.createElement('div');
        card.className = 'game-card';
        const releaseDate = game.releaseDate || game.date || '';
        const canvasId = `card-anim-${idx}`;
        card.innerHTML = `
            <canvas id="${canvasId}" width="280" height="130" style="width: 100%; height: 130px; background: #070714; border: 1px dashed var(--border-color); border-radius: 4px; display: block; margin-bottom: 12px; cursor: pointer;" onclick="launchGame('${game.path}', '${game.id}', '${game.title}')"></canvas>
            <h3 style="cursor: pointer;" onclick="launchGame('${game.path}', '${game.id}', '${game.title}')">${game.title}</h3>
            <p>${game.description}</p>
            <div style="display: flex; gap: 8px; width: 100%; margin-bottom: 10px;">
                <button onclick="launchGame('${game.path}', '${game.id}', '${game.title}')" style="flex: 2; padding: 8px; font-size: 1rem;">${t('btnPlay')}</button>
                <button onclick="openLeaderboard('${game.id}', '${game.title}')" style="flex: 1; padding: 8px; font-size: 0.95rem; border-color: #f59e0b; color: #f59e0b;">${t('btnScore')}</button>
            </div>
            <small>${t('released')} ${releaseDate}</small>
        `;
        container.appendChild(card);

        // Inisialisasi animasi mini live preview per game card
        setTimeout(() => {
            initCardPreviewAnim(canvasId, game.title);
        }, 50);
    });
}

// Leaderboard Modal Logic
async function openLeaderboard(gameId, gameTitle) {
    const modal = document.getElementById('leaderboard-modal');
    const overlay = document.getElementById('leaderboard-overlay');
    const titleEl = document.getElementById('lb-game-name');
    const listEl = document.getElementById('lb-list-container');
    if (!modal) return;

    if (titleEl) titleEl.innerText = `Misi: ${gameTitle}`;
    if (listEl) listEl.innerHTML = '<p style="text-align: center; opacity: 0.7;">Memuat peringkat komandan...</p>';

    modal.style.display = 'block';
    if (overlay) overlay.style.display = 'block';

    try {
        const snap = await db.ref('users').once('value');
        const users = snap.val() || {};
        const entries = [];

        Object.keys(users).forEach(uid => {
            const u = users[uid];
            let score = 0;
            if (gameId === 'battle-mtk') {
                score = (u.battleMTK && u.battleMTK.highScore) || 0;
            } else if (gameId === 'snake-arcade') {
                score = (u.snakeArcade && u.snakeArcade.highScore) || 0;
            } else {
                score = u.highScore || 0;
            }
            if (score > 0) {
                entries.push({
                    name: u.name || 'Commander',
                    avatar: u.avatar || '🚀',
                    score: score
                });
            }
        });

        entries.sort((a, b) => b.score - a.score);

        if (entries.length === 0) {
            listEl.innerHTML = '<p style="text-align: center; opacity: 0.6; padding: 10px;">Belum ada skor tercatat. Jadilah yang pertama!</p>';
            return;
        }

        let html = '<div style="display:flex; flex-direction:column; gap:8px;">';
        entries.slice(0, 10).forEach((entry, i) => {
            const rankIcon = i === 0 ? '🥇' : (i === 1 ? '🥈' : (i === 2 ? '🥉' : `#${i+1}`));
            html += `
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed rgba(255,255,255,0.15); padding: 6px 4px;">
                    <span>${rankIcon} ${entry.avatar} ${entry.name}</span>
                    <strong style="color: #f59e0b;">${entry.score} PTS</strong>
                </div>
            `;
        });
        html += '</div>';
        listEl.innerHTML = html;
    } catch (err) {
        listEl.innerHTML = `<p style="text-align: center; color: #ef4444;">Gagal memuat: ${err.message}</p>`;
    }
}

// Flight Hours Global Leaderboard
async function openFlightHoursLeaderboard() {
    const modal = document.getElementById('leaderboard-modal');
    const overlay = document.getElementById('leaderboard-overlay');
    const titleEl = document.getElementById('lb-game-name');
    const listEl = document.getElementById('lb-list-container');
    if (!modal) return;

    if (titleEl) titleEl.innerText = `⏱ LEADERBOARD JAM TERBANG`;
    if (listEl) listEl.innerHTML = '<p style="text-align: center; opacity: 0.7;">Memuat peringkat jam terbang komandan...</p>';

    modal.style.display = 'block';
    if (overlay) overlay.style.display = 'block';

    try {
        const snap = await db.ref('users').once('value');
        const users = snap.val() || {};
        const entries = [];

        Object.keys(users).forEach(uid => {
            const u = users[uid];
            const secs = u.totalPlayTime || 0;
            if (secs > 0) {
                entries.push({
                    name: u.name || 'Commander',
                    avatar: u.avatar || '🚀',
                    totalSeconds: secs
                });
            }
        });

        entries.sort((a, b) => b.totalSeconds - a.totalSeconds);

        if (entries.length === 0) {
            listEl.innerHTML = '<p style="text-align: center; opacity: 0.6; padding: 10px;">Belum ada catatan jam terbang.</p>';
            return;
        }

        let html = '<div style="display:flex; flex-direction:column; gap:8px;">';
        entries.slice(0, 10).forEach((entry, i) => {
            const rankIcon = i === 0 ? '🥇' : (i === 1 ? '🥈' : (i === 2 ? '🥉' : `#${i+1}`));
            const h = Math.floor(entry.totalSeconds / 3600);
            const m = Math.floor((entry.totalSeconds % 3600) / 60);
            const s = entry.totalSeconds % 60;
            const timeStr = h > 0 ? `${h}j ${m}m` : (m > 0 ? `${m}m ${s}s` : `${s}s`);

            html += `
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed rgba(255,255,255,0.15); padding: 6px 4px;">
                    <span>${rankIcon} ${entry.avatar} ${entry.name}</span>
                    <strong style="color: #f59e0b;">${timeStr}</strong>
                </div>
            `;
        });
        html += '</div>';
        listEl.innerHTML = html;
    } catch (err) {
        listEl.innerHTML = `<p style="text-align: center; color: #ef4444;">Gagal memuat: ${err.message}</p>`;
    }
}

function closeLeaderboardModal() {
    const modal = document.getElementById('leaderboard-modal');
    const overlay = document.getElementById('leaderboard-overlay');
    if (modal) modal.style.display = 'none';
    if (overlay) overlay.style.display = 'none';
}

function selectProfileAvatar(av) {
    tempProfileAvatar = av;
    document.querySelectorAll('.profile-avatar-opt').forEach(el => {
        el.style.borderColor = el.innerText === av ? 'var(--border-color)' : 'transparent';
    });
}

function openProfileModal(currentName = '') {
    const modal = document.getElementById('profile-modal');
    const overlay = document.getElementById('profile-modal-overlay');
    const nameInput = document.getElementById('profile-name-input');
    if (!modal) return;

    if (nameInput) {
        nameInput.value = currentName || localStorage.getItem('user_name') || '';
    }
    selectProfileAvatar(localStorage.getItem('user_avatar') || '🚀');
    modal.style.display = 'block';
    if (overlay) overlay.style.display = 'block';
}

function closeProfileModal() {
    const modal = document.getElementById('profile-modal');
    const overlay = document.getElementById('profile-modal-overlay');
    if (modal) modal.style.display = 'none';
    if (overlay) overlay.style.display = 'none';
}

async function saveUserProfile() {
    const user = auth.currentUser;
    if (!user) return;

    const nameInput = document.getElementById('profile-name-input');
    const newName = nameInput && nameInput.value.trim() ? nameInput.value.trim() : 'Commander';
    const newAvatar = tempProfileAvatar || '🚀';

    try {
        await db.ref('users/' + user.uid).update({
            name: newName,
            avatar: newAvatar
        });

        localStorage.setItem('user_name', newName);
        localStorage.setItem('user_avatar', newAvatar);

        const userEmailEl = document.getElementById('user-email');
        if (userEmailEl) {
            userEmailEl.innerText = `${newAvatar} ${newName}`;
        }

        closeProfileModal();
    } catch (err) {
        alert("Gagal menyimpan profil: " + err.message);
    }
}

function selectAvatar(avatar) {
    selectedAvatar = avatar;
    document.querySelectorAll('.avatar-opt').forEach(el => {
        el.style.borderColor = el.innerText === avatar ? 'var(--border-color)' : 'transparent';
    });
}

function showAuthModal(mode) {
    currentMode = mode;
    const errBox = document.getElementById('auth-error-msg');
    if (errBox) errBox.style.display = 'none';

    document.getElementById('modal-title').innerText = mode === 'login' ? t('loginTitle') : t('signupTitle');
    document.getElementById('auth-submit').innerText = mode === 'login' ? t('loginTitle') : t('signupTitle');
    document.getElementById('signup-extra').style.display = mode === 'signup' ? 'block' : 'none';
    
    const forgotLink = document.getElementById('forgot-password-link');
    if (forgotLink) {
        forgotLink.style.display = mode === 'login' ? 'block' : 'none';
    }

    document.getElementById('auth-modal').style.display = 'block';
    document.getElementById('modal-overlay').style.display = 'block';
}

function closeAuthModal() {
    document.getElementById('auth-modal').style.display = 'none';
    document.getElementById('modal-overlay').style.display = 'none';
}

async function handleAuth() {
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    const name = document.getElementById('auth-name') ? document.getElementById('auth-name').value.trim() : '';
    const errBox = document.getElementById('auth-error-msg');

    if (!email || !password) {
        showAuthError("Email dan Password tidak boleh kosong!");
        return;
    }

    try {
        const userCredential = currentMode === 'login' 
            ? await auth.signInWithEmailAndPassword(email, password)
            : await auth.createUserWithEmailAndPassword(email, password);
        
        if (currentMode === 'signup') {
            await db.ref('users/' + userCredential.user.uid).set({
                name: name || 'Commander',
                avatar: selectedAvatar,
                email: email,
                highScore: 0,
                gamesPlayed: 0,
                totalPlayTime: 0
            });
            trackEvent('user_signup', { avatar: selectedAvatar });
        } else {
            trackEvent('user_login', { method: 'email' });
        }
        closeAuthModal();
    } catch (error) {
        let msg = "Terjadi kesalahan autentikasi.";
        const code = error.code || error.message || "";

        if (code.includes('wrong-password') || code.includes('invalid-credential') || code.includes('invalid-login-credentials')) {
            msg = "⚠ KATA SANDI / EMAIL SALAH! Periksa kembali kredensial Anda.";
        } else if (code.includes('user-not-found')) {
            msg = "⚠ AKUN TIDAK DITEMUKAN! Silakan daftar terlebih dahulu.";
        } else if (code.includes('invalid-email')) {
            msg = "⚠ FORMAT EMAIL TIDAK VALID!";
        } else if (code.includes('weak-password')) {
            msg = "⚠ PASSWORD TERLALU PENDEK (Min. 6 Karakter)!";
        } else if (code.includes('email-already-in-use')) {
            msg = "⚠ EMAIL SUDAH TERDAFTAR! Silakan login.";
        } else {
            msg = "⚠ " + error.message;
        }
        showAuthError(msg);
    }
}

function showAuthError(msg) {
    const errBox = document.getElementById('auth-error-msg');
    if (errBox) {
        errBox.innerText = msg;
        errBox.style.display = 'block';
    }
}

async function handleForgotPassword() {
    const email = document.getElementById('auth-email').value;
    if (!email) {
        alert("Masukkan alamat email Anda terlebih dahulu di kolom Email!");
        return;
    }

    try {
        await auth.sendPasswordResetEmail(email);
        alert(`Tautan pemulihan kata sandi telah dikirim ke ${email}. Silakan periksa kotak masuk email Anda!`);
    } catch (error) {
        alert("Gagal mengirim email reset: " + error.message);
    }
}

function logout() {
    trackEvent('user_logout');
    auth.signOut();
}

const pageStartTime = Date.now();
const MIN_LOADER_TIME = 2000; // Minimal 2 detik animasi memuat data

function hideLoader() {
    const elapsed = Date.now() - pageStartTime;
    const delay = Math.max(0, MIN_LOADER_TIME - elapsed);
    setTimeout(() => {
        const loader = document.getElementById('loader');
        if (loader && !loader.classList.contains('fade-out')) {
            loader.classList.add('fade-out');
            setTimeout(() => {
                loader.style.display = 'none';
            }, 500);
        }
    }, delay);
}

auth.onAuthStateChanged(async user => {
    const isLandingPage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/');
    const isDashboardPage = window.location.pathname.endsWith('dashboard.html');

    if (user) {
        // Ambil data profil dari Realtime Database
        const snapshot = await db.ref('users/' + user.uid).once('value');
        const data = snapshot.val() || {};
        const displayName = data.name || user.email;
        const avatar = data.avatar || '🚀';

        localStorage.setItem('user_name', displayName);
        localStorage.setItem('user_avatar', avatar);

        // Jika user sudah login dan sedang di landing page, redirect ke dashboard misi
        if (isLandingPage) {
            window.location.href = 'dashboard.html';
            return;
        }

        // Listener Realtime untuk data profil & jam terbang komandan
        db.ref('users/' + user.uid).on('value', snap => {
            const val = snap.val() || {};
            const curName = val.name || user.email;
            const curAvatar = val.avatar || '🚀';
            const totalSecs = val.totalPlayTime || 0;

            const userEmailEl = document.getElementById('user-email');
            if (userEmailEl) {
                userEmailEl.innerText = `${curAvatar} ${curName}`;
            }

            const flightHoursEl = document.getElementById('user-flight-hours');
            if (flightHoursEl) {
                const hours = Math.floor(totalSecs / 3600);
                const minutes = Math.floor((totalSecs % 3600) / 60);
                const seconds = totalSecs % 60;
                const prefix = t('flightHours');

                if (hours > 0) {
                    flightHoursEl.innerText = `${prefix} ${hours}j ${minutes}m`;
                } else if (minutes > 0) {
                    flightHoursEl.innerText = `${prefix} ${minutes}m ${seconds}s`;
                } else {
                    flightHoursEl.innerText = `${prefix} ${seconds}s`;
                }
            }
        });

        // Popup otomatis jika nama belum pernah diatur
        if (!data.name && isDashboardPage) {
            openProfileModal('');
        }

        loadGames();
        hideLoader();
    } else {
        localStorage.removeItem('user_name');
        localStorage.removeItem('user_avatar');

        // Jika belum login tapi coba akses dashboard.html, tendang ke index.html
        if (isDashboardPage) {
            window.location.href = 'index.html';
            return;
        }
        hideLoader();
    }
});

loadGames();

// Canvas Space Effect
const canvas = document.getElementById('space-canvas');
const ctx = canvas.getContext('2d');

let stars = [];
let debris = [];

// Theme Changer Variables
let currentBg = '#050505';
let currentColor = '#00ff41';

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Warp-speed Stars
for (let i = 0; i < 200; i++) {
    stars.push({
        x: (Math.random() - 0.5) * canvas.width * 2,
        y: (Math.random() - 0.5) * canvas.height * 2,
        z: Math.random() * canvas.width
    });
}

// Floating Space Debris (Pixel Asteroids/Tech)
for (let i = 0; i < 8; i++) {
    debris.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 20 + 10,
        speedX: (Math.random() - 0.5) * 0.8,
        speedY: (Math.random() - 0.5) * 0.8,
        rot: Math.random() * Math.PI,
        rotSpeed: (Math.random() - 0.5) * 0.02
    });
}

function animate() {
    ctx.fillStyle = currentBg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    // Draw Warp Stars (Expanding from Center)
    ctx.fillStyle = currentColor;
    stars.forEach(star => {
        star.z -= 2;
        if (star.z <= 0) star.z = canvas.width;

        const k = 250 / star.z;
        const px = star.x * k + cx;
        const py = star.y * k + cy;

        if (px >= 0 && px <= canvas.width && py >= 0 && py <= canvas.height) {
            const size = Math.max((1 - star.z / canvas.width) * 3, 0.5);
            ctx.beginPath();
            ctx.arc(px, py, size, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    // Draw Floating Space Debris
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = 1.5;
    debris.forEach(d => {
        d.x += d.speedX;
        d.y += d.speedY;
        d.rot += d.rotSpeed;

        if (d.x < -50) d.x = canvas.width + 50;
        if (d.x > canvas.width + 50) d.x = -50;
        if (d.y < -50) d.y = canvas.height + 50;
        if (d.y > canvas.height + 50) d.y = -50;

        ctx.save();
        ctx.translate(d.x, d.y);
        ctx.rotate(d.rot);
        ctx.strokeRect(-d.size / 2, -d.size / 2, d.size, d.size);
        ctx.strokeRect(-d.size / 4, -d.size / 4, d.size / 2, d.size / 2);
        ctx.restore();
    });

    requestAnimationFrame(animate);
}
animate();

// Typing Effect for Game Types
const gameTypes = ["Arcade", "Puzzle", "Action", "Strategy", "Retro Clicker", "Sci-Fi Racer"];
let typeIdx = 0;
let charIdx = 0;
let isDeleting = false;

function typeEffect() {
    const target = document.getElementById('typing-game-type');
    if (!target) return;

    const currentWord = gameTypes[typeIdx];
    
    if (isDeleting) {
        target.innerText = currentWord.substring(0, charIdx - 1);
        charIdx--;
    } else {
        target.innerText = currentWord.substring(0, charIdx + 1);
        charIdx++;
    }

    let typeSpeed = isDeleting ? 80 : 150;

    if (!isDeleting && charIdx === currentWord.length) {
        typeSpeed = 2500;
        isDeleting = true;
    } else if (isDeleting && charIdx === 0) {
        isDeleting = false;
        typeIdx = (typeIdx + 1) % gameTypes.length;
        typeSpeed = 800;
    }

    setTimeout(typeEffect, typeSpeed);
}
typeEffect();

// Theme Changer
function updateFavicon(colorHex) {
    const favicon = document.getElementById('dynamic-favicon');
    if (!favicon) return;
    const cleanHex = encodeURIComponent(colorHex);
    favicon.href = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='${cleanHex}'><path d='M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm3-3c-.83 0-1.5-.67-1.5-1.5S17.67 9 18.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z'/></svg>`;
}

function setTheme(theme) {
    document.body.className = '';
    localStorage.setItem('hub_selected_theme', theme);

    if (theme === 'green') {
        document.body.classList.add('theme-green');
        currentBg = '#050505';
        currentColor = '#00ff41';
        updateFavicon('#00ff41');
    } else if (theme === 'light') {
        document.body.classList.add('theme-light');
        currentBg = '#f1f5f9';
        currentColor = '#0284c7';
        updateFavicon('#0284c7');
    } else {
        // Default: Midnight Purple
        document.body.classList.add('theme-purple');
        currentBg = '#0b0114';
        currentColor = '#d946ef';
        updateFavicon('#d946ef');
    }
}

// Inisialisasi tema default Midnight Purple atau dari pilihan tersimpan
const initialTheme = localStorage.getItem('hub_selected_theme') || 'purple';
setTheme(initialTheme);

// Floating Theme & Language Click Logic
const themeOptions = document.getElementById('theme-options');
const langOptions = document.getElementById('lang-options');

function toggleThemeMenu() {
    if (themeOptions) {
        themeOptions.style.display = themeOptions.style.display === 'flex' ? 'none' : 'flex';
    }
    if (langOptions) langOptions.style.display = 'none';
}

function toggleLangMenu() {
    if (langOptions) {
        langOptions.style.display = langOptions.style.display === 'flex' ? 'none' : 'flex';
    }
    if (themeOptions) themeOptions.style.display = 'none';
}

function switchLanguage(lang) {
    setLanguage(lang);
    if (langOptions) langOptions.style.display = 'none';
    loadGames();
}

// Close menus only when clicking outside
document.addEventListener('click', (e) => {
    const themeContainer = document.getElementById('theme-floating-container');
    if (themeContainer && !themeContainer.contains(e.target)) {
        if (themeOptions) themeOptions.style.display = 'none';
    }
    const langContainer = document.getElementById('lang-floating-container');
    if (langContainer && !langContainer.contains(e.target)) {
        if (langOptions) langOptions.style.display = 'none';
    }
});

// Retro Sci-Fi Audio Synthesizer (Web Audio API)
let audioCtx = null;
let isAudioMuted = localStorage.getItem('hub_audio_muted') === 'true';
let ambientOsc = null;
let ambientGain = null;
let bgmInterval = null;

// Nada Arpeggio Sci-Fi Space Melodi (Hz)
const spaceScale = [220, 261.63, 329.63, 392, 440, 523.25, 659.25, 783.99]; // Am pentatonic

function initAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function updateMuteButtonUI() {
    const btn = document.getElementById('audio-toggle-btn');
    if (btn) {
        btn.innerText = isAudioMuted ? '🔇' : '🔊';
        btn.style.opacity = isAudioMuted ? '0.6' : '1';
    }
}

function toggleAudio() {
    initAudioContext();
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    isAudioMuted = !isAudioMuted;
    localStorage.setItem('hub_audio_muted', String(isAudioMuted));
    updateMuteButtonUI();

    if (isAudioMuted) {
        stopAmbientSound();
        stopSpaceBgm();
    } else {
        playAmbientSound();
        startSpaceBgm();
        playRetroClickSound();
    }
}

function playRetroClickSound() {
    if (isAudioMuted) return;
    initAudioContext();
    if (!audioCtx) return;

    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.08);

        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start();
        osc.stop(audioCtx.currentTime + 0.08);
    } catch (e) {}
}

function playAmbientSound() {
    if (isAudioMuted || ambientOsc) return;
    initAudioContext();
    if (!audioCtx) return;

    try {
        ambientOsc = audioCtx.createOscillator();
        ambientGain = audioCtx.createGain();

        ambientOsc.type = 'sine';
        ambientOsc.frequency.setValueAtTime(55, audioCtx.currentTime);

        ambientGain.gain.setValueAtTime(0.001, audioCtx.currentTime);
        ambientGain.gain.linearRampToValueAtTime(0.025, audioCtx.currentTime + 1.5);

        ambientOsc.connect(ambientGain);
        ambientGain.connect(audioCtx.destination);

        ambientOsc.start();
    } catch (e) {}
}

function stopAmbientSound() {
    if (ambientGain && audioCtx) {
        try {
            ambientGain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
            setTimeout(() => {
                if (ambientOsc) {
                    ambientOsc.stop();
                    ambientOsc.disconnect();
                    ambientOsc = null;
                }
            }, 300);
        } catch (e) {
            ambientOsc = null;
        }
    } else if (ambientOsc) {
        ambientOsc = null;
    }
}

// Chiptune / Synthwave Ambient BGM Generator
let noteIndex = 0;
function playBgmNote() {
    if (isAudioMuted || !audioCtx) return;

    try {
        const freq = spaceScale[noteIndex % spaceScale.length];
        noteIndex = (noteIndex + (Math.random() > 0.3 ? 1 : 2)) % spaceScale.length;

        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

        gain.gain.setValueAtTime(0.015, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.6);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start();
        osc.stop(audioCtx.currentTime + 0.6);
    } catch (e) {}
}

function startSpaceBgm() {
    if (bgmInterval || isAudioMuted) return;
    playBgmNote();
    bgmInterval = setInterval(playBgmNote, 350); // Tempo melodi sci-fi
}

function stopSpaceBgm() {
    if (bgmInterval) {
        clearInterval(bgmInterval);
        bgmInterval = null;
    }
}

// Inisialisasi status audio awal
updateMuteButtonUI();

// Auto-start audio pada interaksi pertama jika tidak mute
document.addEventListener('click', () => {
    if (!isAudioMuted && (!audioCtx || audioCtx.state === 'suspended' || !bgmInterval)) {
        initAudioContext();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        playAmbientSound();
        startSpaceBgm();
    }
}, { once: true });

// Putar efek klik pada tombol
document.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON' && e.target.id !== 'audio-toggle-btn') {
        playRetroClickSound();
    }
});

// Pixel Preview Animation for Landing Page
function initPreviewAnimation() {
    const pCanvas = document.getElementById('preview-anim-canvas');
    if (!pCanvas) return;
    const pCtx = pCanvas.getContext('2d');

    let shipX = 60;
    let shipY = 110;
    let laser = null;
    let target = { x: 380, y: 110, size: 30 };
    let stars = [];

    for (let i = 0; i < 35; i++) {
        stars.push({
            x: Math.random() * pCanvas.width,
            y: Math.random() * pCanvas.height,
            speed: Math.random() * 2 + 1
        });
    }

    function loop() {
        pCtx.fillStyle = '#060614';
        pCtx.fillRect(0, 0, pCanvas.width, pCanvas.height);

        // Bintang latar
        pCtx.fillStyle = '#444466';
        stars.forEach(s => {
            pCtx.fillRect(s.x, s.y, 2, 2);
            s.x -= s.speed;
            if (s.x < 0) s.x = pCanvas.width;
        });

        // Kapal pemain
        shipY = 110 + Math.sin(Date.now() / 250) * 20;
        pCtx.fillStyle = '#00ff41';
        pCtx.beginPath();
        pCtx.moveTo(shipX + 15, shipY);
        pCtx.lineTo(shipX - 20, shipY - 14);
        pCtx.lineTo(shipX - 10, shipY);
        pCtx.lineTo(shipX - 20, shipY + 14);
        pCtx.closePath();
        pCtx.fill();

        // Laser Tembakan
        if (!laser && Math.random() > 0.94) {
            laser = { x: shipX + 20, y: shipY };
        }

        if (laser) {
            pCtx.fillStyle = '#f59e0b';
            pCtx.fillRect(laser.x, laser.y - 3, 22, 6);
            laser.x += 14;

            if (laser.x >= target.x - 15) {
                // Ledakan partikel kecil
                pCtx.fillStyle = '#ef4444';
                pCtx.beginPath();
                pCtx.arc(target.x, target.y, 22, 0, Math.PI * 2);
                pCtx.fill();
                laser = null;
            }
        }

        // Alien Boss MTK
        target.y = 110 + Math.cos(Date.now() / 350) * 30;
        pCtx.fillStyle = '#a855f7';
        pCtx.fillRect(target.x - target.size / 2, target.y - target.size / 2, target.size, target.size);
        pCtx.fillStyle = '#ffffff';
        pCtx.font = '16px monospace';
        pCtx.fillText('MTK', target.x - 14, target.y + 6);

        // Overlay status
        pCtx.fillStyle = '#00ff41';
        pCtx.font = '12px monospace';
        pCtx.fillText('● LIVE GAMEPLAY SIMULATION', 15, 25);

        requestAnimationFrame(loop);
    }
    loop();
}
initPreviewAnimation();

// Mini Animation for Game Card Preview in dashboard.html
function initCardPreviewAnim(canvasId, title) {
    const c = document.getElementById(canvasId);
    if (!c) return;
    const ctx = c.getContext('2d');

    let x = 30;
    let y = 65;
    let sparks = [];

    function render() {
        ctx.fillStyle = '#060612';
        ctx.fillRect(0, 0, c.width, c.height);

        // Grid retro scan lines
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 1;
        for (let gy = 0; gy < c.height; gy += 15) {
            ctx.beginPath();
            ctx.moveTo(0, gy);
            ctx.lineTo(c.width, gy);
            ctx.stroke();
        }

        // Variasi preview jika kartu adalah Snake Arcade
        if (title && title.toLowerCase().includes('snake')) {
            const t = Date.now() / 250;
            ctx.fillStyle = '#22c55e';
            for (let i = 0; i < 5; i++) {
                const sx = 90 + (i * 14) + Math.sin(t + i * 0.6) * 10;
                const sy = 65 + Math.cos(t + i * 0.6) * 8;
                ctx.fillRect(sx, sy, 10, 10);
            }
            ctx.fillStyle = '#d946ef';
            ctx.fillRect(195, 62, 10, 10);

            ctx.fillStyle = '#22c55e';
            ctx.font = '10px monospace';
            ctx.fillText('WORM PROTOCOL LIVE', 12, 20);

            requestAnimationFrame(render);
            return;
        }

        // Animasi karakter pesawat / icon
        x = 50 + Math.sin(Date.now() / 300) * 15;
        y = 65 + Math.cos(Date.now() / 250) * 10;

        ctx.fillStyle = '#00ff41';
        ctx.font = '24px monospace';
        ctx.fillText('🚀', x, y);

        // Monster matematika bergerak
        const bossX = 200 + Math.sin(Date.now() / 400) * 12;
        const bossY = 65 + Math.cos(Date.now() / 300) * 12;
        ctx.fillStyle = '#a855f7';
        ctx.font = '22px monospace';
        ctx.fillText('👾', bossX, bossY);

        // Efek proyektil laser berulang
        const laserProg = (Date.now() % 1200) / 1200;
        const lx = x + 25 + laserProg * (bossX - x);
        const ly = y - 6;
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(lx, ly, 10, 3);

        // Label nama misi
        ctx.fillStyle = '#38bdf8';
        ctx.font = '10px monospace';
        ctx.fillText('SIMULASI LIVE', 12, 20);

        requestAnimationFrame(render);
    }
    render();
}

// Global Error Handling & Toast Notification
function showToast(msg, isError = true) {
    let toast = document.getElementById('retro-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'retro-toast';
        toast.style.cssText = 'position:fixed;bottom:75px;left:50%;transform:translateX(-50%);padding:10px 18px;border-radius:4px;font-family:"VT323",monospace;font-size:1.25rem;z-index:999999;transition:opacity 0.3s ease;pointer-events:none;box-shadow:0 0 15px rgba(0,0,0,0.8);text-align:center;';
        document.body.appendChild(toast);
    }
    toast.style.background = isError ? 'rgba(220, 38, 38, 0.95)' : 'rgba(22, 163, 74, 0.95)';
    toast.style.color = '#ffffff';
    toast.style.border = isError ? '2px solid #ef4444' : '2px solid #22c55e';
    toast.innerText = msg;
    toast.style.opacity = '1';
    setTimeout(() => {
        toast.style.opacity = '0';
    }, 4000);
}

window.addEventListener('error', (event) => {
    if (window.Sentry && typeof Sentry.captureException === 'function') {
        Sentry.captureException(event.error || new Error(event.message));
    }
    showToast(`⚠ Sistem: ${event.message || 'Kesalahan sistem'}`);
});

window.addEventListener('unhandledrejection', (event) => {
    if (window.Sentry && typeof Sentry.captureException === 'function') {
        Sentry.captureException(event.reason);
    }
    const msg = event.reason?.message || event.reason || 'Unhandled Promise';
    showToast(`⚠ Kesalahan: ${msg}`);
});

// Inisialisasi awal bahasa
setLanguage(getLanguage());

// Expose functions globally for inline HTML event handlers
Object.assign(window, {
    showAuthModal,
    closeAuthModal,
    handleAuth,
    handleForgotPassword,
    selectAvatar,
    openProfileModal,
    closeProfileModal,
    saveUserProfile,
    selectProfileAvatar,
    openLeaderboard,
    closeLeaderboardModal,
    openFlightHoursLeaderboard,
    logout,
    toggleAudio,
    toggleThemeMenu,
    setTheme,
    toggleLangMenu,
    switchLanguage,
    loadGames,
    showToast,
    launchGame,
    trackEvent
});