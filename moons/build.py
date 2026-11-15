#!/usr/bin/env python3
"""Builds moons.html: shell.html + part_engine.js + the shared sound engine + art, all in one file. Run from moons/: python3 build.py"""
import base64, json, pathlib
here = pathlib.Path(__file__).parent
b64 = lambda p, mime: f"data:{mime};base64," + base64.b64encode((here / p).read_bytes()).decode()
art = {"bar": b64("../slot/icons3/bar1.a.webp", "image/webp")}
snd = (here / "../slot/part_sound.js").read_text().replace("    refill(){", "    tone, arp, note, thud,\n    refill(){", 1)
s = (here / "shell.html").read_text()
s = s.replace("/*{{ART}}*/", json.dumps(art)).replace("/*{{ENGINE}}*/", (here / "part_engine.js").read_text()).replace("/*{{SOUND}}*/", snd)
(here / "moons.html").write_text(s)
print("moons.html", len(s) // 1024, "KB")
