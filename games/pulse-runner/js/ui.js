/**
 * ui.js
 * Komponen UI retro Kaplay untuk Pulse Runner (Gravity Tunnel Protocol).
 */

export function getGameThemeColors(k) {
  const t = localStorage.getItem("hub_selected_theme") || "green";
  if (t === "purple") {
    return {
      primary: k.rgb(168, 85, 247),
      secondary: k.rgb(217, 70, 239),
      border: k.rgb(217, 70, 239),
      cyan: k.rgb(192, 132, 252)
    };
  } else if (t === "light") {
    return {
      primary: k.rgb(2, 132, 199),
      secondary: k.rgb(56, 189, 248),
      border: k.rgb(2, 132, 199),
      cyan: k.rgb(14, 165, 233)
    };
  } else {
    // Default: Cyber Matrix Green
    return {
      primary: k.rgb(34, 197, 94),
      secondary: k.rgb(74, 222, 128),
      border: k.rgb(34, 197, 94),
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
    k.outline(2, theme.border),
    k.area(),
    k.scale(1),
    k.z(50),
    "btn"
  ]);

  btn.add([
    k.text(text, { size: 18, font: "monospace" }),
    k.pos(0, 0),
    k.anchor("center"),
    k.color(theme.primary)
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
 * Bar resource horizontal (dipakai untuk FUEL).
 */
export function makeBar(k, pos, maxValue = 100, width = 180, height = 16, label = "") {
  const bg = k.add([
    k.rect(width + 4, height + 4, { radius: 4 }),
    k.pos(pos),
    k.color(10, 10, 26),
    k.outline(2, k.rgb(34, 197, 94)),
    k.z(40)
  ]);

  const fill = bg.add([
    k.rect(width, height, { radius: 2 }),
    k.pos(2, 2),
    k.color(34, 197, 94)
  ]);

  let lbl = null;
  if (label) {
    lbl = bg.add([
      k.text(label, { size: 11, font: "monospace" }),
      k.pos(4, -16),
      k.color(148, 163, 184)
    ]);
  }

  return {
    setValue(cur) {
      const pct = Math.max(0, Math.min(1, cur / maxValue));
      fill.width = width * pct;
      if (pct > 0.5) {
        fill.color = k.rgb(34, 197, 94);
      } else if (pct > 0.25) {
        fill.color = k.rgb(245, 158, 11);
      } else {
        fill.color = k.rgb(239, 68, 68);
      }
    },
    destroy() {
      bg.destroy();
    }
  };
}

export function floatingText(k, text, pos, color = k.rgb(34, 197, 94)) {
  const t = k.add([
    k.text(text, { size: 20, font: "monospace" }),
    k.pos(pos),
    k.anchor("center"),
    k.color(color),
    k.opacity(1),
    k.z(100)
  ]);

  k.tween(t.pos.y, t.pos.y - 35, 0.7, (val) => { t.pos.y = val; }, k.easings.easeOutQuad);
  k.tween(t.opacity, 0, 0.7, (val) => { t.opacity = val; }, k.easings.easeInQuad);

  k.wait(0.75, () => {
    t.destroy();
  });
}

export function screenShake(k, intensity = 8) {
  const baseCam = k.vec2(400, 300);
  let remaining = intensity;
  const shakeLoop = k.onUpdate(() => {
    if (remaining <= 0) {
      if (k.setCamPos) k.setCamPos(baseCam);
      else k.camPos(baseCam);
      shakeLoop.cancel();
      return;
    }
    const ox = (Math.random() - 0.5) * remaining * 2;
    const oy = (Math.random() - 0.5) * remaining * 2;
    if (k.setCamPos) k.setCamPos(k.vec2(baseCam.x + ox, baseCam.y + oy));
    else k.camPos(k.vec2(baseCam.x + ox, baseCam.y + oy));
    remaining -= k.dt() * 25;
  });
}

export function flashScreen(k, color = k.rgb(239, 68, 68), duration = 0.2) {
  const fl = k.add([
    k.rect(800, 600),
    k.pos(0, 0),
    k.color(color),
    k.opacity(0.4),
    k.z(120)
  ]);

  k.tween(fl.opacity, 0, duration, (val) => { fl.opacity = val; }, k.easings.easeInQuad);
  k.wait(duration + 0.05, () => {
    fl.destroy();
  });
}

export function retroPanel(k, pos, width, height, title) {
  const panel = k.add([
    k.rect(width, height, { radius: 8 }),
    k.pos(pos),
    k.anchor("center"),
    k.color(10, 10, 26),
    k.outline(2, k.rgb(34, 197, 94)),
    k.z(80)
  ]);

  if (title) {
    panel.add([
      k.text(title, { size: 20, font: "monospace" }),
      k.pos(0, -height / 2 + 25),
      k.anchor("center"),
      k.color(245, 158, 11)
    ]);
  }

  return panel;
}
