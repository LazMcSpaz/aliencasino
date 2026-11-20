#!/usr/bin/env python3
"""Builds wheel.html: shell.html + part_engine.js + the shared sound engine + the wheel model (../model3d/wheel_model.js, also used by the lobby) + art.
Run from wheel/: python3 build.py. Planet art (optional): art/planet_<id>.webp for moon, red, ice, gas, ring, earth, worm, hole; missing ones are drawn in code."""
import base64, json, pathlib
here = pathlib.Path(__file__).parent
b64 = lambda p, mime: f"data:{mime};base64," + base64.b64encode((here / p).read_bytes()).decode()
planets = {k: b64(f"art/planet_{k}.webp", "image/webp") for k in ["moon", "red", "ice", "gas", "ring", "earth", "worm", "hole"] if (here / f"art/planet_{k}.webp").exists()}
art = {"bar": b64("../slot/icons3/bar1.a.webp", "image/webp"), "planets": planets}
snd = (here / "../slot/part_sound.js").read_text().replace("    refill(){", "    tone, arp, note, thud,\n    refill(){", 1)
s = (here / "shell.html").read_text()
s = (s.replace("/*{{ART}}*/", json.dumps(art)).replace("/*{{ENGINE}}*/", (here / "../slot/part_wallet.js").read_text() + "\n" + (here / "part_engine.js").read_text())
     .replace("/*{{SOUND}}*/", snd).replace("/*{{MODEL}}*/", (here / "../model3d/wheel_model.js").read_text()))
(here / "wheel.html").write_text(s)
print("wheel.html", len(s) // 1024, "KB")
