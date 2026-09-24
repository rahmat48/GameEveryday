/**
 * swipe.js
 * Deteksi gesture usap layar (swipe) untuk navigasi sentuh mobile & pointer desktop Pacman Arcade.
 */

export function initSwipe(onSwipe, threshold = 25) {
  let touchStartX = 0;
  let touchStartY = 0;
  let isEnabled = true;

  if (typeof document === "undefined") {
    return {
      enable: () => {},
      disable: () => {},
      destroy: () => {}
    };
  }

  const target = document.getElementById("game-container") || document.body;

  function onTouchStart(e) {
    if (!isEnabled) return;
    const t = e.touches ? e.touches[0] : e;
    touchStartX = t.clientX;
    touchStartY = t.clientY;
  }

  function onTouchMove(e) {
    if (!isEnabled) return;
    // Cegah scrolling layar saat pemain mengusap kanvas game
    if (e.cancelable) {
      e.preventDefault();
    }
  }

  function onTouchEnd(e) {
    if (!isEnabled) return;
    const t = e.changedTouches ? e.changedTouches[0] : e;
    const deltaX = t.clientX - touchStartX;
    const deltaY = t.clientY - touchStartY;

    if (Math.abs(deltaX) < threshold && Math.abs(deltaY) < threshold) {
      return; // Geseran terlalu pendek
    }

    let dir = "";
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      dir = deltaX > 0 ? "right" : "left";
    } else {
      dir = deltaY > 0 ? "down" : "up";
    }

    if (dir && typeof onSwipe === "function") {
      onSwipe(dir);
    }
  }

  target.addEventListener("touchstart", onTouchStart, { passive: true });
  target.addEventListener("touchmove", onTouchMove, { passive: false });
  target.addEventListener("touchend", onTouchEnd, { passive: true });

  return {
    enable: () => {
      isEnabled = true;
    },
    disable: () => {
      isEnabled = false;
    },
    destroy: () => {
      target.removeEventListener("touchstart", onTouchStart);
      target.removeEventListener("touchmove", onTouchMove);
      target.removeEventListener("touchend", onTouchEnd);
    }
  };
}
