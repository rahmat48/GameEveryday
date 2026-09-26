"""Generate thumb.png (640x360) for the Pulse Runner game card.

Programmatic neon scene: dark navy starfield, glowing cyan tunnel
floor/ceiling bars, a cyan ship with an orange flame near the floor, an
upside-down faded "ghost" ship near the ceiling (the gravity flip), dark
slate obstacles, amber glowing orbs, speed streaks, and title text.

No downloaded assets are used -- everything is drawn in code.

Run:  python generate_thumb.py
"""

import os
import random

from PIL import Image, ImageDraw, ImageFont

W, H = 640, 360
BG = (10, 10, 26)           # #0a0a1a dark navy
CYAN = (0, 229, 255)
AMBER = (255, 176, 32)
SLATE = (30, 41, 59)
WHITE = (255, 255, 255)

FLOOR_Y = 300               # top edge of floor bar
CEIL_Y = 60                 # bottom edge of ceiling bar
BAR_H = 8

random.seed(7)

img = Image.new("RGB", (W, H), BG)
layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))   # translucent glow layer
d = ImageDraw.Draw(img)
ld = ImageDraw.Draw(layer)

# ---------------------------------------------------------------- stars
for _ in range(90):
    x = random.randint(0, W - 1)
    y = random.randint(0, H - 1)
    a = random.randint(30, 130)
    r = random.choice([1, 1, 1, 2])
    ld.ellipse([x - r, y - r, x + r, y + r], fill=(200, 220, 255, a))


# ------------------------------------------------- neon bar (with glow)
def neon_bar(y_top, thick=BAR_H, color=CYAN, intensity=255):
    """Horizontal neon bar at y_top with widening translucent glow halos."""
    for grow, alpha in [(10, 36), (6, 70), (3, 120)]:
        ld.rectangle([0, y_top - grow, W, y_top + thick + grow],
                     fill=color + (int(alpha * intensity / 255),))
    ld.rectangle([0, y_top, W, y_top + thick], fill=color + (intensity,))


neon_bar(FLOOR_Y)              # tunnel floor
neon_bar(CEIL_Y - BAR_H)       # tunnel ceiling

# thin accent lines just inside the tunnel for depth
ld.line([(0, FLOOR_Y + 16), (W, FLOOR_Y + 16)], fill=CYAN + (40,), width=1)
ld.line([(0, CEIL_Y - 16), (W, CEIL_Y - 16)], fill=CYAN + (40,), width=1)


# ------------------------------------------------------------ obstacles
def obstacle(x, w, height, on_floor=True):
    """Dark slate rect with a thin glowing edge on floor or ceiling."""
    if on_floor:
        top = FLOOR_Y - height
        d.rectangle([x, top, x + w, FLOOR_Y], fill=SLATE,
                    outline=(71, 85, 105), width=1)
        ld.line([(x, FLOOR_Y - 1), (x + w, FLOOR_Y - 1)],
                fill=CYAN + (200,), width=2)
    else:
        bot = CEIL_Y + height
        d.rectangle([x, CEIL_Y, x + w, bot], fill=SLATE,
                    outline=(71, 85, 105), width=1)
        ld.line([(x, CEIL_Y), (x + w, CEIL_Y)], fill=CYAN + (200,), width=2)


obstacle(360, 26, 52, on_floor=True)
obstacle(470, 30, 74, on_floor=True)
obstacle(415, 26, 58, on_floor=False)
obstacle(530, 30, 44, on_floor=False)


# ------------------------------------------------------------ amber orbs
def orb(cx, cy, r):
    for mult, ga in [(3.0, 28), (1.9, 70), (1.3, 130)]:
        gr = r * mult
        ld.ellipse([cx - gr, cy - gr, cx + gr, cy + gr], fill=AMBER + (ga,))
    ld.ellipse([cx - r, cy - r, cx + r, cy + r], fill=AMBER + (255,))
    hr = max(1, r // 3)
    ld.ellipse([cx - hr, cy - hr, cx + hr, cy + hr], fill=(255, 235, 200, 255))


orb(300, 195, 6)
orb(390, 140, 5)
orb(505, 215, 7)
orb(580, 165, 5)


# ---------------------------------------------------------------- ship
def ship(cx, cy, alpha=255, flipped=False):
    """36x18 rounded cyan hull, white nose block at right, cockpit stripe."""
    w, h = 36, 18
    x0, y0 = cx - w // 2, cy - h // 2
    x1, y1 = x0 + w, y0 + h
    if flipped:                              # mirror about the center line
        y0, y1 = 2 * cy - y1, 2 * cy - y0
    a = alpha
    ld.rounded_rectangle([x0 - 3, y0 - 3, x1 + 3, y1 + 3], radius=9,
                         fill=CYAN + (int(50 * a / 255),))
    ld.rounded_rectangle([x0, y0, x1, y1], radius=6, fill=CYAN + (a,))
    nw = 8                                   # white nose
    ld.rectangle([x1 - nw, y0 + 3, x1 - 1, y1 - 3], fill=WHITE + (a,))
    ld.rectangle([x0 + 6, cy - 1, x1 - nw - 2, cy + 1],
                 fill=(0, 120, 150, a))      # cockpit stripe


def flame(tip_x, cy, length, alpha=255, flipped=False):
    """Orange flame trail extending left from tip_x behind the ship."""
    for i, (seg, col, aa, half) in enumerate([
        (length, (255, 120, 20), 200, 7),
        (int(length * 0.65), (255, 170, 40), 230, 5),
        (int(length * 0.35), (255, 220, 120), 255, 3),
    ]):
        pts = [(tip_x, cy - half), (tip_x, cy + half), (tip_x - seg, cy)]
        if flipped:
            pts = [(px, 2 * cy - py) for px, py in pts]
        ld.polygon(pts, fill=col + (int(aa * alpha / 255),))


# main ship hugging the floor, flame trailing behind
flame(180 - 18, 281, 46)
ship(180, 281)

# faded upside-down ghost ship near the ceiling (the gravity flip)
ship(250, 79, alpha=90, flipped=True)
flame(250 + 18, 79, 34, alpha=70, flipped=False)


# -------------------------------------------------------- speed streaks
for _ in range(16):
    y = random.randint(CEIL_Y + 8, FLOOR_Y - 8)
    x = random.randint(20, W - 120)
    ln = random.randint(25, 70)
    ld.line([(x, y), (x + ln, y)], fill=WHITE + (random.randint(35, 90),), width=1)


# ---------------------------------------------------------------- text
def load_font(size):
    for path in (r"C:\Windows\Fonts\arialbd.ttf",
                 r"C:\Windows\Fonts\segoeuib.ttf",
                 r"C:\Windows\Fonts\arial.ttf"):
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except OSError:
                continue
    return ImageFont.load_default(size)


title_font = load_font(44)
sub_font = load_font(16)
title = "PULSE RUNNER"
subtitle = "GRAVITY TUNNEL PROTOCOL"

tb = d.textbbox((0, 0), title, font=title_font)
tw, th = tb[2] - tb[0], tb[3] - tb[1]
title_cx, title_cy = W // 2, 34
tx, ty = title_cx - tw // 2, title_cy - th // 2

# glow halo behind the title
for grow, ga in [(16, 24), (9, 46)]:
    ld.rounded_rectangle([tx - grow, ty - grow, tx + tw + grow, ty + th + grow],
                         radius=20, fill=CYAN + (ga,))

# title with dark shadow, centered near the top
ld.text((tx + 3, ty + 3), title, font=title_font, fill=(0, 0, 0, 200))
ld.text((tx, ty), title, font=title_font, fill=CYAN + (255,))

# amber subtitle centred just below the title
sb = d.textbbox((0, 0), subtitle, font=sub_font)
sw = sb[2] - sb[0]
sx, sy = W // 2 - sw // 2, title_cy + th // 2 + 12
ld.text((sx + 2, sy + 2), subtitle, font=sub_font, fill=(0, 0, 0, 180))
ld.text((sx, sy), subtitle, font=sub_font, fill=AMBER + (255,))


# ---------------------------------------------------------------- merge
out = Image.alpha_composite(img.convert("RGBA"), layer).convert("RGB")

out_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "thumb.png")
out.save(out_path, "PNG", optimize=True)
print("saved", out_path, out.size)
