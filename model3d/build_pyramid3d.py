"""Builds pyramid_bot.html (the Pyramid Scheme robot viewer) from pyramid_viewer.src.html + pyramid_model.js + the captured screen.
Run from model3d/: node capture_pyramid.js (refreshes the screen picture), then python3 build_pyramid3d.py"""
import base64, json
tex = {"screen": "data:image/webp;base64," + base64.b64encode(open("cap/pyr_screen.webp", "rb").read()).decode(),
       "rects": json.load(open("cap/pyr_rects.json"))}
s = open("pyramid_viewer.src.html").read().replace("/* {{MODEL}} */", open("pyramid_model.js").read()).replace("/* {{TEX}} */", json.dumps(tex))
open("pyramid_bot.html", "w").write(s); print("pyramid_bot.html", len(s) // 1024, "KB")
