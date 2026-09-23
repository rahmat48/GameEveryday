/**
 * input.js
 * Handler kontrol keyboard (WASD, Arrow Keys, Pause).
 */

const OPPOSITES = {
  up: "down",
  down: "up",
  left: "right",
  right: "left"
};

export function initInput(k, onDirectionChange, onTogglePause) {
  let currentDirection = "right";

  function handleKey(dir) {
    if (OPPOSITES[dir] === currentDirection) return;
    currentDirection = dir;
    if (typeof onDirectionChange === "function") {
      onDirectionChange(dir);
    }
  }

  // Arah Atas
  k.onKeyPress("w", () => handleKey("up"));
  k.onKeyPress("up", () => handleKey("up"));

  // Arah Bawah
  k.onKeyPress("s", () => handleKey("down"));
  k.onKeyPress("down", () => handleKey("down"));

  // Arah Kiri
  k.onKeyPress("a", () => handleKey("left"));
  k.onKeyPress("left", () => handleKey("left"));

  // Arah Kanan
  k.onKeyPress("d", () => handleKey("right"));
  k.onKeyPress("right", () => handleKey("right"));

  // Pause / Resume
  k.onKeyPress("space", () => {
    if (typeof onTogglePause === "function") onTogglePause();
  });
  k.onKeyPress("escape", () => {
    if (typeof onTogglePause === "function") onTogglePause();
  });

  return {
    getDirection: () => currentDirection,
    setDirection: (dir) => { currentDirection = dir; }
  };
}
