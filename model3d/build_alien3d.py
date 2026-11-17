"""Builds alien_patron.html (the tentacled alien patron concept viewer) from alien_viewer.src.html + alien_model.js.
Run from model3d/: python3 build_alien3d.py"""
s = open("alien_viewer.src.html").read().replace("/* {{MODEL}} */", open("alien_model.js").read()).replace("/* {{TEX}} */", "{}")
open("alien_patron.html", "w").write(s); print("alien_patron.html", len(s) // 1024, "KB")
