/**
 * ui.js
 * Komponen antarmuka retro CRT untuk Pacman Arcade.
 */

export function getGameThemeColors(k) {
  const t = localStorage.getItem("hub_selected_theme") || "green";
  if (t === "purple") {
    return {
      primary: k.rgb(217, 70, 239),
      secondary: k.rgb(168, 85, 247),
      border: k.rgb(217, 70, 239),
      yellow: k.rgb(250, 204, 21),
      cyan: k.rgb(192, 132, 252)
    };
  } else if (t === "light") {
    return {
      primary: k.rgb(2, 132, 199),
      secondary: k.rgb(56, 189, 248),
      border: k.rgb(2, 132, 199),
      yellow: k.rgb(234, 179, 8),
      cyan: k.rgb(14, 165, 233)
    };
  } else {
    // Default: Cyber Green / Classic Neon
    return {
      primary: k.rgb(34, 197, 94),
      secondary: k.rgb(74, 222, 128),
      border: k.rgb(37, 99, 235),
      yellow: k.rgb(250, 204, 21),
      cyan: k.rgb(0, 212, 255)
    };
  }
}

export function makeButton(k, text, pos, onClick, width = 220, height = 48) {
  const theme = getGameThemeColors(k);
  const btn = k.add([
    k.rect(width, height, { radius: 6 }),
    k.pos(pos),
    k.anchor("center"),
    k.color(15, 23, 42),
    k.outline(2, theme.yellow),
    k.area(),
    k.scale(1),
    k.z(50),
    "btn"
  ]);

  btn.add([
    k.text(text, { size: 16, font: "monospace" }),
    k.pos(0, 0),
    k.anchor("center"),
    k.color(theme.yellow)
  ]);

  btn.onHoverUpdate(() => {
    btn.scale = k.vec2(1.05);
    btn.color = k.rgb(30, 41, 59);
  });
  btn.onHoverEnd(() => {
    btn.scale = k.vec2(1);
    btn.color = k.rgb(15, 23, 42);
  });
  btn.onClick(() => {
    if (onClick) onClick();
  });

  return btn;
}

/**
 * Membuat panel retro dengan border berpendar.
 */
export function retroPanel(k, { pos, width, height, borderColor, bgColor = k.rgb(10, 10, 26), z = 0 }) {
  const panel = k.add([
    k.rect(width, height, { radius: 4 }),
    k.pos(pos),
    k.color(bgColor),
    k.outline(2, borderColor || k.rgb(37, 99, 235)),
    k.z(z)
  ]);
  return panel;
}

/**
 * Efek teks melayang (poin hantu / buah / level up).
 */
export function floatingText(k, text, position, color = k.rgb(250, 204, 21), size = 14) {
  const label = k.add([
    k.text(String(text), { size, font: "monospace" }),
    k.pos(position),
    k.anchor("center"),
    k.color(color),
    k.z(100),
    k.opacity(1)
  ]);

  let elapsed = 0;
  label.onUpdate(() => {
    elapsed += k.dt();
    label.pos.y -= 35 * k.dt();
    label.opacity = Math.max(0, 1 - (elapsed / 0.8));
    if (elapsed >= 0.8) {
      k.destroy(label);
    }
  });

  return label;
}

/**
 * Efek guncangan layar saat Pacman tertangkap atau ledakan skor.
 */
export function screenShake(k, intensity = 6, duration = 0.3) {
  if (typeof k.shake === "function") {
    k.shake(intensity);
    return;
  }
}

/**
 * Efek kilatan layar saat memakan energizer / stage clear.
 */
export function flashScreen(k, color = k.rgb(255, 255, 255), duration = 0.25) {
  const flash = k.add([
    k.rect(800, 600),
    k.pos(0, 0),
    k.color(color),
    k.opacity(0.35),
    k.z(200)
  ]);

  let elapsed = 0;
  flash.onUpdate(() => {
    elapsed += k.dt();
    flash.opacity = Math.max(0, 0.35 * (1 - (elapsed / duration)));
    if (elapsed >= duration) {
      k.destroy(flash);
    }
  });
}

/**
 * Partikel letupan saat memakan energizer atau hantu.
 */
export function burstParticles(k, pos, color = k.rgb(250, 204, 21), count = 12) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count;
    const speed = k.rand(50, 140);
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    const p = k.add([
      k.rect(3, 3),
      k.pos(pos.clone()),
      k.color(color),
      k.opacity(1),
      k.z(90)
    ]);

    let age = 0;
    p.onUpdate(() => {
      age += k.dt();
      p.pos.x += vx * k.dt();
      p.pos.y += vy * k.dt();
      p.opacity = Math.max(0, 1 - (age / 0.4));
      if (age >= 0.4) {
        k.destroy(p);
      }
    });
  }
}
