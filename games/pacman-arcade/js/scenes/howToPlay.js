/**
 * howToPlay.js
 * Scene Panduan & Aturan Permainan Pacman Arcade.
 */

import { makeButton, retroPanel } from "../ui.js";
import { updateDpadSceneVisibility } from "../mobileController.js";

export function howToPlayScene(k) {
  k.scene("howToPlay", () => {
    updateDpadSceneVisibility(false);
    // Starfield Background
    for (let i = 0; i < 30; i++) {
      k.add([
        k.rect(2, 2),
        k.pos(k.rand(0, 800), k.rand(0, 600)),
        k.color(255, 255, 255),
        k.opacity(k.rand(0.15, 0.5)),
        k.z(-10)
      ]);
    }

    // Title
    k.add([
      k.text("PANDUAN PROTOKOL PACMAN", { size: 28, font: "monospace" }),
      k.pos(400, 45),
      k.anchor("center"),
      k.color(250, 204, 21)
    ]);

    // Container Panel
    retroPanel(k, {
      pos: k.vec2(60, 85),
      width: 680,
      height: 440,
      borderColor: k.rgb(37, 99, 235),
      bgColor: k.rgb(10, 10, 26),
      z: 1
    });

    const items = [
      {
        icon: "🎮",
        title: "KONTROL NAVIGASI",
        desc: "Keyboard: Tombol Panah (Arrow Keys) atau W, A, S, D.\nMobile: Usap Layar (Swipe) atau sentuh tombol DPAD di layar."
      },
      {
        icon: "🟡",
        title: "DATA PELLETS & ENERGIZER",
        desc: "Lahap seluruh Pellet (10 Pts) untuk membuka Stage berikutnya.\nMakan ENERGIZER (50 Pts) untuk membalik situasi: buru hantu biru!"
      },
      {
        icon: "👻",
        title: "4 SIKAP HANTU CYBER",
        desc: "Blinky: Kejar lurus | Pinky: Hadang 4 petak depan\nInky: Jepit ganda Blinky | Clyde: Dekat mundur, jauh serang"
      },
      {
        icon: "⚡",
        title: "KOMBO GHOST EATER & BUAH KOSMIK",
        desc: "Makan hantu berurutan: 200 -> 400 -> 800 -> 1600 Pts!\nTangkap Buah Kosmik di tengah labirin untuk bonus 100 - 1000 Pts."
      },
      {
        icon: "🌀",
        title: "TUNNEL WARP & MULTI-STAGE",
        desc: "Gunakan terowongan kiri/kanan untuk teleportasi instan lolos kepungan.\nTaklukkan Stage 1 s.d Stage 4 dengan tata letak & kecepatan bertahap!"
      }
    ];

    let startY = 105;
    items.forEach(item => {
      // Icon
      k.add([
        k.text(item.icon, { size: 20, font: "monospace" }),
        k.pos(85, startY),
        k.z(5)
      ]);

      // Title
      k.add([
        k.text(item.title, { size: 14, font: "monospace" }),
        k.pos(120, startY + 2),
        k.color(0, 212, 255),
        k.z(5)
      ]);

      // Description
      k.add([
        k.text(item.desc, { size: 12, width: 600, lineSpacing: 5, font: "monospace" }),
        k.pos(120, startY + 24),
        k.color(224, 224, 255),
        k.z(5)
      ]);

      startY += 76;
    });

    // Back Button
    makeButton(k, "◀ KEMBALI KE MENU", k.vec2(400, 555), () => {
      k.go("menu");
    }, 260, 42);

    k.onKeyPress("escape", () => k.go("menu"));
    k.onKeyPress("space", () => k.go("menu"));
  });
}
