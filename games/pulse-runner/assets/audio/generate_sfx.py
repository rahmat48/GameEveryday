#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
generate_sfx.py - Pulse Runner (Gravity Tunnel Protocol)

Membangkitkan seluruh aset audio secara prosedural (100% sintesis, tanpa aset
pihak ketiga). Hanya memakai pustaka standar Python: wave, math, struct,
random.  Output: WAV 16-bit mono @ 44100 Hz di folder ini, lalu (opsional)
dikonversi ke MP3 memakai ffmpeg bila tersedia.

Nama file yang dihasilkan (9):
  flip, orb, fuel, powerup, nearmiss, gameover, click, bgm-menu, bgm-gameplay
"""

import math
import os
import random
import struct
import subprocess
import sys

SR = 44100
HERE = os.path.dirname(os.path.abspath(__file__))
MAX_I = 30000  # skala penuh saat menulis agar ada headroom


# ------------------------------------------------------------------ helpers
def clamp(x):
    return int(max(-32768, min(32767, x)))


def write_wav(path, samples):
    """samples: list float -1..1 -> 16-bit mono WAV."""
    with open(path, "wb") as f:
        n = len(samples)
        data_size = n * 2
        f.write(b"RIFF")
        f.write(struct.pack("<I", 36 + data_size))
        f.write(b"WAVEfmt ")
        # chunksize=16, audiofmt=1(PCM), channels=1, rate, byterate, blockalign, bits
        f.write(struct.pack("<IHHIIHH", 16, 1, 1, SR, SR * 2, 2, 16))
        f.write(b"data")
        f.write(struct.pack("<I", data_size))
        for s in samples:
            f.write(struct.pack("<h", clamp(s * MAX_I)))


def ns(dur):
    return int(SR * dur)


def square(t, f, duty=0.5):
    return 1.0 if (f * t) % 1.0 < duty else -1.0


def tri(t, f):
    return 2.0 * abs(2.0 * ((f * t) % 1.0) - 1.0) - 1.0


def sine(t, f):
    return math.sin(2.0 * math.pi * f * t)


def glide(t, f0, f1, dur):
    return f0 + (f1 - f0) * (t / dur if dur > 0 else 0.0)


def env_exp(x, k=6.0):
    return math.exp(-k * max(0.0, min(1.0, x)))


def env_ad(x, attack=0.02, release=0.15):
    x = max(0.0, min(1.0, x))
    if x < attack:
        return x / attack if attack > 0 else 1.0
    if x > 1.0 - release:
        return max(0.0, 1.0 - (x - (1.0 - release)) / release) if release > 0 else 0.0
    return 1.0


def note(f, dur, wave="square", amp=0.5, attack=0.005, release=None,
         glide_to=None, duty=0.5):
    release = release if release is not None else min(0.06, dur * 0.5)
    n = ns(dur)
    out = []
    for i in range(n):
        t = i / SR
        x = i / n
        ff = glide(t, f, glide_to, dur) if glide_to else f
        if wave == "square":
            v = square(t, ff, duty)
        elif wave == "tri":
            v = tri(t, ff)
        else:
            v = sine(t, ff)
        out.append(v * amp * env_ad(x, attack / dur if dur else 0.01,
                                   release / dur if dur else 0.01))
    return out


def silence(dur):
    return [0.0] * ns(dur)


def normalize(buf, target):
    peak = max((abs(s) for s in buf), default=1e-9) or 1e-9
    g = target / peak
    return [s * g for s in buf]


def fade_edges(buf, fade=0.004):
    n = min(len(buf) // 2, ns(fade))
    for i in range(n):
        g = i / n
        buf[i] *= g
        buf[len(buf) - 1 - i] *= g
    return buf


N = {
    "A3": 220.00, "C4": 261.63, "D4": 293.66, "E4": 329.63, "F4": 349.23,
    "G4": 392.00, "A4": 440.00, "B4": 493.88, "C5": 523.25, "D5": 587.33,
    "E5": 659.25, "G5": 783.99, "A5": 880.00, "C6": 1046.50,
    "E6": 1318.51, "B6": 1975.50,
}


# =============================================================== SFX
def sfx_flip():
    n = ns(0.12)
    out = []
    for i in range(n):
        t = i / SR
        f = glide(t, 300, 950, 0.12)
        out.append(square(t, f, 0.5) * 0.55 * env_exp(i / n, 3.0))
    return out


def sfx_orb():
    body = note(N["E6"], 0.055, "tri", 0.55)
    body += note(N["B6"], 0.09, "tri", 0.60)
    echo = [s * 0.32 for s in body[ns(0.05):]]
    return normalize(fade_edges(body + silence(0.02) + echo), 0.6)


def sfx_fuel():
    n = ns(0.26)
    out = []
    for i in range(n):
        t = i / SR
        x = i / n
        f = glide(t, 150, 420, 0.26)
        trem = 0.7 + 0.3 * sine(t, 26)
        out.append(square(t, f, 0.4) * 0.55 * trem * env_ad(x, 0.05, 0.35))
    return out


def sfx_powerup():
    out = []
    for name in ["C5", "E5", "G5", "C6"]:
        out += note(N[name], 0.085, "square", 0.55)
    out += note(N["C6"] * 1.5, 0.16, "tri", 0.5)
    return normalize(out, 0.7)


def sfx_nearmiss():
    n = ns(0.16)
    out = []
    lp = 0.0
    for i in range(n):
        x = i / n
        raw = random.uniform(-1.0, 1.0)
        lp += (raw - lp) * (0.06 + 0.5 * x)
        out.append(lp * 0.8 * env_exp(x, 5.0))
    return normalize(out, 0.55)


def sfx_gameover():
    out = []
    seq = [("A4", 0.16), ("F4", 0.16), ("D4", 0.16), ("A3", 0.32)]
    for i, (name, dur) in enumerate(seq):
        out += note(N[name], dur, "square", 0.58, release=dur * 0.6)
    return normalize(out, 0.7)


def sfx_click():
    return normalize(note(N["A5"], 0.05, "square", 0.5, 0.001, 0.04), 0.4)


# =============================================================== BGM
def bgm_menu():
    """Ambient chill, 90 BPM, 16 bar -> loop mulus."""
    bpm = 90.0
    bar = 4 * 60.0 / bpm
    bars = 16
    total = bar * bars
    n = ns(total)
    roots = [N["A3"] * 0.5, N["F4"] * 0.5, N["C4"] * 0.5, N["G4"] * 0.5]
    arp = [
        ["A4", "C5", "E5", "C5"],
        ["F4", "A4", "C5", "A4"],
        ["C5", "E5", "G5", "E5"],
        ["G4", "B4", "D5", "B4"],
    ]
    step = bar / 4.0
    out = [0.0] * n
    for i in range(n):
        t = i / SR
        b = int(t / bar) % bars
        ch = b % 4
        pos = t % bar
        s_i = int(pos / step) % 4
        local = pos - s_i * step
        f = N[arp[ch][s_i]]
        v = tri(local, f) * 0.20 * env_ad(local / step, 0.10, 0.40)
        v += sine(local, f * 2) * 0.07 * env_ad(local / step, 0.12, 0.5)
        v += square(pos, roots[ch], 0.5) * 0.16
        out[i] = v
    return normalize(out, 0.30)


def bgm_gameplay():
    """Chiptune driving, 140 BPM, 32 bar -> loop mulus."""
    random.seed(7)
    bpm = 140.0
    bar = 4 * 60.0 / bpm
    bars = 32
    total = bar * bars
    n = ns(total)
    sixteenth = bar / 16.0
    eighth = bar / 8.0
    riff = {
        0: ["A4", None, "A4", "C5", None, "A4", None, "E5",
            "D5", None, "C5", None, "A4", None, "E5", None],
        1: ["F4", None, "F4", "A4", None, "F4", None, "C5",
            "A4", None, "F4", None, "C5", None, "A4", None],
        2: ["C5", None, "C5", "E5", None, "C5", None, "G5",
            "E5", None, "C5", None, "G4", None, "E5", None],
        3: ["G4", None, "B4", "D5", None, "G4", None, "D5",
            "B4", None, "G4", None, "D5", None, "B4", None],
    }
    roots = [N["A3"], N["F4"] * 0.5, N["C4"], N["G4"] * 0.5]

    def kick(pos):
        d = 0.12
        if pos > d:
            return 0.0
        return sine(pos, glide(pos, 120, 45, d)) * env_exp(pos / d, 5.0) * 0.9

    def hat(pos, quarter):
        q4 = bar / 4.0
        local = pos % q4
        if int(pos / q4) % 2 != 1 or local > 0.04:
            return 0.0
        return random.uniform(-1, 1) * env_exp(local / 0.04, 9.0) * 0.25

    out = [0.0] * n
    for i in range(n):
        t = i / SR
        b = int(t / bar) % bars
        ch = b % 4
        pos = t % bar
        s_i = int(pos / sixteenth) % 16
        local = pos - s_i * sixteenth
        v = 0.0
        name = riff[ch][s_i]
        if name:
            v += square(local, N[name], 0.5) * 0.30 * env_ad(local / sixteenth, 0.05, 0.35)
        e_i = int(pos / eighth) % 8
        e_local = pos - e_i * eighth
        bf = roots[ch] * (1.0 if e_i % 2 == 0 else 1.5)
        if e_local < eighth * 0.9:
            v += square(e_local, bf, 0.3) * 0.30 * env_ad(e_local / eighth, 0.03, 0.2)
        v += kick(pos)
        v += hat(pos, ch)
        out[i] = v
    return normalize(out, 0.34)


# =============================================================== main
SFX = {
    "flip": sfx_flip,
    "orb": sfx_orb,
    "fuel": sfx_fuel,
    "powerup": sfx_powerup,
    "nearmiss": sfx_nearmiss,
    "gameover": sfx_gameover,
    "click": sfx_click,
    "bgm-menu": bgm_menu,
    "bgm-gameplay": bgm_gameplay,
}


def find_ffmpeg():
    for c in ["ffmpeg", "ffmpeg.exe"]:
        try:
            subprocess.run([c, "-version"], capture_output=True, check=True)
            return c
        except Exception:
            pass
    base = os.path.expandvars(r"%LOCALAPPDATA%\Microsoft\WinGet\Packages")
    if os.path.isdir(base):
        for d in os.listdir(base):
            if "FFmpeg" in d or "ffmpeg" in d.lower():
                exe = os.path.join(base, d, "bin", "ffmpeg.exe")
                if os.path.isfile(exe):
                    return exe
    return None


def main():
    print("Menbangkitkan WAV prosedural...")
    wav_files = []
    for name, fn in SFX.items():
        path = os.path.join(HERE, name + ".wav")
        write_wav(path, fn())
        kb = os.path.getsize(path) / 1024
        wav_files.append(path)
        print(f"  {name}.wav  ({kb:.0f} KB)")

    ff = find_ffmpeg()
    if not ff:
        print("ffmpeg tidak ditemukan -> hanya WAV. Jalankan manual: ffmpeg -i in.wav -b:a 128k out.mp3")
        return
    print(f"\nMengonversi ke MP3 via {ff} ...")
    for path in wav_files:
        name = os.path.splitext(os.path.basename(path))[0]
        mp3 = os.path.join(HERE, name + ".mp3")
        bitrate = "128k" if name.startswith("bgm") else "96k"
        subprocess.run([ff, "-y", "-loglevel", "error", "-i", path,
                        "-codec:a", "libmp3lame", "-b:a", bitrate, mp3], check=True)
        os.remove(path)
        print(f"  {name}.mp3  ({os.path.getsize(mp3)/1024:.0f} KB)")
    print("\nSelesai.")


if __name__ == "__main__":
    main()
