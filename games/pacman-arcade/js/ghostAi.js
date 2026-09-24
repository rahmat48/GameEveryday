// ghostAi.js - Comprehensive arcade Pacman Ghost AI for Blinky, Pinky, Inky, Clyde
import { getTile, isWalkable } from './stages.js';

export const DIRECTIONS = {
  UP: 'up',
  LEFT: 'left',
  DOWN: 'down',
  RIGHT: 'right'
};

export const DIR_VECTORS = {
  up: { x: 0, y: -1 },
  left: { x: -1, y: 0 },
  down: { x: 0, y: 1 },
  right: { x: 1, y: 0 }
};

export const OPPOSITE_DIR = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left'
};

// Arcade Pac-Man tie-breaking priority order: UP, LEFT, DOWN, RIGHT
export const DIR_PRIORITY = ['up', 'left', 'down', 'right'];

export const GHOST_CONFIGS = [
  {
    id: 'blinky',
    name: 'BLINKY',
    color: '#ef4444',
    spawnOffset: { col: 13.5, row: 11 },
    startState: 'scatter',
    exitDotThreshold: 0,
    scatterCorner: { col: 25, row: 0 },
    scatterTarget: { x: 25, y: 0 },
    spawn: { x: 13, y: 11 },
    initialDir: 'left'
  },
  {
    id: 'pinky',
    name: 'PINKY',
    color: '#f472b6',
    spawnOffset: { col: 13.5, row: 14 },
    startState: 'house',
    exitDotThreshold: 0,
    scatterCorner: { col: 2, row: 0 },
    scatterTarget: { x: 2, y: 0 },
    spawn: { x: 13, y: 14 },
    initialDir: 'up'
  },
  {
    id: 'inky',
    name: 'INKY',
    color: '#06b6d4',
    spawnOffset: { col: 11.5, row: 14 },
    startState: 'house',
    exitDotThreshold: 30,
    scatterCorner: { col: 27, row: 30 },
    scatterTarget: { x: 27, y: 30 },
    spawn: { x: 12, y: 14 },
    initialDir: 'up'
  },
  {
    id: 'clyde',
    name: 'CLYDE',
    color: '#f97316',
    spawnOffset: { col: 15.5, row: 14 },
    startState: 'house',
    exitDotThreshold: 60,
    scatterCorner: { col: 0, row: 30 },
    scatterTarget: { x: 0, y: 30 },
    spawn: { x: 15, y: 14 },
    initialDir: 'up'
  }
];

// Dual array/object indexing for flexible consumption
GHOST_CONFIGS.blinky = GHOST_CONFIGS[0];
GHOST_CONFIGS.pinky = GHOST_CONFIGS[1];
GHOST_CONFIGS.inky = GHOST_CONFIGS[2];
GHOST_CONFIGS.clyde = GHOST_CONFIGS[3];

export const GHOST_ARRAY = GHOST_CONFIGS;

/**
 * Normalizes direction input (string or vector).
 * @param {string|object} dir
 * @returns {string} 'up' | 'down' | 'left' | 'right'
 */
export function normalizeDir(dir) {
  if (typeof dir === 'string') {
    const lower = dir.toLowerCase();
    if (DIR_VECTORS[lower]) return lower;
  }
  if (dir && typeof dir === 'object') {
    if (dir.y < 0) return 'up';
    if (dir.y > 0) return 'down';
    if (dir.x < 0) return 'left';
    if (dir.x > 0) return 'right';
  }
  return 'up';
}

/**
 * Finds ghost door coordinate (where '=' is situated).
 * @param {object|string[]} stage
 * @returns {{ x: number, y: number }}
 */
export function getGhostDoor(stage) {
  const map = Array.isArray(stage) ? stage : (stage?.map || stage);
  if (map) {
    for (let r = 0; r < map.length; r++) {
      const idx = map[r].indexOf('=');
      if (idx !== -1) return { x: idx, y: r };
    }
  }
  return { x: 13, y: 12 };
}

// Cached BFS flow fields for eaten mode: Map<stageMapRef, flowField>
// ponytail: weak cache prevents recalculating 28x31 BFS every frame for eaten eyes
const doorFlowFieldCache = new WeakMap();

/**
 * Generates or retrieves vector flow field directing any tile to the ghost door.
 * @param {object|string[]} stage
 * @returns {{ doorX: number, doorY: number, flow: Array<Array<{x: number, y: number, dir: string}>> }}
 */
export function getDoorFlowField(stage) {
  const map = Array.isArray(stage) ? stage : (stage?.map || stage);
  const key = Array.isArray(map) ? map : stage;
  if (doorFlowFieldCache.has(key)) {
    return doorFlowFieldCache.get(key);
  }

  const H = map.length;
  const W = map[0].length;
  const door = getGhostDoor(stage);
  const flow = Array.from({ length: H }, () => Array(W).fill(null));
  const visited = Array.from({ length: H }, () => Array(W).fill(false));
  const queue = [[door.x, door.y]];
  visited[door.y][door.x] = true;

  // BFS backwards from door to map all tiles to optimal next step
  while (queue.length > 0) {
    const [cx, cy] = queue.shift();
    const neighbors = [
      { x: cx, y: cy - 1, dir: 'down' },
      { x: cx, y: cy + 1, dir: 'up' },
      { x: cx - 1, y: cy, dir: 'right' },
      { x: cx + 1, y: cy, dir: 'left' }
    ];

    for (const n of neighbors) {
      let nx = n.x;
      let ny = n.y;
      if (ny === 14) {
        if (nx < 0) nx = W - 1;
        if (nx >= W) nx = 0;
      }
      if (ny >= 0 && ny < H && nx >= 0 && nx < W) {
        const tile = map[ny][nx];
        // Eaten ghost eyes pass non-walls and ghost house gate
        if (tile !== '#' && !visited[ny][nx]) {
          visited[ny][nx] = true;
          flow[ny][nx] = { x: cx, y: cy, dir: n.dir };
          queue.push([nx, ny]);
        }
      }
    }
  }

  const result = { doorX: door.x, doorY: door.y, flow };
  if (key && typeof key === 'object') {
    doorFlowFieldCache.set(key, result);
  }
  return result;
}

/**
 * Calculates current target tile for given ghost based on mode and personality.
 * @param {object} ghost
 * @param {object} pacman
 * @param {object} [blinky]
 * @param {object} stage
 * @param {string} mode
 * @returns {{ x: number, y: number }}
 */
export function getTargetTile(ghost, pacman, blinky, stage, mode) {
  const name = (ghost?.type || ghost?.id || ghost?.config?.name || ghost?.name || '').toLowerCase();
  const config = GHOST_CONFIGS[name] || {};

  if (mode === 'scatter') {
    return ghost?.scatterTarget || config.scatterTarget || config.scatterCorner || { x: 0, y: 0 };
  }

  if (mode === 'eaten') {
    return getGhostDoor(stage);
  }

  const px = Math.round(pacman?.x ?? pacman?.col ?? 13);
  const py = Math.round(pacman?.y ?? pacman?.row ?? 23);
  const pdir = normalizeDir(pacman?.dir ?? 'left');
  const pvec = DIR_VECTORS[pdir] || { x: -1, y: 0 };

  // Chase Mode Targeting
  // Blinky: targets Pacman directly
  if (name.includes('blinky')) {
    return { x: px, y: py };
  }

  // Pinky: targets 4 tiles ahead of Pacman
  if (name.includes('pinky')) {
    return { x: px + 4 * pvec.x, y: py + 4 * pvec.y };
  }

  // Inky: vectors 2 tiles ahead of Pacman, mirrored across Blinky
  if (name.includes('inky')) {
    const ix = px + 2 * pvec.x;
    const iy = py + 2 * pvec.y;
    const bx = Math.round(blinky?.x ?? blinky?.col ?? px);
    const by = Math.round(blinky?.y ?? blinky?.row ?? py);
    return { x: 2 * ix - bx, y: 2 * iy - by };
  }

  // Clyde: targets Pacman if > 8 tiles away; retreats to scatter corner if <= 8 tiles
  if (name.includes('clyde')) {
    const gx = Math.round(ghost?.x ?? ghost?.col ?? 0);
    const gy = Math.round(ghost?.y ?? ghost?.row ?? 0);
    const distSq = (gx - px) ** 2 + (gy - py) ** 2;
    if (distSq >= 64) {
      return { x: px, y: py };
    }
    return ghost?.scatterTarget || config.scatterTarget || config.scatterCorner || { x: 0, y: 30 };
  }

  // Fallback direct targeting
  return { x: px, y: py };
}

/**
 * Calculates the next tile coordinate and direction for the ghost.
 * @param {object} ghost - Ghost instance with { x, y, dir, mode, name/type }
 * @param {object} pacman - Pacman instance with { x, y, dir }
 * @param {object} [blinky] - Blinky instance for Inky vector calculations
 * @param {object|string[]} stage - Current stage or map
 * @param {string} [currentMode] - Mode override ("house"|"leaving"|"chase"|"scatter"|"frightened"|"eaten")
 * @returns {{ x: number, y: number, dir: string, state?: string }}
 */
export function getNextGhostMove(ghost, pacman, blinky, stage, currentMode) {
  const mode = currentMode || ghost?.mode || ghost?.state || 'chase';
  const gx = Math.round(ghost.x ?? ghost.col ?? 0);
  const gy = Math.round(ghost.y ?? ghost.row ?? 0);
  const currentDir = normalizeDir(ghost.dir);
  const oppDir = OPPOSITE_DIR[currentDir];
  const door = getGhostDoor(stage);

  // 1. House mode: bobs up and down inside ghost house
  if (mode === 'house') {
    let nextDir = currentDir === 'down' ? 'down' : 'up';
    if (gy <= 13) nextDir = 'down';
    if (gy >= 15) nextDir = 'up';
    const dy = nextDir === 'up' ? -1 : 1;
    return { x: gx, y: gy + dy, dir: nextDir, state: 'house' };
  }

  // 2. Leaving mode: navigates through gate '=' to maze corridor
  if (mode === 'leaving') {
    if (gx < door.x) {
      return { x: gx + 1, y: gy, dir: 'right', state: 'leaving' };
    }
    if (gx > door.x) {
      return { x: gx - 1, y: gy, dir: 'left', state: 'leaving' };
    }
    if (gy > door.y - 1) {
      return { x: gx, y: gy - 1, dir: 'up', state: 'leaving' };
    }
    return { x: gx, y: gy, dir: 'left', state: 'emerged' };
  }

  // 3. Eaten mode: eyes pathfinding back to ghost door at 2x speed
  if (mode === 'eaten') {
    if (gx === door.x && gy === door.y) {
      return { x: door.x, y: door.y + 1, dir: 'down', state: 'reentered' };
    }
    if (gx === door.x && gy >= door.y + 1) {
      return { x: door.x, y: door.y + 1, dir: 'up', state: 'revived' };
    }

    const { flow } = getDoorFlowField(stage);
    const next = flow[gy]?.[gx];
    if (next) {
      return { x: next.x, y: next.y, dir: next.dir, state: 'eaten' };
    }
  }

  // 4. Frightened mode: pseudo-random selection at junctions
  if (mode === 'frightened') {
    const validMoves = [];
    for (const dir of DIR_PRIORITY) {
      if (dir === oppDir) continue; // No 180-degree turn
      const vec = DIR_VECTORS[dir];
      let nx = gx + vec.x;
      const ny = gy + vec.y;
      if (ny === 14) nx = ((nx % 28) + 28) % 28;
      const tile = getTile(stage, nx, ny);
      if (isWalkable(tile, true, false)) {
        validMoves.push({ x: nx, y: ny, dir });
      }
    }

    if (validMoves.length === 0) {
      const vec = DIR_VECTORS[oppDir];
      let nx = gx + vec.x;
      const ny = gy + vec.y;
      if (ny === 14) nx = ((nx % 28) + 28) % 28;
      return { x: nx, y: ny, dir: oppDir, state: 'frightened' };
    }

    const choice = validMoves[Math.floor(Math.random() * validMoves.length)];
    return { ...choice, state: 'frightened' };
  }

  // 5. Chase and Scatter modes: distance minimization to target tile
  const target = ghost?.scatterTarget && mode === 'scatter'
    ? ghost.scatterTarget
    : getTargetTile(ghost, pacman, blinky, stage, mode);

  let bestCandidate = null;
  let bestDistSq = Infinity;
  let reverseCandidate = null;

  for (const dir of DIR_PRIORITY) {
    const vec = DIR_VECTORS[dir];
    let nx = gx + vec.x;
    const ny = gy + vec.y;
    if (ny === 14) nx = ((nx % 28) + 28) % 28;

    const tile = getTile(stage, nx, ny);
    if (!isWalkable(tile, true, false)) continue;

    const distSq = (nx - target.x) ** 2 + (ny - target.y) ** 2;

    if (dir === oppDir) {
      reverseCandidate = { x: nx, y: ny, dir, state: mode };
      continue;
    }

    // Strict less-than maintains arcade tie-breaking priority (UP > LEFT > DOWN > RIGHT)
    if (distSq < bestDistSq) {
      bestDistSq = distSq;
      bestCandidate = { x: nx, y: ny, dir, state: mode };
    }
  }

  if (bestCandidate) {
    return bestCandidate;
  }

  if (reverseCandidate) {
    return reverseCandidate;
  }

  return { x: gx, y: gy, dir: currentDir, state: mode };
}

/**
 * Compatibility function for gameplay scenes: returns target tile { col, row }.
 */
export function getGhostTargetTile(ghost, pacman, blinky, globalMode) {
  const mode = ghost.state === 'frightened' || ghost.state === 'eaten'
    ? ghost.state
    : (globalMode || ghost.mode || 'chase');
  const target = getTargetTile(ghost, pacman, blinky, null, mode);
  return { col: target.x, row: target.y, x: target.x, y: target.y };
}

/**
 * Compatibility function for gameplay scenes: returns direction vector { x, y, angle }.
 * ghost must have .col and .row as tile coords (not pixels).
 */
export function getNextGhostDirection(ghost, targetTile, map, isFrightened) {
  const mode = isFrightened ? 'frightened' : (ghost.state || 'chase');
  // Use tile coords (.col/.row), never pixel .x/.y
  const gTileX = ghost.col ?? 13;
  const gTileY = ghost.row ?? 11;

  const target = targetTile
    ? { x: targetTile.col ?? targetTile.x ?? 13, y: targetTile.row ?? targetTile.y ?? 11 }
    : null;

  const scatterCorner = ghost.config?.scatterCorner || ghost.scatterCorner || null;

  const move = getNextGhostMove(
    {
      x: gTileX,
      y: gTileY,
      dir: ghost.dir,
      mode,
      name: ghost.config?.name || ghost.name,
      // scatterTarget only used in scatter mode — pass corner, not chase target
      scatterTarget: mode === 'scatter' ? scatterCorner : target
    },
    target ? { x: target.x, y: target.y, dir: 'left' } : null,
    null,
    map,
    mode
  );

  const DIR_MAP = {
    up: { x: 0, y: -1, angle: -Math.PI / 2 },
    down: { x: 0, y: 1, angle: Math.PI / 2 },
    left: { x: -1, y: 0, angle: Math.PI },
    right: { x: 1, y: 0, angle: 0 }
  };
  return DIR_MAP[move.dir] || DIR_MAP.up;
}

/**
 * Returns ghost speed in pixels per second.
 * @param {object} ghost
 * @param {object} stage
 * @param {string} [currentMode]
 * @returns {number}
 */
export function getGhostSpeed(ghost, stage, currentMode) {
  const baseSpeed = stage?.ghostSpeed ?? 110;
  const mode = currentMode || ghost?.mode || ghost?.state || 'chase';
  if (mode === 'eaten') return baseSpeed * 2;
  if (mode === 'frightened') return baseSpeed * 0.6;
  if (ghost?.inTunnel) return baseSpeed * 0.5;
  return baseSpeed;
}

export default {
  DIRECTIONS,
  DIR_VECTORS,
  OPPOSITE_DIR,
  DIR_PRIORITY,
  GHOST_CONFIGS,
  normalizeDir,
  getGhostDoor,
  getTargetTile,
  getNextGhostMove,
  getGhostTargetTile,
  getNextGhostDirection,
  getGhostSpeed
};
