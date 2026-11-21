#!/usr/bin/env python3
"""Packs the frames from tools/attract.js into one sprite sheet per game (8x8 frames, row by row) for the wall screens.
Usage (from lobby/): python3 tools/attract_pack.py <frames dir>   -> assets/attract_<game>.webp + assets/attract.json"""
import sys, json, pathlib
from PIL import Image
FR = pathlib.Path(sys.argv[1]); OUT = pathlib.Path(__file__).parent.parent / "assets"; N, COLS = 64, 8
# the part of the 390x844 phone screen worth showing (x, y, w, h) and the frame width it's shrunk to
CROP = {"slot": ([0, 300, 390, 270], 176), "pyramid": ([20, 160, 350, 460], 150), "asteroid": ([10, 190, 370, 385], 168), "gravity": ([10, 205, 370, 400], 168),
        "moons": ([0, 190, 390, 300], 176), "warp": ([0, 40, 255, 620], 120), "wheel": ([0, 110, 390, 390], 176)}
meta = {}
for g, ((x, y, w, h), fw) in CROP.items():
    fh = round(fw * h / w); rows = N // COLS; sheet = Image.new("RGB", (fw * COLS, fh * rows))
    for i in range(N):
        im = Image.open(FR / f"{g}_{i:02d}.png").convert("RGB").crop((x, y, x + w, y + h)).resize((fw, fh), Image.LANCZOS)
        sheet.paste(im, ((i % COLS) * fw, (i // COLS) * fh))
    p = OUT / f"attract_{g}.webp"; sheet.save(p, "WEBP", quality=74, method=6)
    meta[g] = {"cols": COLS, "rows": rows, "n": N, "aspect": round(w / h, 4)}; print(g, sheet.size, p.stat().st_size // 1024, "KB")
(OUT / "attract.json").write_text(json.dumps(meta, indent=1))
