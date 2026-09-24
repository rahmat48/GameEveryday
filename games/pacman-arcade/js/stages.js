// stages.js - Stage layouts and tile helpers for Pacman Arcade

/**
 * Tile encoding:
 * '#' = Wall
 * '.' = Dot
 * 'O' = Power Pellet (energizer)
 * ' ' = Empty space / tunnel
 * '=' = Ghost house gate
 * 'G' = Ghost house spawn
 * 'P' = Pacman spawn
 * 'F' = Fruit spawn point
 */

// Helper to construct horizontally symmetrical 28x31 mazes
// ponytail: left-half mirror enforces 100% geometric and pellet symmetry
function mirrorHalf(leftHalf) {
  return leftHalf.map((row) => {
    let right = '';
    for (let c = 13; c >= 0; c--) {
      const ch = row[c];
      // P and F are unique center-spawn entities; their mirrored counterpart is walkable path
      right += (ch === 'P' || ch === 'F') ? ' ' : ch;
    }
    return row + right;
  });
}

// Stage 1: CYBER LABYRINTH
// Balanced classic arcade architecture with clean orthogonal turns
const STAGE_1_LEFT = [
  '##############', // 0
  '#............#', // 1
  '#.####.#####.#', // 2
  '#O####.#####.#', // 3
  '#.####.#####.#', // 4
  '#............#', // 5
  '#.####.##.####', // 6
  '#.####.##.####', // 7
  '#......##....#', // 8
  '######.##### #', // 9
  '######.##### #', // 10
  '######.##     ', // 11
  '######.## ###=', // 12 (Ghost house gate '=' at cols 13, 14)
  '######.## #   ', // 13
  '          # GG', // 14 (Warp tunnel cols 0-5, Ghost house interior 'GG')
  '######.## ####', // 15
  '######.##     ', // 16
  '######.##    F', // 17 (Fruit spawn 'F' at col 13)
  '######.## ####', // 18
  '######.## ####', // 19
  '#............#', // 20
  '#.####.#####.#', // 21
  '#.####.#####.#', // 22
  '#O..##.......P', // 23 (Pacman spawn 'P' at col 13)
  '###.##.##.####', // 24
  '###.##.##.####', // 25
  '#......##....#', // 26
  '#.##########.#', // 27
  '#.##########.#', // 28
  '#............#', // 29
  '##############'  // 30
];

// Stage 2: QUANTUM CITADEL
// Fortress aesthetic with wide twin bastions and defense corridors
const STAGE_2_LEFT = [
  '##############', // 0
  '#............#', // 1
  '#.#####.####.#', // 2
  '#O#####.####.#', // 3
  '#.#####.####.#', // 4
  '#............#', // 5
  '#.##.######.##', // 6
  '#.##.######.##', // 7
  '#....#....#..#', // 8
  '####.#.##.#.##', // 9
  '####.#.##.#. #', // 10
  '######.##     ', // 11
  '######.## ###=', // 12
  '######.## #   ', // 13
  '          # GG', // 14
  '######.## ####', // 15
  '######.##     ', // 16
  '######.##    F', // 17
  '######.## ####', // 18
  '######.## ####', // 19
  '#............#', // 20
  '#.####.#####.#', // 21
  '#.####.#####.#', // 22
  '#O..##.......P', // 23
  '###.##.#####.#', // 24
  '###.##.#####.#', // 25
  '#......#.....#', // 26
  '#.######.#####', // 27
  '#.######.#####', // 28
  '#............#', // 29
  '##############'  // 30
];

// Stage 3: NEON CORE
// High-frequency concentric circuit tracks and loop highways
const STAGE_3_LEFT = [
  '##############', // 0
  '#............#', // 1
  '#.##.###.###.#', // 2
  '#O##.###.###.#', // 3
  '#............#', // 4
  '#.######.##.##', // 5
  '#.######.##.##', // 6
  '#........##..#', // 7
  '####.###.##.##', // 8
  '####.###.##. #', // 9
  '####.###.##. #', // 10
  '######.##     ', // 11
  '######.## ###=', // 12
  '######.## #   ', // 13
  '          # GG', // 14
  '######.## ####', // 15
  '######.##     ', // 16
  '######.##    F', // 17
  '######.## ####', // 18
  '######.## ####', // 19
  '#............#', // 20
  '#.###.######.#', // 21
  '#.###.######.#', // 22
  '#O..#........P', // 23
  '##.###.##.####', // 24
  '##.###.##.####', // 25
  '#......##....#', // 26
  '#.##########.#', // 27
  '#.##########.#', // 28
  '#............#', // 29
  '##############'  // 30
];

// Stage 4: HYPERSPACE SINGULARITY
// Stepped angular walls and high-pressure gravity pockets
const STAGE_4_LEFT = [
  '##############', // 0
  '#............#', // 1
  '#.###.######.#', // 2
  '#O###.######.#', // 3
  '#.....#......#', // 4
  '###.###.####.#', // 5
  '###.###.####.#', // 6
  '#............#', // 7
  '#.#####.####.#', // 8
  '#.#####.#### #', // 9
  '######.##### #', // 10
  '######.##     ', // 11
  '######.## ###=', // 12
  '######.## #   ', // 13
  '          # GG', // 14
  '######.## ####', // 15
  '######.##     ', // 16
  '######.##    F', // 17
  '######.## ####', // 18
  '######.## ####', // 19
  '#............#', // 20
  '#.#####.####.#', // 21
  '#.#####.####.#', // 22
  '#O..#........P', // 23
  '###.#.######.#', // 24
  '###.#.######.#', // 25
  '#.....#......#', // 26
  '#.###.######.#', // 27
  '#.###.######.#', // 28
  '#............#', // 29
  '##############'  // 30
];

export const STAGES = [
  {
    id: 1,
    name: 'CYBER LABYRINTH',
    wallColor: '#00f0ff',
    wallOutline: '#003b5c',
    frightenedDuration: 8,
    pacmanSpeed: 120,
    ghostSpeed: 110,
    fruit: { name: 'Cyber Cherry', points: 100, symbol: '🍒', color: '#ff2255' },
    map: mirrorHalf(STAGE_1_LEFT)
  },
  {
    id: 2,
    name: 'QUANTUM CITADEL',
    wallColor: '#d946ef',
    wallOutline: '#5b0e68',
    frightenedDuration: 7,
    pacmanSpeed: 130,
    ghostSpeed: 122,
    fruit: { name: 'Quantum Berry', points: 300, symbol: '🍓', color: '#ff4488' },
    map: mirrorHalf(STAGE_2_LEFT)
  },
  {
    id: 3,
    name: 'NEON CORE',
    wallColor: '#22c55e',
    wallOutline: '#052e16',
    frightenedDuration: 6,
    pacmanSpeed: 140,
    ghostSpeed: 134,
    fruit: { name: 'Neon Orange', points: 500, symbol: '🍊', color: '#ffaa00' },
    map: mirrorHalf(STAGE_3_LEFT)
  },
  {
    id: 4,
    name: 'HYPERSPACE SINGULARITY',
    wallColor: '#f59e0b',
    wallOutline: '#78350f',
    frightenedDuration: 5,
    pacmanSpeed: 150,
    ghostSpeed: 145,
    fruit: { name: 'Singularity Key', points: 1000, symbol: '🔑', color: '#00ffff' },
    map: mirrorHalf(STAGE_4_LEFT)
  }
];

/**
 * Returns true if tile is solid wall.
 * @param {string} tile
 * @returns {boolean}
 */
export function isWall(tile) {
  return tile === '#';
}

/**
 * Returns true if tile can be traversed by entity.
 * @param {string} tile
 * @param {boolean} [isGhost=false]
 * @param {boolean} [isGhostHouseGate=false]
 * @returns {boolean}
 */
export function isWalkable(tile, isGhost = false, isGhostHouseGate = false) {
  if (!tile || tile === '#') return false;
  if (tile === '=') return Boolean(isGhost && isGhostHouseGate);
  if (tile === 'G') return Boolean(isGhost);
  return tile === '.' || tile === 'O' || tile === ' ' || tile === 'P' || tile === 'F';
}

/**
 * Retrieves tile character at (col, row), handling warp tunnels on row 14.
 * @param {object|string[]} stage - Stage object with .map or raw map array
 * @param {number} col
 * @param {number} row
 * @returns {string} Tile character or '#' if out of bounds
 */
export function getTile(stage, col, row) {
  const map = Array.isArray(stage) ? stage : (stage?.map || stage);
  if (!map || row < 0 || row >= map.length) return '#';

  // Row 14 is horizontal warp tunnel
  if (row === 14) {
    const wrappedCol = ((col % 28) + 28) % 28;
    return map[14][wrappedCol] ?? '#';
  }

  if (col < 0 || col >= 28) return '#';
  return map[row][col] ?? '#';
}

/**
 * Finds stage by ID (1-4).
 * @param {number} id
 * @returns {object|undefined}
 */
export function getStage(id) {
  return STAGES.find((s) => s.id === id) || STAGES[0];
}

export const getTileAt = (map, col, row) => getTile(map, col, row);
export const isWalkableForPacman = (tile) => isWalkable(tile, false, false);
export const isWalkableForGhost = (tile, isLeaving, isEaten) => isWalkable(tile, true, isLeaving || isEaten);

export default STAGES;
