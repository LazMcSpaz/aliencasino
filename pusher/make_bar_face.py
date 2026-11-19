#!/usr/bin/env python3
"""Makes art/bar_face.webp: the casino's gold bar picture (slot/icons3/bar1.a.webp), straightened from its tilted view into a flat
top-down plaque, to go on the top of every bar in Star Dozer. Run from pusher/: python3 make_bar_face.py"""
import numpy as np, pathlib
from PIL import Image, ImageEnhance
here = pathlib.Path(__file__).parent
im = Image.open(here / "../slot/icons3/bar1.a.webp").convert("RGBA")
# the corners of the plaque's top face in the 200 x 200 picture: top-left, top-right, bottom-right, bottom-left
SRC = [(9.5, 54.5), (174.0, 35.0), (195.0, 133.5), (21.5, 151.5)]
W, H = 500, 300                                   # same shape as a bar's top (1.67 : 1)
A, B = [], []
for (x, y), (u, v) in zip([(0, 0), (W, 0), (W, H), (0, H)], SRC):
    A += [[x, y, 1, 0, 0, 0, -u * x, -u * y], [0, 0, 0, x, y, 1, -v * x, -v * y]]; B += [u, v]
flat = im.transform((W, H), Image.PERSPECTIVE, np.linalg.solve(np.array(A, float), np.array(B, float)).tolist(), Image.BICUBIC)
bg = Image.new("RGBA", (W, H), (168, 98, 10, 255)); bg.alpha_composite(flat)   # any gaps at the corners: deep gold
out = ImageEnhance.Brightness(ImageEnhance.Color(bg.convert("RGB")).enhance(.95)).enhance(.97)   # slightly deeper; the 3D lighting adds warmth of its own
out.save(here / "art/bar_face.webp", quality=88); print("art/bar_face.webp", out.size)
