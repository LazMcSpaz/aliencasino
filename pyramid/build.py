#!/usr/bin/env python3
"""Builds pyramid.html: shell.html + part_engine.js + the shared sound engine + art, all in one file. Run from pyramid/: python3 build.py"""
import base64, json, pathlib
here = pathlib.Path(__file__).parent
b64 = lambda p, mime: f"data:{mime};base64," + base64.b64encode((here / p).read_bytes()).decode()
# mascot: separate head and body pieces with their neck anchors (cut from art/mascot/sheet.png by tools/cutmascot.py)
anchors = json.loads((here / "art/mascot/anchors.json").read_text())
mascot = {k: {**anchors[k], "src": b64(f"art/mascot/{k}.webp", "image/webp")} for k in anchors if (here / f"art/mascot/{k}.webp").exists()}
art = {"sandstone": b64("art/sandstone.webp", "image/webp"), "bar": b64("../slot/icons3/bar1.a.webp", "image/webp")}
# shared sound engine (lives in slot/ for now); expose the generic voices the same way slot/build.py does
snd = (here / "../slot/part_sound.js").read_text().replace("    refill(){", "    tone, arp, note, thud,\n    refill(){", 1)
s = (here / "shell.html").read_text()
s = s.replace("/*{{ART}}*/", json.dumps(art)).replace("/*{{MASCOT}}*/", json.dumps(mascot)).replace("/*{{ENGINE}}*/", (((here / "../slot/part_wallet.js").read_text() + "\n" + (here / "../slot/part_shared.js").read_text()) + "\n" + (here / "part_engine.js").read_text())).replace("/*{{SOUND}}*/", snd)
(here / "pyramid.html").write_text(s)
print("pyramid.html", len(s) // 1024, "KB")
