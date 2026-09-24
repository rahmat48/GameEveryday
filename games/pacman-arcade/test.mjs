// test.mjs - Runnable assertions for Pacman stages and Ghost AI
import assert from 'node:assert';
import { STAGES, isWall, isWalkable, getTile, getStage } from './js/stages.js';
import {
  getNextGhostMove,
  getTargetTile,
  getGhostDoor,
  getGhostSpeed,
  normalizeDir,
  GHOST_CONFIGS
} from './js/ghostAi.js';

console.log('--- TEST: stages.js ---');

// 1. Stage count and basic properties
assert.strictEqual(STAGES.length, 4, 'Should have 4 stages');
const expectedNames = [
  'CYBER LABYRINTH',
  'QUANTUM CITADEL',
  'NEON CORE',
  'HYPERSPACE SINGULARITY'
];

STAGES.forEach((stage, idx) => {
  assert.strictEqual(stage.id, idx + 1, `Stage ${idx} should have id ${idx + 1}`);
  assert.strictEqual(stage.name, expectedNames[idx], `Stage name matches`);
  assert(stage.wallColor.startsWith('#'), 'wallColor must be hex string');
  assert(stage.wallOutline.startsWith('#'), 'wallOutline must be hex string');
  assert(stage.frightenedDuration > 0, 'frightenedDuration positive');
  assert(stage.pacmanSpeed > 100, 'pacmanSpeed positive');
  assert(stage.ghostSpeed > 100, 'ghostSpeed positive');
  assert(stage.fruit && stage.fruit.points > 0, 'fruit points positive');

  // Check map dimensions
  assert.strictEqual(stage.map.length, 31, `Stage ${stage.id} must have 31 rows`);
  for (let r = 0; r < 31; r++) {
    assert.strictEqual(stage.map[r].length, 28, `Stage ${stage.id} row ${r} must be 28 chars`);
  }

  // Check row 14 warp tunnel
  assert.strictEqual(stage.map[14][0], ' ', `Stage ${stage.id} row 14 col 0 must be warp tunnel`);
  assert.strictEqual(stage.map[14][27], ' ', `Stage ${stage.id} row 14 col 27 must be warp tunnel`);

  // Check horizontal bilateral symmetry
  for (let r = 0; r < 31; r++) {
    for (let c = 0; c < 14; c++) {
      const left = stage.map[r][c];
      const right = stage.map[r][27 - c];

      // Walls must mirror exactly
      assert.strictEqual(left === '#', right === '#', `Wall asymmetry at stage ${stage.id} row ${r} col ${c}`);

      // Energizers must mirror
      if (left === 'O') assert.strictEqual(right, 'O', `Energizer asymmetry`);

      // Ghost house door '=' must mirror
      if (left === '=') assert.strictEqual(right, '=', `Door asymmetry`);
    }
  }

  // Check item counts
  let pCount = 0, fCount = 0, gCount = 0, oCount = 0, dotCount = 0;
  let pPos = null;
  for (let r = 0; r < 31; r++) {
    for (let c = 0; c < 28; c++) {
      const tile = stage.map[r][c];
      if (tile === 'P') { pCount++; pPos = { c, r }; }
      if (tile === 'F') fCount++;
      if (tile === 'G') gCount++;
      if (tile === 'O') oCount++;
      if (tile === '.') dotCount++;
    }
  }
  assert.strictEqual(pCount, 1, `Stage ${stage.id} must have 1 P`);
  assert.strictEqual(fCount, 1, `Stage ${stage.id} must have 1 F`);
  assert.strictEqual(gCount, 4, `Stage ${stage.id} must have 4 G`);
  assert.strictEqual(oCount, 4, `Stage ${stage.id} must have 4 O`);
  assert(dotCount >= 200, `Stage ${stage.id} must have adequate dots, got ${dotCount}`);

  // BFS Reachability from Pacman spawn
  const visited = Array.from({ length: 31 }, () => Array(28).fill(false));
  const queue = [[pPos.c, pPos.r]];
  visited[pPos.r][pPos.c] = true;
  while (queue.length > 0) {
    const [c, r] = queue.shift();
    const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    for (const [dx, dy] of dirs) {
      let nc = c + dx;
      let nr = r + dy;
      if (nr === 14) {
        if (nc < 0) nc = 27;
        if (nc >= 28) nc = 0;
      }
      if (nr >= 0 && nr < 31 && nc >= 0 && nc < 28) {
        const tile = stage.map[nr][nc];
        if (tile !== '#' && tile !== 'G' && !visited[nr][nc]) {
          visited[nr][nc] = true;
          queue.push([nc, nr]);
        }
      }
    }
  }

  for (let r = 0; r < 31; r++) {
    for (let c = 0; c < 28; c++) {
      const tile = stage.map[r][c];
      if (tile === '.' || tile === 'O' || tile === 'F') {
        assert(visited[r][c], `Unreachable item '${tile}' at (${c}, ${r}) in stage ${stage.id}`);
      }
    }
  }
  assert(visited[14][0] && visited[14][27], `Warp tunnel unreachable in stage ${stage.id}`);
});

// 2. Helper functions tests
assert.strictEqual(isWall('#'), true);
assert.strictEqual(isWall('.'), false);
assert.strictEqual(isWalkable('.', false), true);
assert.strictEqual(isWalkable('#', false), false);
assert.strictEqual(isWalkable('=', false, false), false);
assert.strictEqual(isWalkable('=', true, true), true);
assert.strictEqual(isWalkable('G', false), false);
assert.strictEqual(isWalkable('G', true), true);

const s1 = getStage(1);
assert.strictEqual(getTile(s1, -1, 14), ' ', 'Warp col -1 should wrap to col 27');
assert.strictEqual(getTile(s1, 28, 14), ' ', 'Warp col 28 should wrap to col 0');
assert.strictEqual(getTile(s1, -1, 10), '#', 'Out of bounds non-warp should be wall');

console.log('✓ stages.js passed all checks!');

console.log('--- TEST: ghostAi.js ---');

// 3. Ghost Targeting Algorithms
const pacman = { x: 10, y: 10, dir: 'right' };
const blinky = { x: 6, y: 10, name: 'blinky' };
const pinky = { x: 4, y: 4, name: 'pinky' };
const inky = { x: 5, y: 12, name: 'inky' };
const clydeFar = { x: 1, y: 1, name: 'clyde' };
const clydeNear = { x: 11, y: 11, name: 'clyde' };

// Blinky targets Pacman directly
const blinkyTarget = getTargetTile(blinky, pacman, blinky, s1, 'chase');
assert.deepStrictEqual(blinkyTarget, { x: 10, y: 10 }, 'Blinky targets Pacman directly');

// Pinky targets 4 tiles ahead in pacman dir
const pinkyTarget = getTargetTile(pinky, pacman, blinky, s1, 'chase');
assert.deepStrictEqual(pinkyTarget, { x: 14, y: 10 }, 'Pinky targets 4 tiles ahead');

// Inky targets vector 2 ahead mirrored across Blinky
// Pacman (10, 10) + 2*right = (12, 10). Blinky is at (6, 10).
// Vector: (12 - 6, 10 - 10) = (6, 0). Target = (12 + 6, 10) = (18, 10).
const inkyTarget = getTargetTile(inky, pacman, blinky, s1, 'chase');
assert.deepStrictEqual(inkyTarget, { x: 18, y: 10 }, 'Inky vectors correctly');

// Clyde targets Pacman if > 8 tiles away
const clydeFarTarget = getTargetTile(clydeFar, pacman, blinky, s1, 'chase');
assert.deepStrictEqual(clydeFarTarget, { x: 10, y: 10 }, 'Clyde > 8 tiles targets Pacman');

// Clyde retreats to scatter corner if <= 8 tiles
const clydeNearTarget = getTargetTile(clydeNear, pacman, blinky, s1, 'chase');
assert.deepStrictEqual(clydeNearTarget, { x: 0, y: 30 }, 'Clyde <= 8 tiles targets corner');

// 4. Ghost Navigation & getNextGhostMove
// Blinky at (1, 1), Pacman at (5, 1). Blinky moving right: next move should be right to (2, 1)
const blinkyMove = getNextGhostMove({ x: 1, y: 1, dir: 'right', name: 'blinky' }, { x: 5, y: 1, dir: 'left' }, null, s1, 'chase');
assert.strictEqual(blinkyMove.dir, 'right');
assert.strictEqual(blinkyMove.x, 2);
assert.strictEqual(blinkyMove.y, 1);

// No 180-degree reversal: Blinky moving right cannot reverse left when another path exists
const cornerMove = getNextGhostMove({ x: 1, y: 1, dir: 'left', name: 'blinky' }, { x: 10, y: 10, dir: 'right' }, null, s1, 'chase');
// At (1, 1) moving left hits left wall (#), only down is open
assert.strictEqual(cornerMove.dir, 'down', 'Must turn down, cannot reverse into wall');
assert.strictEqual(cornerMove.x, 1);
assert.strictEqual(cornerMove.y, 2);

// Eaten ghost pathfinds to door (13, 12)
let eatenPos = { x: 1, y: 1, dir: 'right', name: 'blinky' };
let steps = 0;
while (!(eatenPos.x === 13 && eatenPos.y === 12) && steps < 100) {
  const move = getNextGhostMove(eatenPos, pacman, blinky, s1, 'eaten');
  eatenPos = { ...eatenPos, x: move.x, y: move.y, dir: move.dir };
  steps++;
}
assert.strictEqual(eatenPos.x, 13, 'Eaten ghost reached door col 13');
assert.strictEqual(eatenPos.y, 12, 'Eaten ghost reached door row 12');

// Re-emergence at door
const atDoorMove = getNextGhostMove({ x: 13, y: 12, dir: 'down', name: 'blinky' }, pacman, blinky, s1, 'eaten');
assert.strictEqual(atDoorMove.y, 13, 'Steps into house to revive');

// Frightened mode picks a walkable tile
const frightenedMove = getNextGhostMove({ x: 1, y: 5, dir: 'right', name: 'pinky' }, pacman, blinky, s1, 'frightened');
assert(['up', 'right', 'down'].includes(frightenedMove.dir), 'Picks valid non-reverse direction');
assert(isWalkable(getTile(s1, frightenedMove.x, frightenedMove.y), true, false), 'Destination walkable');

// Speed checks
assert.strictEqual(getGhostSpeed(blinky, s1, 'chase'), 110);
assert.strictEqual(getGhostSpeed(blinky, s1, 'eaten'), 220); // 2x speed
assert.strictEqual(getGhostSpeed(blinky, s1, 'frightened'), 66); // 0.6x speed

console.log('✓ ghostAi.js passed all checks!');

console.log('--- TEST: audio.js, input.js, swipe.js, mobileController.js, user.js ---');

// Mock Web environment
globalThis.localStorage = {
  store: {},
  getItem(key) { return this.store[key] || null; },
  setItem(key, val) { this.store[key] = String(val); },
  removeItem(key) { delete this.store[key]; }
};

let nodesCreated = [];
class MockNode {
  constructor() {
    this.connected = [];
    this.disconnected = false;
  }
  connect(dest) { this.connected.push(dest); }
  disconnect() { this.disconnected = true; }
}

class MockOscillator extends MockNode {
  constructor() {
    super();
    this.type = 'sine';
    this.frequency = {
      setValueAtTime: () => {},
      linearRampToValueAtTime: () => {},
      exponentialRampToValueAtTime: () => {}
    };
    nodesCreated.push(this);
  }
  start() {}
  stop() {
    if (this.onended) this.onended();
  }
}

class MockGain extends MockNode {
  constructor() {
    super();
    this.gain = {
      setValueAtTime: () => {},
      linearRampToValueAtTime: () => {},
      exponentialRampToValueAtTime: () => {}
    };
    nodesCreated.push(this);
  }
}

class MockAudioContext {
  constructor() {
    this.currentTime = 0;
    this.state = 'running';
    this.destination = new MockNode();
  }
  createOscillator() { return new MockOscillator(); }
  createGain() { return new MockGain(); }
  resume() { return Promise.resolve(); }
}

globalThis.window = {
  AudioContext: MockAudioContext,
  addEventListener: () => {},
  removeEventListener: () => {},
  innerWidth: 1024
};

try {
  Object.defineProperty(globalThis, 'navigator', {
    value: { maxTouchPoints: 0 },
    configurable: true,
    writable: true
  });
} catch (e) {}

// 5. audio.js
const audio = await import('./js/audio.js');
audio.initAudio(null);
assert.strictEqual(audio.isMuted(), false);

const sfxList = ['waka', 'eat', 'powerup', 'energizer', 'eat-ghost', 'death', 'fruit', 'clear', 'click', 'siren'];
for (const sfx of sfxList) {
  audio.playSfx(sfx);
}
assert(nodesCreated.length > 0, 'Oscillators and gains should have been created');
const disconnectedOscs = nodesCreated.filter(n => n instanceof MockOscillator && n.disconnected);
assert.strictEqual(disconnectedOscs.length, nodesCreated.filter(n => n instanceof MockOscillator).length, 'All oscillators disconnected on ended');

audio.playBgm('bgm-gameplay');
audio.stopBgm();

assert.strictEqual(audio.toggleMute(), true);
assert.strictEqual(audio.isMuted(), true);
assert.strictEqual(globalThis.localStorage.getItem('pacmanArcade_muted'), 'true');
assert.strictEqual(audio.toggleMute(), false);
assert.strictEqual(audio.isMuted(), false);
console.log('✓ audio.js passed all checks!');

// 6. input.js
const inputModule = await import('./js/input.js');
let recordedDir = null;
let pauseCalled = false;
const mockKaplay = {
  handlers: {},
  onKeyPress(key, fn) {
    this.handlers[key] = fn;
  }
};

const input = inputModule.initInput(mockKaplay, (dir) => { recordedDir = dir; }, () => { pauseCalled = true; });
mockKaplay.handlers['w']();
assert.strictEqual(recordedDir, 'up');
mockKaplay.handlers['s']();
assert.strictEqual(recordedDir, 'down');
mockKaplay.handlers['a']();
assert.strictEqual(recordedDir, 'left');
mockKaplay.handlers['d']();
assert.strictEqual(recordedDir, 'right');
mockKaplay.handlers['space']();
assert.strictEqual(pauseCalled, true);

input.setDirection('down');
assert.strictEqual(input.getDirection(), 'down');
console.log('✓ input.js passed all checks!');

// 7. swipe.js
const eventListeners = {};
const mockContainer = {
  addEventListener(event, fn) {
    eventListeners[event] = fn;
  },
  removeEventListener(event) {
    delete eventListeners[event];
  }
};
globalThis.document = {
  getElementById: (id) => id === 'game-container' ? mockContainer : null,
  body: mockContainer
};

const swipeModule = await import('./js/swipe.js');
let swipedDir = null;
const swipe = swipeModule.initSwipe((dir) => { swipedDir = dir; }, 20);

// Test Swipe Up
eventListeners['touchstart']({ touches: [{ clientX: 100, clientY: 200 }] });
eventListeners['touchend']({ changedTouches: [{ clientX: 100, clientY: 100 }] });
assert.strictEqual(swipedDir, 'up');

// Test Swipe Right
eventListeners['touchstart']({ touches: [{ clientX: 100, clientY: 100 }] });
eventListeners['touchend']({ changedTouches: [{ clientX: 200, clientY: 100 }] });
assert.strictEqual(swipedDir, 'right');

swipe.destroy();
assert.strictEqual(eventListeners['touchstart'], undefined);
console.log('✓ swipe.js passed all checks!');

// 8. mobileController.js
const dpadButtons = [
  { dir: 'up', listeners: {}, addEventListener(e, fn) { this.listeners[e] = fn; }, getAttribute: () => 'up', dataset: {} },
  { dir: 'down', listeners: {}, addEventListener(e, fn) { this.listeners[e] = fn; }, getAttribute: () => 'down', dataset: {} },
  { dir: 'left', listeners: {}, addEventListener(e, fn) { this.listeners[e] = fn; }, getAttribute: () => 'left', dataset: {} },
  { dir: 'right', listeners: {}, addEventListener(e, fn) { this.listeners[e] = fn; }, getAttribute: () => 'right', dataset: {} }
];

const mockDpadEl = {
  classList: {
    classes: new Set(),
    add(cls) { this.classes.add(cls); },
    remove(cls) { this.classes.delete(cls); },
    contains(cls) { return this.classes.has(cls); },
    toggle(cls) {
      if (this.classes.has(cls)) { this.classes.delete(cls); return false; }
      this.classes.add(cls); return true;
    }
  },
  querySelectorAll: () => dpadButtons
};

globalThis.document.getElementById = (id) => {
  if (id === 'virtual-dpad') return mockDpadEl;
  return null;
};

const mobileCtrl = await import('./js/mobileController.js');
let dpadDir = null;
const ctrl = mobileCtrl.initMobileController((dir) => { dpadDir = dir; });

dpadButtons[0].listeners['mousedown']({ preventDefault: () => {} });
assert.strictEqual(dpadDir, 'up');
dpadButtons[3].listeners['mousedown']({ preventDefault: () => {} });
assert.strictEqual(dpadDir, 'right');

ctrl.show();
assert.strictEqual(mockDpadEl.classList.contains('visible'), true);
ctrl.hide();
assert.strictEqual(mockDpadEl.classList.contains('visible'), false);
console.log('✓ mobileController.js passed all checks!');

// 9. user.js
import fs from 'node:fs';
const userContent = fs.readFileSync('./games/pacman-arcade/js/user.js', 'utf-8');
assert(userContent.includes('export async function getCurrentUser'), 'getCurrentUser missing');
assert(userContent.includes('export async function getUserProfile'), 'getUserProfile missing');
assert(userContent.includes('export async function updateGameStats'), 'updateGameStats missing');
assert(userContent.includes('export async function savePacmanScore'), 'savePacmanScore missing');
assert(userContent.includes('export async function loadPacmanProgress'), 'loadPacmanProgress missing');
assert(userContent.includes('pacmanArcade'), 'pacmanArcade key missing');
assert(userContent.includes('pacmanArcade_guest'), 'guest fallback missing');
console.log('✓ user.js passed all checks!');

console.log('All tests passed successfully with 0 errors.');
