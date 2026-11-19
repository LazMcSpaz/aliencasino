#!/usr/bin/env python3
"""Builds pusher.html: shell.html + part_engine.js + the shared sound engine + the machine model (../model3d/pusher_model.js, also used by the lobby) + art, all in one file. Run from pusher/: python3 build.py"""
import base64, json, pathlib
here = pathlib.Path(__file__).parent
b64 = lambda p, mime: f"data:{mime};base64," + base64.b64encode((here / p).read_bytes()).decode()
art = {"bar": b64("../slot/icons3/bar1.a.webp", "image/webp"), "barFace": b64("art/bar_face.webp", "image/webp"),
       "zib": {k: b64(f"../pyramid/art/mascot/head_{k}.webp", "image/webp") for k in ["neutral", "concerned", "wink", "excited", "surprised", "angry"]}}   # Zib, the lookout   # barFace: the bar picture straightened flat (make_bar_face.py)
snd = (here / "../slot/part_sound.js").read_text().replace("    refill(){", "    tone, arp, note, thud,\n    refill(){", 1)
s = (here / "shell.html").read_text()
s = s.replace("/*{{ART}}*/", json.dumps(art)).replace("/*{{ENGINE}}*/", ((here / "../slot/part_wallet.js").read_text() + "\n" + (here / "part_engine.js").read_text())).replace("/*{{SOUND}}*/", snd).replace("/*{{MODEL}}*/", (here / "../model3d/pusher_model.js").read_text())
(here / "pusher.html").write_text(s)
print("pusher.html", len(s) // 1024, "KB")
