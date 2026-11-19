"""Builds alien_head.html (head study viewer) from alien_head_viewer.src.html + alien_head.js. Run from model3d/: python3 build_alien_head.py"""
import subprocess
subprocess.run(["node", "--check", "alien_head.js"], check=True)
s = open("alien_head_viewer.src.html").read().replace("/* {{MODEL}} */", open("alien_head.js").read()).replace("/* {{TEX}} */", "{}")
open("alien_head.html", "w").write(s); print("alien_head.html", len(s) // 1024, "KB")
