"""Builds twin_moons_table.html (the Twin Moons craps table concept viewer) from moons_viewer.src.html + moons_model.js + the slot machines' face.
Run from model3d/: python3 build_moons3d.py"""
import base64, json
d = lambda f: "data:image/webp;base64," + base64.b64encode(open(f, "rb").read()).decode()
tex = {"face": d("cap/tex_face_happy.webp")}
s = open("moons_viewer.src.html").read().replace("/* {{MODEL}} */", open("moons_model.js").read()).replace("/* {{TEX}} */", json.dumps(tex))
open("twin_moons_table.html", "w").write(s); print("twin_moons_table.html", len(s) // 1024, "KB")
