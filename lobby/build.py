#!/usr/bin/env python3
"""Builds lobby.html (the 3D casino floor) from lobby.src.html + every model in ../model3d + their textures,
and copies the built games into games/ (published next to the page; the lobby opens them in place).
Run from lobby/: python3 build.py   (build each game first: its own build.py)"""
import base64, json, pathlib, shutil
here = pathlib.Path(__file__).parent; M = here / "../model3d"; C = M / "cap"
d = lambda p: "data:image/webp;base64," + base64.b64encode(pathlib.Path(p).read_bytes()).decode()
tex = {
  "slot": {"hud": d(C/"tex_hud.webp"), "glass": d(C/"tex_glass.webp"), "controls": d(C/"tex_controls.webp"), "faces": {m: d(C/f"tex_face_{m}.webp") for m in ["happy", "giddy", "grumpy", "sleepy", "mischievous"]}},
  "pyramid": {"screen": d(C/"pyr_screen.webp"), "rects": json.load(open(C/"pyr_rects.json"))},
  "asteroid": {"screen": d(C/"ast_screen.webp"), "rects": json.load(open(C/"ast_rects.json"))},
  "gravity": {"bowl": d(C/"gw_bowl.webp"), "face": d(C/"tex_face_happy.webp"), "launcher": d(here/"../gravity/art/launcher.webp")},
  "moons": {"face": d(C/"tex_face_happy.webp")},
  "warp": {k: d(C/f"warp_{k}.webp") for k in ["pad", "clouds", "orbit", "nebula", "boom"]},
}
models = "\n".join((M/f).read_text() for f in ["model.js", "pyramid_model.js", "gravity_model.js", "moons_model.js", "warp_model.js"])
art = {"bar": d(here/"../slot/icons3/bar1.a.webp")}
s = (here/"lobby.src.html").read_text().replace("/*{{ART}}*/", json.dumps(art)).replace("/*{{MODELS}}*/", models + "\n" + (here/"part_extras.js").read_text()).replace("/*{{MUSIC}}*/", (here/"part_music.js").read_text()).replace("/*{{TEX}}*/", json.dumps(tex))
(here/"lobby.html").write_text(s); print("lobby.html", len(s)//1024, "KB")
g = here/"games"; g.mkdir(exist_ok=True)
for name, src in [("slot", "slot/slot.html"), ("pyramid", "pyramid/pyramid.html"), ("asteroid", "asteroid/asteroid.html"), ("gravity", "gravity/gravity.html"), ("moons", "moons/moons.html"), ("warp", "warp/warp.html")]:
    shutil.copy(here/".."/src, g/f"{name}.html")
print("games:", ", ".join(sorted(p.name for p in g.iterdir())))
# safety net: refuse to ship a page whose script doesn't even parse (a stray comment once broke the whole lobby)
import subprocess, shutil as _sh
if _sh.which("node"):
    chk = subprocess.run(["node", "-e", "const s=require('fs').readFileSync('lobby.html','utf8');const js=s.split('<script>').pop().split('</script>')[0];new Function(js);"], cwd=here, capture_output=True, text=True)
    print("script check:", "ok" if chk.returncode == 0 else "FAILED\n" + chk.stderr[-400:])
    if chk.returncode: raise SystemExit(1)
