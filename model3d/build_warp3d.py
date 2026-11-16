"""Builds warp_stage.html (the Warp Drive stage concept viewer) from warp_viewer.src.html + warp_model.js + frames captured from the game.
Run from model3d/: node capture_warp.js (refreshes the frames), then python3 build_warp3d.py"""
import base64, json
d = lambda f: "data:image/webp;base64," + base64.b64encode(open(f, "rb").read()).decode()
tex = {k: d(f"cap/warp_{k}.webp") for k in ["pad", "clouds", "orbit", "nebula", "boom"]}
s = open("warp_viewer.src.html").read().replace("/* {{MODEL}} */", open("warp_model.js").read()).replace("/* {{TEX}} */", json.dumps(tex))
open("warp_stage.html", "w").write(s); print("warp_stage.html", len(s) // 1024, "KB")
