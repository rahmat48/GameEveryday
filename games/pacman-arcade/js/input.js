/**
 * input.js
 * Handler kontrol keyboard (WASD, Arrow Keys, Pause) untuk Pacman Arcade.
 */

export function initInput(k, onDirectionChange, onTogglePause) {
  let currentDirection = "right";
  let windowKeyHandler = null;

  function handleDirection(dir) {
    currentDirection = dir;
    if (typeof onDirectionChange === "function") {
      onDirectionChange(dir);
    }
  }

  function handlePause() {
    if (typeof onTogglePause === "function") {
      onTogglePause();
    }
  }

  // Integrasi Kaplay key handler jika tersedia
  if (k && typeof k.onKeyPress === "function") {
    k.onKeyPress("w", () => handleDirection("up"));
    k.onKeyPress("up", () => handleDirection("up"));
    k.onKeyPress("s", () => handleDirection("down"));
    k.onKeyPress("down", () => handleDirection("down"));
    k.onKeyPress("a", () => handleDirection("left"));
    k.onKeyPress("left", () => handleDirection("left"));
    k.onKeyPress("d", () => handleDirection("right"));
    k.onKeyPress("right", () => handleDirection("right"));

    k.onKeyPress("space", handlePause);
    k.onKeyPress("escape", handlePause);
    k.onKeyPress("p", handlePause);
  } else if (typeof window !== "undefined") {
    // Fallback native window listener
    const keyMap = {
      ArrowUp: "up", KeyW: "up", w: "up", W: "up",
      ArrowDown: "down", KeyS: "down", s: "down", S: "down",
      ArrowLeft: "left", KeyA: "left", a: "left", A: "left",
      ArrowRight: "right", KeyD: "right", d: "right", D: "right"
    };

    windowKeyHandler = (e) => {
      const dir = keyMap[e.key] || keyMap[e.code];
      if (dir) {
        e.preventDefault();
        handleDirection(dir);
      } else if (e.key === " " || e.key === "Escape" || e.key === "p" || e.key === "P") {
        e.preventDefault();
        handlePause();
      }
    };

    window.addEventListener("keydown", windowKeyHandler);
  }

  return {
    getDirection: () => currentDirection,
    setDirection: (dir) => {
      currentDirection = dir;
    },
    destroy: () => {
      if (windowKeyHandler && typeof window !== "undefined") {
        window.removeEventListener("keydown", windowKeyHandler);
      }
    }
  };
}
