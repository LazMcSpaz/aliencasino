"""Builds gravity_table.html (the Gravity Well table concept viewer) from gravity_viewer.src.html + gravity_model.js + the bowl art.
Run from model3d/: node capture_gravity.js (refreshes the bowl art), then python3 build_gravity3d.py"""
import base64, json
d = lambda f: "data:image/webp;base64," + base64.b64encode(open(f, "rb").read()).decode()
tex = {"bowl": d("cap/gw_bowl.webp"), "face": d("cap/tex_face_happy.webp"), "launcher": d("../gravity/art/launcher.webp")}   # face = the slot machines' face; launcher = the game's sprite
s = open("gravity_viewer.src.html").read().replace("/* {{MODEL}} */", open("gravity_model.js").read()).replace("/* {{TEX}} */", json.dumps(tex))
open("gravity_table.html", "w").write(s); print("gravity_table.html", len(s) // 1024, "KB")
