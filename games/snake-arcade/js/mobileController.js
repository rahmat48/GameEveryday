/**
 * mobileController.js
 * On-screen D-Pad retro 3x3 grid untuk kontrol layar sentuh di perangkat mobile.
 */

export function initMobileController(onDirectionChange) {
  const container = document.getElementById("mobile-controller");
  if (!container) return { show: () => {}, hide: () => {} };

  // Render 3x3 grid layout
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
    if (typeof onDirectionChange === "function") {
      onDirectionChange(dir);
    }
  }

  container.querySelectorAll(".dpad-btn").forEach((btn) => {
    const dir = btn.getAttribute("data-dir");
    btn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      triggerDir(dir);
    }, { passive: false });
    btn.addEventListener("click", () => triggerDir(dir));
  });

  return {
    show: () => { container.style.display = "grid"; },
    hide: () => { container.style.display = "none"; }
  };
}
