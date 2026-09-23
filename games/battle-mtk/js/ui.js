/**
 * ui.js
 * Kumpulan helper pembuatan komponen UI retro berbasis Kaplay.
 */

/**
 * Membuat tombol retro dengan hover dan animasi klik.
 */
export function getGameThemeColors(k) {
  const t = localStorage.getItem('hub_selected_theme') || 'purple';
  if (t === 'green') {
    return {
      primary: k.rgb(34, 197, 94),
      secondary: k.rgb(168, 85, 247),
      border: k.rgb(34, 197, 94)
    };
  } else if (t === 'light') {
    return {
      primary: k.rgb(2, 132, 199),
      secondary: k.rgb(56, 189, 248),
      border: k.rgb(2, 132, 199)
    };
  } else {
    // Default: Midnight Purple
    return {
      primary: k.rgb(168, 85, 247),
      secondary: k.rgb(217, 70, 239),
      border: k.rgb(217, 70, 239)
    };
  }
}

export function makeButton(k, text, pos, onClick, width = 220, height = 52) {
  const theme = getGameThemeColors(k);
  const btn = k.add([
    k.rect(width, height, { radius: 6 }),
    k.pos(pos),
    k.anchor("center"),
    k.color(theme.primary),
    k.outline(3, theme.border),
    k.area(),
    k.scale(1),
    "btn"
  ]);

  const label = btn.add([
    k.text(text, { size: 24, font: "monospace" }),
    k.anchor("center"),
    k.color(255, 255, 255)
  ]);

  btn.onHoverUpdate(() => {
    btn.scale = k.vec2(1.05);
    k.setCursor("pointer");
  });

  btn.onHoverEnd(() => {
    btn.scale = k.vec2(1);
    k.setCursor("default");
  });

  btn.onClick(() => {
    btn.scale = k.vec2(0.95);
    k.wait(0.08, () => {
      btn.scale = k.vec2(1);
      if (onClick) onClick();
    });
  });

  return btn;
}

/**
 * Membuat HP bar dengan animasi perubahan nilai.
 */
export function makeHpBar(k, pos, maxHp = 100, color = k.rgb(34, 197, 94), width = 260, height = 20) {
  const bg = k.add([
    k.rect(width, height, { radius: 2 }),
    k.pos(pos),
    k.color(15, 15, 25),
    k.outline(1, k.rgb(100, 100, 120))
  ]);

  const bar = bg.add([
    k.rect(width, height, { radius: 2 }),
    k.pos(0, 0),
    k.color(color)
  ]);

  return {
    setValue(currentHp) {
      const targetPercent = Math.max(0, Math.min(1, currentHp / maxHp));
      k.tween(
        bar.width,
        width * targetPercent,
        0.2,
        (val) => { bar.width = val; },
        k.easings.easeOutQuad
      );
    }
  };
}

/**
 * Membuat Timer bar dengan perubahan warna dinamis (hijau -> kuning -> merah).
 */
export function makeTimerBar(k, pos, maxTime = 10, width = 760, height = 12) {
  const bg = k.add([
    k.rect(width, height, { radius: 2 }),
    k.pos(pos),
    k.color(15, 15, 25),
    k.outline(1, k.rgb(100, 100, 120))
  ]);

  const bar = bg.add([
    k.rect(width, height, { radius: 2 }),
    k.pos(0, 0),
    k.color(34, 197, 94)
  ]);

  return {
    setValue(timeLeft) {
      const ratio = Math.max(0, Math.min(1, timeLeft / maxTime));
      bar.width = width * ratio;

      if (ratio > 0.6) {
        bar.color = k.rgb(34, 197, 94); // Hijau
      } else if (ratio > 0.3) {
        bar.color = k.rgb(245, 158, 11); // Kuning
      } else {
        bar.color = k.rgb(239, 68, 68); // Merah
      }
    }
  };
}

/**
 * Menampilkan teks melayang dengan animasi naik dan fade out.
 */
export function floatingText(k, text, pos, color = k.rgb(34, 197, 94)) {
  const t = k.add([
    k.text(text, { size: 28, font: "monospace" }),
    k.pos(pos),
    k.anchor("center"),
    k.color(color),
    k.opacity(1),
    k.z(100)
  ]);

  k.tween(t.pos.y, t.pos.y - 60, 1, (val) => { t.pos.y = val; }, k.easings.easeOutQuad);
  k.tween(t.opacity, 0, 1, (val) => { t.opacity = val; }, k.easings.easeInQuad);
  k.wait(1.05, () => { t.destroy(); });
}

/**
 * Mengguncang layar.
 */
export function screenShake(k, intensity = 8) {
  if (k.shake) {
    k.shake(intensity);
  }
}

/**
 * Efek layar berkedip merah saat terkena serangan.
 */
export function damageFlash(k) {
  const flash = k.add([
    k.rect(800, 600),
    k.pos(0, 0),
    k.color(239, 68, 68),
    k.opacity(0.35),
    k.z(90),
    "damageFlash"
  ]);

  k.tween(
    flash.opacity,
    0,
    0.3,
    (val) => { flash.opacity = val; },
    k.easings.easeOutQuad
  );

  k.wait(0.35, () => {
    flash.destroy();
  });
}

/**
 * Membuat container panel bergaya retro sci-fi.
 */
export function retroPanel(k, pos, w, h) {
  return k.add([
    k.rect(w, h, { radius: 6 }),
    k.pos(pos),
    k.anchor("center"),
    k.color(10, 10, 26),
    k.opacity(0.85),
    k.outline(2, k.rgb(34, 197, 94)),
    k.z(50)
  ]);
}
