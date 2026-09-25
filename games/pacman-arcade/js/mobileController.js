/**
 * mobileController.js
 * On-screen retro virtual keypad (Up, Down, Left, Right) untuk Pacman Arcade.
 * Mengelola interaksi layar sentuh, respons getar haptik, dan tombol toggle HUD.
 */

let activeDirectionHandler = null;

/**
 * Mendaftarkan callback arah baru saat scene berganti.
 * @param {Function} handler
 */
export function setDirectionHandler(handler) {
  activeDirectionHandler = handler;
}

/**
 * Mengirim input arah ke handler aktif dengan haptic feedback.
 * @param {string} dir - 'up' | 'down' | 'left' | 'right'
 */
function triggerDir(dir) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(15);
    } catch (e) {}
  }
  if (typeof activeDirectionHandler === "function") {
    activeDirectionHandler(dir);
  }
}

/**
 * Inisialisasi virtual keypad retro.
 * @param {Function} [onDirectionChange]
 * @returns {{show: Function, hide: Function, toggle: Function}}
 */
export function initMobileController(onDirectionChange) {
  if (typeof document === "undefined") {
    return { show: () => {}, hide: () => {}, toggle: () => {} };
  }

  if (onDirectionChange) {
    activeDirectionHandler = onDirectionChange;
  }

  let container = document.getElementById("virtual-dpad");

  // Jika kontainer belum ada di DOM, buat secara dinamis
  if (!container) {
    container = document.createElement("div");
    container.id = "virtual-dpad";
    container.innerHTML = `
      <div class="dpad-base"></div>
      <div class="dpad-hub">P</div>
      <button class="dpad-btn dpad-up" data-dir="up" aria-label="Up"><span>▲</span></button>
      <button class="dpad-btn dpad-down" data-dir="down" aria-label="Down"><span>▼</span></button>
      <button class="dpad-btn dpad-left" data-dir="left" aria-label="Left"><span>▲</span></button>
      <button class="dpad-btn dpad-right" data-dir="right" aria-label="Right"><span>▲</span></button>
    `;
    const parent = document.getElementById("game-container") || document.body;
    parent.appendChild(container);
  }

  // Pasang listener pada tombol arah jika belum terpasang
  container.querySelectorAll(".dpad-btn").forEach((btn) => {
    if (btn.dataset.listenerAttached) return;
    btn.dataset.listenerAttached = "true";

    const dir = btn.getAttribute("data-dir");

    btn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      triggerDir(dir);
    }, { passive: false });

    btn.addEventListener("mousedown", (e) => {
      e.preventDefault();
      triggerDir(dir);
    });
  });

  // Hubungkan dengan tombol toggle pada HUD atas
  const hudBtn = document.getElementById("btn-dpad");
  if (hudBtn && !hudBtn.dataset.listenerAttached) {
    hudBtn.dataset.listenerAttached = "true";
    hudBtn.addEventListener("click", () => {
      toggleVirtualDpad();
    });
  }

  // Sembunyikan keypad dan tombol HUD secara default di luar gameplay
  updateDpadSceneVisibility(false);

  return {
    show: showVirtualDpad,
    hide: hideVirtualDpad,
    toggle: toggleVirtualDpad,
    updateVisibility: updateDpadSceneVisibility
  };
}

/**
 * Mengontrol visibilitas tombol toggle HUD & panel D-pad berdasarkan scene aktif.
 * Keypad & tombol toggle hanya boleh muncul saat berada di dalam scene gameplay.
 * @param {boolean} isInGameplay
 */
export function updateDpadSceneVisibility(isInGameplay) {
  const container = document.getElementById("virtual-dpad");
  const hudBtn = document.getElementById("btn-dpad");

  if (!isInGameplay) {
    if (hudBtn) hudBtn.style.display = "none";
    if (container) container.classList.remove("visible");
    return;
  }

  // Tampilkan tombol toggle di HUD saat masuk gameplay
  if (hudBtn) hudBtn.style.display = "inline-flex";

  const isTouchDevice =
    (typeof window !== "undefined" && ("ontouchstart" in window)) ||
    (typeof navigator !== "undefined" && navigator.maxTouchPoints > 0) ||
    (typeof window !== "undefined" && window.innerWidth <= 768);

  const userPref = typeof localStorage !== "undefined"
    ? localStorage.getItem("pacmanArcade_show_dpad")
    : null;

  const shouldShow = userPref === "true" || (userPref === null && isTouchDevice);
  if (container) {
    if (shouldShow) container.classList.add("visible");
    else container.classList.remove("visible");
  }
  if (hudBtn) {
    hudBtn.style.background = (container && container.classList.contains("visible"))
      ? "rgba(250, 204, 21, 0.3)"
      : "transparent";
  }
}

/**
 * Menampilkan virtual dpad.
 */
export function showVirtualDpad() {
  const container = document.getElementById("virtual-dpad");
  const hudBtn = document.getElementById("btn-dpad");
  if (container) {
    container.classList.add("visible");
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("pacmanArcade_show_dpad", "true");
    }
  }
  if (hudBtn) {
    hudBtn.style.background = "rgba(250, 204, 21, 0.3)";
  }
}

/**
 * Menyembunyikan virtual dpad.
 */
export function hideVirtualDpad() {
  const container = document.getElementById("virtual-dpad");
  const hudBtn = document.getElementById("btn-dpad");
  if (container) {
    container.classList.remove("visible");
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("pacmanArcade_show_dpad", "false");
    }
  }
  if (hudBtn) {
    hudBtn.style.background = "transparent";
  }
}

/**
 * Toggle tampil/sembunyi virtual dpad.
 * @returns {boolean} Status baru apakah terlihat
 */
export function toggleVirtualDpad() {
  const container = document.getElementById("virtual-dpad");
  if (!container) return false;

  const isVisible = container.classList.toggle("visible");
  if (typeof localStorage !== "undefined") {
    localStorage.setItem("pacmanArcade_show_dpad", String(isVisible));
  }

  const hudBtn = document.getElementById("btn-dpad");
  if (hudBtn) {
    hudBtn.style.background = isVisible ? "rgba(250, 204, 21, 0.3)" : "transparent";
  }

  return isVisible;
}
