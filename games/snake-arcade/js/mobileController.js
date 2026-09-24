/**
 * mobileController.js
 * On-screen D-Pad retro 3x3 grid untuk kontrol layar sentuh di perangkat mobile dan desktop emulator.
 */

let activeDirectionHandler = null;

export function setDirectionHandler(handler) {
  activeDirectionHandler = handler;
}

export function initMobileController(onDirectionChange) {
  const container = document.getElementById("mobile-controller");
  if (!container) return { show: () => {}, hide: () => {} };

  if (onDirectionChange) {
    activeDirectionHandler = onDirectionChange;
  }

  // Render 3x3 grid layout jika belum ada tombol
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
  
  if (userPref === "true" || (userPref === null && isTouchDevice)) {
    container.classList.add("force-show");
  }

  if (hudBtn) {
    hudBtn.style.background = container.classList.contains("force-show") ? "rgba(34, 197, 94, 0.3)" : "transparent";
  }

  return {
    show: () => { container.classList.add("force-show"); },
    hide: () => { container.classList.remove("force-show"); }
  };
}

// Toggle manual dari tombol HUD
export function toggleVirtualDpad() {
  const container = document.getElementById("mobile-controller");
  if (!container) return;
  
  // Pastikan tombol ter-render
  initMobileController(activeDirectionHandler);

  const isShown = container.classList.toggle("force-show");
  localStorage.setItem("snakeArcade_show_dpad", String(isShown));

  const btn = document.getElementById("btn-toggle-dpad");
  if (btn) {
    btn.style.background = isShown ? "rgba(34, 197, 94, 0.3)" : "transparent";
  }
}
window.toggleVirtualDpad = toggleVirtualDpad;

