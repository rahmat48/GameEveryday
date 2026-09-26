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
            <canvas id="${canvasId}" width="280" height="130" style="width: 100%; height: 130px; background: #070714; border: 2px solid var(--border-color); box-shadow: 0 0 10px var(--glow-color); border-radius: 6px; display: block; margin-bottom: 12px; cursor: pointer; box-sizing: border-box;" onclick="launchGame('${game.path}', '${game.id}', '${game.title}')"></canvas>
            <h3 style="cursor: pointer;" onclick="launchGame('${game.path}', '${game.id}', '${game.title}')">${game.title}</h3>
            <p>${game.description}</p>
            <div class="card-actions">
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
            } else if (gameId === 'orbit-defender') {
                score = (u.orbitDefender && u.orbitDefender.highScore) || 0;
            } else if (gameId === 'pacman-arcade') {
                score = (u.pacmanArcade && u.pacmanArcade.highScore) || 0;
            } else if (gameId === 'pulse-runner') {
                score = (u.pulseRunner && u.pulseRunner.highScore) || 0;
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
            avatar: newAvatar,
            email: user.email || ''
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

    const stars = [];
    for (let i = 0; i < 40; i++) {
        stars.push({
            x: Math.random() * pCanvas.width,
            y: Math.random() * pCanvas.height,
            speed: Math.random() * 2 + 1,
            size: Math.random() < 0.3 ? 2 : 1
        });
    }

    const demoGames = [
        {
            mode: "battle-mtk",
            label: "● MISSION 1: BATTLE MTK (MATH DUEL)",
            badgeCol: "#a855f7",
            problems: [
                { q: "8 x 9 = ?", ans: "72", opts: ["64", "72", "81"] },
                { q: "48 / 6 = ?", ans: "8", opts: ["7", "8", "9"] },
                { q: "35 + 27 = ?", ans: "62", opts: ["52", "62", "72"] }
            ]
        },
        {
            mode: "snake-arcade",
            label: "● MISSION 2: SNAKE ARCADE (DATA WORM)",
            badgeCol: "#22c55e"
        },
        {
            mode: "orbit-defender",
            label: "● MISSION 3: ORBIT DEFENDER (360° TURRET)",
            badgeCol: "#00d4ff"
        },
        {
            mode: "pacman-arcade",
            label: "● MISSION 4: PACMAN ARCADE (GHOST CHASE)",
            badgeCol: "#facc15"
        },
        {
            mode: "pulse-runner",
            label: "● MISSION 5: PULSE RUNNER (GRAVITY TUNNEL)",
            badgeCol: "#00d4ff"
        }
    ];

    let particles = [];

    function loop() {
        pCtx.fillStyle = '#060614';
        pCtx.fillRect(0, 0, pCanvas.width, pCanvas.height);

        // Retro CRT Scanlines
        pCtx.strokeStyle = 'rgba(255,255,255,0.035)';
        pCtx.lineWidth = 1;
        for (let gy = 0; gy < pCanvas.height; gy += 8) {
            pCtx.beginPath();
            pCtx.moveTo(0, gy);
            pCtx.lineTo(pCanvas.width, gy);
            pCtx.stroke();
        }

        // Bintang latar
        pCtx.fillStyle = '#64748b';
        stars.forEach(s => {
            pCtx.fillRect(s.x, s.y, s.size, s.size);
            s.x -= s.speed;
            if (s.x < 0) s.x = pCanvas.width;
        });

        // Partikel ledakan
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            pCtx.fillStyle = p.col;
            pCtx.fillRect(p.x, p.y, p.size, p.size);
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.05;
            if (p.life <= 0) particles.splice(i, 1);
        }

        // Berganti mode showcase setiap 4 detik
        const totalCycle = Date.now() / 4000;
        const activeGameIdx = Math.floor(totalCycle) % demoGames.length;
        const curGame = demoGames[activeGameIdx];
        const cycleProgress = (Date.now() % 4000) / 4000;

        // Label status simulator di pojok kiri atas
        pCtx.fillStyle = curGame.badgeCol;
        pCtx.font = 'bold 11px monospace';
        pCtx.textAlign = 'left';
        pCtx.fillText(curGame.label, 16, 24);

        if (curGame.mode === "battle-mtk") {
            // SHOWCASE BATTLE MTK
            const subIdx = Math.floor(Date.now() / 2000) % curGame.problems.length;
            const prob = curGame.problems[subIdx];
            const shootProg = (Date.now() % 2000) / 2000;

            // Box Soal Matematika Neon
            pCtx.fillStyle = 'rgba(15, 23, 42, 0.9)';
            pCtx.strokeStyle = '#f59e0b';
            pCtx.lineWidth = 2;
            pCtx.fillRect(pCanvas.width / 2 - 90, 42, 180, 32);
            pCtx.strokeRect(pCanvas.width / 2 - 90, 42, 180, 32);

            pCtx.fillStyle = '#f59e0b';
            pCtx.font = 'bold 18px monospace';
            pCtx.textAlign = 'center';
            pCtx.fillText(prob.q, pCanvas.width / 2, 64);

            // Pesawat Komandan (Kiri)
            const shipX = 70;
            const shipY = 145 + Math.sin(Date.now() / 250) * 12;
            pCtx.font = '30px monospace';
            pCtx.fillText('🚀', shipX, shipY);

            // Boss Monster Matematika (Kanan)
            const bossX = 410;
            const bossY = 145 + Math.cos(Date.now() / 300) * 12;
            pCtx.fillText('👾', bossX, bossY);

            // Pilihan Jawaban
            const optY = 135;
            prob.opts.forEach((optText, i) => {
                const bx = 160 + i * 58;
                const isCorrect = optText === prob.ans;

                if (isCorrect && shootProg > 0.4) {
                    pCtx.fillStyle = 'rgba(34, 197, 94, 0.4)';
                    pCtx.strokeStyle = '#22c55e';
                } else {
                    pCtx.fillStyle = 'rgba(15, 23, 42, 0.8)';
                    pCtx.strokeStyle = '#64748b';
                }

                pCtx.lineWidth = 1;
                pCtx.fillRect(bx, optY, 48, 28);
                pCtx.strokeRect(bx, optY, 48, 28);

                pCtx.fillStyle = isCorrect && shootProg > 0.4 ? '#22c55e' : '#cbd5e1';
                pCtx.font = 'bold 15px monospace';
                pCtx.fillText(optText, bx + 24, optY + 20);
            });

            // Laser Tembakan Jawaban Benar
            if (shootProg > 0.4) {
                const laserX = 230 + ((shootProg - 0.4) / 0.6) * (bossX - 250);
                pCtx.fillStyle = '#00ff41';
                pCtx.fillRect(laserX, 145, 24, 4);

                if (shootProg > 0.88 && particles.length < 15) {
                    for (let k = 0; k < 6; k++) {
                        particles.push({
                            x: bossX,
                            y: bossY,
                            vx: (Math.random() - 0.5) * 6,
                            vy: (Math.random() - 0.5) * 6,
                            size: Math.random() * 4 + 2,
                            col: Math.random() < 0.5 ? '#ef4444' : '#f59e0b',
                            life: 1
                        });
                    }
                    pCtx.fillStyle = '#ef4444';
                    pCtx.font = 'bold 14px monospace';
                    pCtx.fillText('CRIT HIT!', bossX, bossY - 24);
                }
            }
        } else if (curGame.mode === "snake-arcade") {
            // SHOWCASE SNAKE ARCADE (DATA WORM)
            const t = Date.now() / 200;
            pCtx.textAlign = 'center';

            // Gambar Badan Worm Berkelok
            pCtx.fillStyle = '#22c55e';
            for (let i = 0; i < 9; i++) {
                const wx = 120 + i * 22;
                const wy = 135 + Math.sin(t + i * 0.5) * 22;
                pCtx.fillRect(wx - 9, wy - 9, 18, 18);
            }

            // Kepala Worm
            const headX = 120 + 9 * 22;
            const headY = 135 + Math.sin(t + 9 * 0.5) * 22;
            pCtx.fillStyle = '#4ade80';
            pCtx.fillRect(headX - 10, headY - 10, 20, 20);
            pCtx.fillStyle = '#050a14';
            pCtx.fillRect(headX + 2, headY - 4, 4, 4);

            // Byte Data Ungu
            const byteX = 380;
            const byteY = 135 + Math.cos(t * 0.8) * 10;
            pCtx.fillStyle = '#d946ef';
            pCtx.fillRect(byteX - 10, byteY - 10, 20, 20);

            // Power-up Emas Melayang
            const powX = 260;
            const powY = 75 + Math.sin(t) * 8;
            pCtx.fillStyle = '#facc15';
            pCtx.fillRect(powX - 8, powY - 8, 16, 16);
            pCtx.fillStyle = '#facc15';
            pCtx.font = '11px monospace';
            pCtx.fillText('GHOST 5s', powX, powY + 22);

            // Badge Info
            pCtx.fillStyle = '#38bdf8';
            pCtx.font = '13px monospace';
            pCtx.fillText('ACCELERATING SPEED + POWER-UPS', pCanvas.width / 2, 200);
        } else if (curGame.mode === "orbit-defender") {
            // SHOWCASE ORBIT DEFENDER (360° TURRET DEFENSE)
            const cx = pCanvas.width / 2;
            const cy = 120;
            const t = Date.now() / 1000;

            // Radar Ring Visuals
            pCtx.strokeStyle = 'rgba(0, 212, 255, 0.2)';
            pCtx.lineWidth = 1;
            [35, 65, 95].forEach(r => {
                pCtx.beginPath();
                pCtx.arc(cx, cy, r, 0, Math.PI * 2);
                pCtx.stroke();
            });

            // Sweeping Beam
            const sweepAng = t * 2.2;
            pCtx.strokeStyle = 'rgba(0, 212, 255, 0.4)';
            pCtx.beginPath();
            pCtx.moveTo(cx, cy);
            pCtx.lineTo(cx + Math.cos(sweepAng) * 95, cy + Math.sin(sweepAng) * 95);
            pCtx.stroke();

            // Inti Pangkalan Luar Angkasa
            pCtx.fillStyle = '#0f172a';
            pCtx.strokeStyle = '#22c55e';
            pCtx.lineWidth = 2;
            pCtx.beginPath();
            pCtx.arc(cx, cy, 18, 0, Math.PI * 2);
            pCtx.fill();
            pCtx.stroke();

            // Turret Rotasi Mengarah ke Musuh Terdekat
            const targetAngle = t * 1.8;
            const barrelLen = 22;
            pCtx.strokeStyle = '#00d4ff';
            pCtx.lineWidth = 4;
            pCtx.beginPath();
            pCtx.moveTo(cx, cy);
            pCtx.lineTo(cx + Math.cos(targetAngle) * barrelLen, cy + Math.sin(targetAngle) * barrelLen);
            pCtx.stroke();

            // Dome Center
            pCtx.fillStyle = '#00d4ff';
            pCtx.beginPath();
            pCtx.arc(cx, cy, 5, 0, Math.PI * 2);
            pCtx.fill();

            // Tembakan Laser (Triple Shot Simulation)
            const laserProg = (Date.now() % 600) / 600;
            [-0.18, 0, 0.18].forEach(spread => {
                const ang = targetAngle + spread;
                const lx = cx + Math.cos(ang) * (barrelLen + laserProg * 85);
                const ly = cy + Math.sin(ang) * (barrelLen + laserProg * 85);
                pCtx.fillStyle = '#00d4ff';
                pCtx.fillRect(lx - 3, ly - 3, 6, 6);
            });

            // Drone Musuh Mendekat dari Segala Penjuru
            const enemyAngles = [targetAngle + 0.1, targetAngle + 2.1, targetAngle - 1.8];
            enemyAngles.forEach((ea, idx) => {
                const dist = 75 - Math.sin(t * 2 + idx) * 15;
                const ex = cx + Math.cos(ea) * dist;
                const ey = cy + Math.sin(ea) * dist;

                pCtx.fillStyle = idx === 0 ? '#ef4444' : '#a855f7';
                pCtx.fillRect(ex - 5, ey - 5, 10, 10);
            });

            // Ledakan Efek saat musuh tertembak
            if (laserProg > 0.8 && particles.length < 20) {
                const ex = cx + Math.cos(targetAngle) * 75;
                const ey = cy + Math.sin(targetAngle) * 75;
                for (let k = 0; k < 5; k++) {
                    particles.push({
                        x: ex,
                        y: ey,
                        vx: (Math.random() - 0.5) * 5,
                        vy: (Math.random() - 0.5) * 5,
                        size: Math.random() * 3 + 1,
                        col: Math.random() < 0.5 ? '#00d4ff' : '#ef4444',
                        life: 0.8
                    });
                }
            }

            // Info Teks Bawah
            pCtx.fillStyle = '#00d4ff';
            pCtx.font = '13px monospace';
            pCtx.textAlign = 'center';
            pCtx.fillText('360° DEFENSE • TRIPLE CANNON • EMP BOMB', pCanvas.width / 2, 204);
        } else if (curGame.mode === "pacman-arcade") {
            // SHOWCASE PACMAN ARCADE (GHOST CHASE)
            const t = Date.now() / 240;

            // Garis koridor maze (sederhana)
            pCtx.strokeStyle = 'rgba(37, 99, 235, 0.35)';
            pCtx.lineWidth = 2;
            pCtx.strokeRect(40, 40, 400, 150);

            // Titik-titik (pellets) sepanjang jalur
            pCtx.fillStyle = '#fbbf24';
            for (let i = 0; i < 12; i++) {
                const dx = 70 + i * 31;
                pCtx.beginPath();
                pCtx.arc(dx, 115, 3, 0, Math.PI * 2);
                pCtx.fill();
            }

            // Power pellet besar (berkedip)
            const ppX = 200;
            const ppY = 180;
            const blink = (Math.sin(Date.now() / 180) + 1) / 2;
            pCtx.fillStyle = '#f59e0b';
            pCtx.beginPath();
            pCtx.arc(ppX, ppY, 6 + blink * 2, 0, Math.PI * 2);
            pCtx.fill();

            // PACMAN (mulut animasi)
            const pacX = 90 + Math.sin(t) * 30;
            const pacY = 115;
            const mouth = Math.abs(Math.sin(Date.now() / 160)) * 0.28 + 0.05;
            const pacDir = Math.cos(t) >= 0 ? 0 : Math.PI;
            pCtx.fillStyle = '#facc15';
            pCtx.beginPath();
            pCtx.arc(pacX, pacY, 13, pacDir + mouth, pacDir + Math.PI * 2 - mouth);
            pCtx.lineTo(pacX, pacY);
            pCtx.closePath();
            pCtx.fill();

            // Hantu mengejar (kiri -> kanan bolak-balik)
            const ghosts = [
                { col: '#ef4444', off: 0,   name: 'BLINKY' },
                { col: '#f472b6', off: 40,  name: 'PINKY'  },
                { col: '#22d3ee', off: 80,  name: 'INKY'   },
                { col: '#fb923c', off: 120, name: 'CLYDE'  }
            ];
            ghosts.forEach((g, idx) => {
                const gx = 340 - Math.sin(t + idx) * 70;
                const gy = 115;
                // badan hantu
                pCtx.fillStyle = g.col;
                pCtx.beginPath();
                pCtx.arc(gx, gy - 2, 11, Math.PI, 0);
                pCtx.lineTo(gx + 11, gy + 7);
                for (let w = 0; w < 3; w++) {
                    pCtx.lineTo(gx + 11 - (w * 7), gy + 3);
                    pCtx.lineTo(gx + 11 - (w * 7) - 4, gy + 7);
                }
                pCtx.lineTo(gx - 11, gy + 7);
                pCtx.closePath();
                pCtx.fill();
                // mata
                pCtx.fillStyle = '#fff';
                pCtx.beginPath();
                pCtx.arc(gx - 4, gy - 3, 3, 0, Math.PI * 2);
                pCtx.arc(gx + 4, gy - 3, 3, 0, Math.PI * 2);
                pCtx.fill();
                pCtx.fillStyle = '#1e3a8a';
                pCtx.beginPath();
                pCtx.arc(gx - 4, gy - 3, 1.6, 0, Math.PI * 2);
                pCtx.arc(gx + 4, gy - 3, 1.6, 0, Math.PI * 2);
                pCtx.fill();
            });

            // Buah bonus mengapung
            const fruitY = 75 + Math.sin(t * 0.9) * 7;
            pCtx.font = '22px monospace';
            pCtx.textAlign = 'center';
            pCtx.fillText('🍒', 250, fruitY);

            // Info teks bawah
            pCtx.fillStyle = '#facc15';
            pCtx.font = '13px monospace';
            pCtx.textAlign = 'center';
            pCtx.fillText('EAT DOTS • EVADE GHOSTS • ENERGY MODE', pCanvas.width / 2, 204);
        } else if (curGame.mode === "pulse-runner") {
            // SHOWCASE PULSE RUNNER (GRAVITY FLIP TUNNEL)
            const t = Date.now() / 200;
            const centerY = 120;
            const wall = 55;

            // Garis lantai & langit-langit terowongan neon
            pCtx.strokeStyle = 'rgba(0, 212, 255, 0.5)';
            pCtx.lineWidth = 3;
            pCtx.beginPath();
            pCtx.moveTo(0, centerY - wall);
            pCtx.lineTo(pCanvas.width, centerY - wall);
            pCtx.stroke();
            pCtx.beginPath();
            pCtx.moveTo(0, centerY + wall);
            pCtx.lineTo(pCanvas.width, centerY + wall);
            pCtx.stroke();

            // Pesawat cyan yang balik gravitasi antara lantai & langit-langit
            const flip = Math.floor(Date.now() / 1500) % 2 === 0 ? 1 : -1;
            const shipX = 90 + Math.sin(t * 0.4) * 6;
            const shipY = centerY + flip * (wall - 12);
            pCtx.fillStyle = '#00d4ff';
            pCtx.fillRect(shipX - 13, shipY - 6, 26, 12);
            pCtx.fillStyle = '#060614';
            pCtx.fillRect(shipX + 2, shipY - 2, 5, 4);

            // Rintangan gelap scrolling kanan -> kiri seirama ritme flip
            const obsProg = (Date.now() % 3000) / 3000;
            pCtx.fillStyle = '#1e293b';
            [0, 1, 2].forEach(i => {
                const ox = pCanvas.width + 40 - ((obsProg * 300) + i * 150);
                const onCeil = (i + Math.floor(Date.now() / 3000)) % 2 === 0;
                const oy = onCeil ? centerY - wall : centerY + wall;
                pCtx.fillRect(ox, onCeil ? oy : oy - 26, 16, 26);
            });

            // Garis kecepatan horizontal
            pCtx.strokeStyle = 'rgba(0, 212, 255, 0.35)';
            pCtx.lineWidth = 1;
            for (let s = 0; s < 6; s++) {
                const sy = centerY - 40 + s * 16;
                const sx = pCanvas.width - ((Date.now() / 8 + s * 70) % (pCanvas.width + 80));
                pCtx.beginPath();
                pCtx.moveTo(sx, sy);
                pCtx.lineTo(sx + 42, sy);
                pCtx.stroke();
            }

            // Info teks bawah
            pCtx.fillStyle = '#00d4ff';
            pCtx.font = '13px monospace';
            pCtx.textAlign = 'center';
            pCtx.fillText('FLIP GRAVITY • DODGE BLOCKS • PULSE COMBO', pCanvas.width / 2, 204);
        }

        pCtx.textAlign = 'left';
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

        // Variasi preview jika kartu adalah Orbit Defender
        if (title && title.toLowerCase().includes('orbit')) {
            const t = Date.now() / 400;
            const cx = c.width / 2;
            const cy = c.height / 2 + 5;

            // Orbit ring
            ctx.strokeStyle = 'rgba(34, 197, 94, 0.25)';
            ctx.beginPath();
            ctx.arc(cx, cy, 38, 0, Math.PI * 2);
            ctx.stroke();

            // Core center
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.arc(cx, cy, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#22c55e';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Turret rotating
            const angle = t % (Math.PI * 2);
            const bx = cx + Math.cos(angle) * 18;
            const by = cy + Math.sin(angle) * 18;
            ctx.strokeStyle = '#00d4ff';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(bx, by);
            ctx.stroke();

            // Laser pulse
            const pulseDist = 20 + ((Date.now() % 600) / 600) * 45;
            const lx = cx + Math.cos(angle) * pulseDist;
            const ly = cy + Math.sin(angle) * pulseDist;
            ctx.fillStyle = '#00ffff';
            ctx.beginPath();
            ctx.arc(lx, ly, 3, 0, Math.PI * 2);
            ctx.fill();

            // Incoming target drone
            const enemyDist = 55 - ((Date.now() % 1200) / 1200) * 35;
            const ex = cx + Math.cos(angle + 0.3) * enemyDist;
            const ey = cy + Math.sin(angle + 0.3) * enemyDist;
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(ex - 4, ey - 4, 8, 8);

            ctx.fillStyle = '#38bdf8';
            ctx.font = '10px monospace';
            ctx.fillText('360° TURRET LIVE', 12, 20);

            requestAnimationFrame(render);
            return;
        }

        // Variasi preview jika kartu adalah Pacman Arcade
        if (title && title.toLowerCase().includes('pacman')) {
            const now = Date.now();
            const cycle = (now % 4000) / 4000; // 4s loop
            const isFrightened = cycle > 0.5;
            const pacX = isFrightened ? (c.width - 40 - (cycle - 0.5) * 2 * (c.width - 80)) : (40 + cycle * 2 * (c.width - 80));
            const pacY = 75;
            const chomp = (Math.sin(now / 80) + 1) * 0.25;

            // Mini maze corridor lines
            ctx.strokeStyle = '#1e3a8a';
            ctx.lineWidth = 2;
            ctx.strokeRect(20, 48, c.width - 40, 54);

            // Dots along corridor
            for (let dotX = 40; dotX < c.width - 40; dotX += 24) {
                if (Math.abs(dotX - pacX) > 12) {
                    ctx.fillStyle = '#fde047';
                    ctx.beginPath();
                    ctx.arc(dotX, pacY, 2.5, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // Power pellet at right side
            if ((Math.floor(now / 200) % 2) === 0) {
                ctx.fillStyle = '#fef08a';
                ctx.beginPath();
                ctx.arc(c.width - 36, pacY, 5, 0, Math.PI * 2);
                ctx.fill();
            }

            // Draw Pacman
            ctx.fillStyle = '#eab308';
            ctx.beginPath();
            const facingLeft = isFrightened;
            const baseAngle = facingLeft ? Math.PI : 0;
            ctx.arc(pacX, pacY, 12, baseAngle + chomp, baseAngle + Math.PI * 2 - chomp);
            ctx.lineTo(pacX, pacY);
            ctx.fill();

            // Draw Ghost (Blinky / Blue Ghost)
            const ghostDist = 36;
            const ghostX = facingLeft ? pacX - ghostDist : pacX - ghostDist;
            if (ghostX > 15 && ghostX < c.width - 15) {
                ctx.fillStyle = isFrightened ? '#38bdf8' : '#ef4444';
                // Head
                ctx.beginPath();
                ctx.arc(ghostX, pacY - 2, 10, Math.PI, 0, false);
                ctx.lineTo(ghostX + 10, pacY + 10);
                // Wavy skirt
                const wave = (Math.floor(now / 150) % 2) * 2;
                ctx.lineTo(ghostX + 5, pacY + 6 + wave);
                ctx.lineTo(ghostX, pacY + 10);
                ctx.lineTo(ghostX - 5, pacY + 6 + wave);
                ctx.lineTo(ghostX - 10, pacY + 10);
                ctx.closePath();
                ctx.fill();

                // Eyes
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(ghostX - 4, pacY - 4, 3, 0, Math.PI * 2);
                ctx.arc(ghostX + 4, pacY - 4, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = isFrightened ? '#ea580c' : '#1e3a8a';
                const eyeOff = facingLeft ? -1.5 : 1.5;
                ctx.beginPath();
                ctx.arc(ghostX - 4 + eyeOff, pacY - 4, 1.5, 0, Math.PI * 2);
                ctx.arc(ghostX + 4 + eyeOff, pacY - 4, 1.5, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.fillStyle = '#eab308';
            ctx.font = '10px monospace';
            ctx.fillText('PACMAN PROTOCOL LIVE', 12, 20);

            requestAnimationFrame(render);
            return;
        }

        // Variasi preview jika kartu adalah Pulse Runner
        if (title && title.toLowerCase().includes('pulse')) {
            const now = Date.now();
            const flip = Math.floor(now / 1400) % 2 === 0 ? 1 : -1;
            const lineTop = 45;
            const lineBot = 105;

            // Garis neon lantai & langit-langit terowongan
            ctx.strokeStyle = 'rgba(0, 212, 255, 0.55)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(14, lineTop);
            ctx.lineTo(c.width - 14, lineTop);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(14, lineBot);
            ctx.lineTo(c.width - 14, lineBot);
            ctx.stroke();

            // Pesawat cyan berbalik gravitasi antar dua garis
            const shipY = flip === 1 ? lineBot - 10 : lineTop + 10;
            ctx.fillStyle = '#00d4ff';
            ctx.fillRect(56, shipY - 5, 20, 10);

            // Balok rintangan scrolling kanan -> kiri
            ctx.fillStyle = '#1e293b';
            for (let i = 0; i < 3; i++) {
                const bx = c.width - 20 - (((now / 6) + i * 90) % (c.width - 40));
                const onCeil = (i + Math.floor(now / 2800)) % 2 === 0;
                ctx.fillRect(bx, onCeil ? lineTop : lineBot - 18, 12, 18);
            }

            // Garis kecepatan
            ctx.strokeStyle = 'rgba(0, 212, 255, 0.3)';
            ctx.lineWidth = 1;
            for (let s = 0; s < 4; s++) {
                const sy = lineTop + 12 + s * 14;
                const sx = c.width - (((now / 4) + s * 55) % (c.width + 60));
                ctx.beginPath();
                ctx.moveTo(sx, sy);
                ctx.lineTo(sx + 26, sy);
                ctx.stroke();
            }

            ctx.fillStyle = '#00d4ff';
            ctx.font = '10px monospace';
            ctx.fillText('GRAVITY TUNNEL LIVE', 12, 20);

            requestAnimationFrame(render);
            return;
        }

        // Variasi preview kartu Battle MTK (Duel Matematika)
        // Persoalan matematika retro berulang (contoh: 7 x 8 = 56, 12 + 15 = 27)
        const mathProblems = [
            { q: "7 x 8 = ?", ans: "56", opt: ["48", "56", "64"] },
            { q: "15 + 9 = ?", ans: "24", opt: ["24", "22", "26"] },
            { q: "45 / 5 = ?", ans: "9", opt: ["8", "9", "7"] },
            { q: "12 - 7 = ?", ans: "5", opt: ["6", "5", "4"] }
        ];

        const pIdx = Math.floor(Date.now() / 2400) % mathProblems.length;
        const curProb = mathProblems[pIdx];
        const cycleProgress = (Date.now() % 2400) / 2400;

        // Label status simulator
        ctx.fillStyle = '#38bdf8';
        ctx.font = '10px monospace';
        ctx.fillText('MATH BATTLE SIM', 12, 18);

        // Header Soal di tengah atas
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 15px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(curProb.q, c.width / 2, 38);

        // Karakter Pesawat Komandan (Kiri)
        const shipX = 35;
        const shipY = 82 + Math.sin(Date.now() / 300) * 6;
        ctx.font = '22px monospace';
        ctx.fillText('🚀', shipX, shipY);

        // Monster Matematika (Kanan)
        const monsterX = 245;
        const monsterY = 82 + Math.cos(Date.now() / 350) * 6;
        ctx.fillText('👾', monsterX, monsterY);

        // Tiga Kotak Pilihan Jawaban
        const boxWidth = 36;
        const boxHeight = 22;
        const startX = 85;
        const optY = 72;

        curProb.opt.forEach((optText, i) => {
            const bx = startX + i * 44;
            const isCorrect = optText === curProb.ans;

            // Highlight tombol yang dipilih pesawat saat laser menembak
            if (isCorrect && cycleProgress > 0.45 && cycleProgress < 0.85) {
                ctx.fillStyle = 'rgba(34, 197, 94, 0.35)';
                ctx.strokeStyle = '#22c55e';
            } else {
                ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
                ctx.strokeStyle = '#64748b';
            }

            ctx.lineWidth = 1;
            ctx.fillRect(bx, optY, boxWidth, boxHeight);
            ctx.strokeRect(bx, optY, boxWidth, boxHeight);

            ctx.fillStyle = isCorrect && cycleProgress > 0.45 && cycleProgress < 0.85 ? '#22c55e' : '#cbd5e1';
            ctx.font = 'bold 12px monospace';
            ctx.fillText(optText, bx + boxWidth / 2, optY + 15);
        });

        // Laser Jawaban Benar menembak ke arah Monster
        if (cycleProgress > 0.45 && cycleProgress < 0.85) {
            const shootProg = (cycleProgress - 0.45) / 0.4;
            const lx = 160 + shootProg * (monsterX - 160);
            ctx.fillStyle = '#00ff41';
            ctx.fillRect(lx, 80, 12, 3);

            // Efek Hit saat mendekati monster
            if (shootProg > 0.75) {
                ctx.fillStyle = '#ef4444';
                ctx.font = 'bold 11px monospace';
                ctx.fillText('CRIT!', monsterX, monsterY - 14);
            }
        }

        ctx.textAlign = 'left'; // Reset alignment
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