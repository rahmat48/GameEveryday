/**
 * ui.js
 * Komponen UI retro Kaplay untuk Snake Arcade (Data Worm).
 */

export function getGameThemeColors(k) {
  const t = localStorage.getItem("hub_selected_theme") || "green";
  if (t === "purple") {
    return {
      primary: k.rgb(168, 85, 247),
      secondary: k.rgb(217, 70, 239),
      border: k.rgb(217, 70, 239)
    };
  } else if (t === "light") {
    return {
      primary: k.rgb(2, 132, 199),
      secondary: k.rgb(56, 189, 248),
      border: k.rgb(2, 132, 199)
    };
  } else {
    // Default: Cyber Green
    return {
      primary: k.rgb(34, 197, 94),
      secondary: k.rgb(74, 222, 128),
      border: k.rgb(34, 197, 94)
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

export function makeScoreBoard(k, pos, label, value) {
  const container = k.add([
    k.pos(pos),
    k.z(50)
  ]);

  const lbl = container.add([
    k.text(`${label}: ${value}`, { size: 20, font: "monospace" }),
    k.color(34, 197, 94)
  ]);

  return {
    update(newVal) {
      lbl.text = `${label}: ${newVal}`;
    }
  };
}

export function floatingText(k, text, pos, color = k.rgb(34, 197, 94)) {
  const t = k.add([
    k.text(text, { size: 24, font: "monospace" }),
    k.pos(pos),
    k.anchor("center"),
    k.color(color),
    k.opacity(1),
    k.z(100)
  ]);

  k.tween(t.pos.y, t.pos.y - 45, 0.8, (val) => { t.pos.y = val; }, k.easings.easeOutQuad);
  k.tween(t.opacity, 0, 0.8, (val) => { t.opacity = val; }, k.easings.easeInQuad);
  k.wait(0.85, () => { t.destroy(); });
}

export function screenShake(k, intensity = 8) {
  if (k.shake) {
    k.shake(intensity);
  }
}

export function retroPanel(k, pos, w, h) {
  return k.add([
    k.rect(w, h, { radius: 8 }),
    k.pos(pos),
    k.anchor("center"),
    k.color(10, 10, 26),
    k.opacity(0.92),
    k.outline(2, k.rgb(34, 197, 94)),
    k.z(80)
  ]);
}
