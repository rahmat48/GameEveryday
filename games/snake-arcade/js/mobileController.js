/**
 * mobileController.js
 * On-screen D-Pad retro 3x3 grid untuk kontrol layar sentuh di perangkat mobile dan desktop emulator.
 */

let activeDirectionHandler = null;

export function setDirectionHandler(handler) {
  activeDirectionHandler = handler;
}

export function updateDpadStats(score, length, speed) {
  const sEl = document.getElementById("side-stat-score");
  const lEl = document.getElementById("side-stat-length");
  const spEl = document.getElementById("side-stat-speed");
  if (sEl) sEl.textContent = score;
  if (lEl) lEl.textContent = length;
  if (spEl) spEl.textContent = typeof speed === "number" ? speed.toFixed(1) : speed;
}

export function initMobileController(onDirectionChange) {
  const container = document.getElementById("mobile-controller");
  const statsPanel = document.getElementById("side-stats-panel");
  if (!container) return { show: () => {}, hide: () => {} };

  if (onDirectionChange) {
    activeDirectionHandler = onDirectionChange;
  }

  // Render 3x3 dpad layout
  if (!container.querySelector(".dpad-btn")) {
    container.innerHTML = `
      <div class="dpad-empty"></div>
      <button class="dpad-btn" data-dir="up" aria-label="Up">▲</button>
      <div class="dpad-empty"></div>
      <button class="dpad-btn" data-dir="left" aria-label="Left">◀</button>
      <div class="dpad-empty"></div>
      <button class="dpad-btn" data-dir="right" aria-label="Right">▶</button>
      <div class="dpad-empty"></div>
      <button class="dpad-btn" data-dir="down" aria-label="Down">▼</button>
      <div class="dpad-empty"></div>
    `;

    function triggerDir(dir) {
      if ("vibrate" in navigator) {
        try { navigator.vibrate(15); } catch (e) {}
      }
      if (typeof activeDirectionHandler === "function") {
        activeDirectionHandler(dir);
      }
    }

    container.querySelectorAll(".dpad-btn").forEach((btn) => {
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
  }

  // Pasang listener pada tombol HUD jika ada
  const hudBtn = document.getElementById("btn-toggle-dpad");
  if (hudBtn && !hudBtn.dataset.listenerAttached) {
    hudBtn.dataset.listenerAttached = "true";
    hudBtn.addEventListener("click", () => {
      toggleVirtualDpad();
    });
  }

  // Deteksi otomatis jika perangkat sentuh (touchscreen)
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth <= 768;
  const userPref = localStorage.getItem("snakeArcade_show_dpad");
  const panelWrapper = document.getElementById("side-control-panel");
  
  if (userPref === "true" || (userPref === null && isTouchDevice)) {
    container.classList.add("force-show");
    if (statsPanel) statsPanel.classList.add("force-show");
    if (panelWrapper) panelWrapper.classList.add("force-show");
  }

  if (hudBtn) {
    hudBtn.style.background = container.classList.contains("force-show") ? "rgba(34, 197, 94, 0.3)" : "transparent";
  }

  return {
    show: () => { 
      container.classList.add("force-show"); 
      if (statsPanel) statsPanel.classList.add("force-show");
      if (panelWrapper) panelWrapper.classList.add("force-show");
    },
    hide: () => { 
      container.classList.remove("force-show"); 
      if (statsPanel) statsPanel.classList.remove("force-show");
      if (panelWrapper) panelWrapper.classList.remove("force-show");
    }
  };
}

// Toggle manual dari tombol HUD
export function toggleVirtualDpad() {
  const container = document.getElementById("mobile-controller");
  const statsPanel = document.getElementById("side-stats-panel");
  const panelWrapper = document.getElementById("side-control-panel");
  if (!container) return;
  
  // Pastikan tombol ter-render
  initMobileController(activeDirectionHandler);

  const isShown = container.classList.toggle("force-show");
  if (statsPanel) {
    statsPanel.classList.toggle("force-show", isShown);
  }
  if (panelWrapper) {
    panelWrapper.classList.toggle("force-show", isShown);
  }
  localStorage.setItem("snakeArcade_show_dpad", String(isShown));

  const btn = document.getElementById("btn-toggle-dpad");
  if (btn) {
    btn.style.background = isShown ? "rgba(34, 197, 94, 0.3)" : "transparent";
  }
}
window.toggleVirtualDpad = toggleVirtualDpad;

