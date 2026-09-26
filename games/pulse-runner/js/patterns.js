/**
 * patterns.js
 * Pattern bank Pulse Runner: chunk obstacle yang sudah di-balance.
 * Data-only module — mudah ditambah/di-tweak tanpa menyentuh gameplay.js.
 *
 * Struktur chunk:
 *   id          : identifier (anti pengulangan berturut-turut)
 *   minDist     : jarak minimum (meter) agar pola boleh muncul
 *   blocks      : [x, "F"|"C", h]  balok dari lantai(F)/plafon(C) setinggi h
 *   mines       : [x, yAbs]         ranjap melayang di koordinat Y absolut
 *   orbs        : [x, lane]         lane: 1=floor, -1=ceiling, 0=mid (transit)
 *   laser       : {x, side, telegraph, active}  gerbang laser berkedip
 *   gatling     : true              pola event Gatling (dipicu per 1000m)
 */

export const CHUNK_W = 240;

export const PATTERNS = [
  {
    id: "open",
    minDist: 0,
    blocks: [],
    orbs: [[60, 1], [120, 1], [180, 1]]
  },
  {
    id: "low_block",
    minDist: 0,
    blocks: [[80, "F", 52]],
    orbs: [[140, -1], [190, -1]]
  },
  {
    id: "high_block",
    minDist: 0,
    blocks: [[80, "C", 52]],
    orbs: [[140, 1], [190, 1]]
  },
  {
    id: "zigzag",
    minDist: 400,
    blocks: [[40, "F", 52], [140, "C", 52]],
    orbs: [[90, 1], [90, -1], [200, 1]]
  },
  {
    id: "stagger",
    minDist: 700,
    blocks: [[50, "F", 60], [110, "C", 60], [180, "F", 60]],
    orbs: [[80, -1], [145, 1]]
  },
  {
    id: "mine_lane",
    minDist: 900,
    blocks: [[40, "F", 52]],
    mines: [[150, 300], [190, 300]],
    orbs: [[100, 1]]
  },
  {
    id: "pinch",
    minDist: 1300,
    blocks: [[60, "F", 64], [110, "C", 64], [190, "F", 52]],
    orbs: [[85, -1], [150, 1]]
  },
  {
    id: "mine_double",
    minDist: 1600,
    blocks: [[60, "C", 52], [170, "F", 52]],
    mines: [[115, 260], [115, 340]],
    orbs: [[115, 0]]
  },
  {
    id: "laser_gate",
    minDist: 1500,
    blocks: [],
    laser: { x: 120, side: "F", telegraph: 0.5, active: 0.45 },
    orbs: [[60, 1], [180, -1]]
  },
  {
    id: "gauntlet",
    minDist: 2200,
    blocks: [[40, "F", 60], [100, "C", 60], [160, "F", 60]],
    mines: [[200, 300]],
    orbs: [[70, -1], [130, 1]]
  },
  {
    id: "pinch_fast",
    minDist: 2800,
    blocks: [[50, "F", 64], [95, "C", 64], [150, "F", 64], [195, "C", 64]],
    orbs: [[72, -1], [122, 1], [172, -1]]
  },
  {
    id: "mine_wall",
    minDist: 3200,
    blocks: [[120, "C", 52]],
    mines: [[50, 380], [70, 300], [50, 220]],
    orbs: [[180, 1]]
  }
];

/**
 * Pilih pola berikutnya yang eligible: sudah melewati minDist,
 * tidak mengulang pola sebelumnya, dan tidak langsung mengulang
 * pola dengan id yang sama dua langkah berturut-turut.
 * @param {number} dist meter saat ini
 * @param {string|null} lastId id pola terakhir
 * @param {string|null} prevId id pola sebelum terakhir
 */
export function pickPattern(dist, lastId, prevId) {
  const eligible = PATTERNS.filter(
    (p) => p.minDist <= dist && p.id !== lastId && p.id !== prevId
  );
  if (eligible.length === 0) return PATTERNS[0];
  return eligible[Math.floor(Math.random() * eligible.length)];
}
