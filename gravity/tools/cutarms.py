"""Cuts the other players' arms out of their backgrounds. Run from gravity/: python3 tools/cutarms.py
Writes art/arms/<name>.webp (420 px tall)."""
from PIL import Image; import numpy as np
from scipy import ndimage as nd
A = "/mnt/user-data/attachments/ec4c4efc-38ac-5fe2-a0fc-cbb2a3d619e4/"
SRC = {"tentacle_purple": ("6192584b-image.png", "white"), "tentacle_orange": ("62d8b6c6-image.png", "black"),
       "hand_pinch": ("bea321ae-image.png", "black"), "hand_closed": ("c196775a-image.png", "black")}
for name, (f, bg) in SRC.items():
    src = Image.open(A + f).convert("RGBA"); a = np.array(src.convert("RGB")).astype(int); own = np.array(src)[:, :, 3] / 255
    if own[0, 0] < .1 and own[-1, -1] < .1: alpha = own                      # already transparent: keep its own cut-out
    else:
        m = (a.min(2) > 232) if bg == "white" else (a.max(2) < 34)
        lab, n = nd.label(m); edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
        sizes = nd.sum(m, lab, range(1, n + 1)); holes = {i + 1 for i, z in enumerate(sizes) if z > 2000}   # big enclosed gaps (between pinching fingers)
        alpha = nd.gaussian_filter((~np.isin(lab, list(edge | holes))).astype(float), .8)
    ys, xs = np.nonzero(alpha > .5); box = (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)
    im = Image.fromarray(np.dstack([a, alpha * 255]).astype(np.uint8)).crop(box)
    W, H = im.size; im = im.resize((round(W * 420 / H), 420), Image.LANCZOS); im.save(f"art/arms/{name}.webp", quality=86)
    print(name, Image.open(A + f).size, "box", box, "->", im.size)
