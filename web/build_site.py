#!/usr/bin/env python3
"""Builds site/: the casino as an installable web app that works offline (iPhone: Safari → Share → Add to Home Screen).
Same pages as the artifact, but nothing is fetched from the internet: the 3D engine, the Star Dozer physics and the fonts are packed inside each page
(web/vendor, web/fonts), and a service worker (sw.js) keeps every file on the phone after the first visit.
Run from the repo root after building the games and the lobby:  python3 web/build_site.py
Publish: the site/ folder goes on the gh-pages branch (GitHub Pages serves it at https://lazmcspaz.github.io/aliencasino/)."""
import base64, hashlib, json, pathlib, re, shutil, subprocess
ROOT = pathlib.Path(__file__).resolve().parent.parent; WEB = ROOT / "web"; OUT = ROOT / "site"; LOBBY = ROOT / "lobby"
V = lambda n: (WEB / "vendor" / n).read_text()
b64 = lambda p: base64.b64encode(pathlib.Path(p).read_bytes()).decode()

# the fonts every page uses, as @font-face rules with the files inside (so they work offline, even inside a game's frame)
FONTS = [("Bungee", 400, "bungee-latin-400-normal"), ("Monoton", 400, "monoton-latin-400-normal"), ("Share Tech Mono", 400, "share-tech-mono-latin-400-normal"),
         ("Yellowtail", 400, "yellowtail-latin-400-normal"), ("Chakra Petch", 500, "chakra-petch-latin-500-normal"), ("Chakra Petch", 600, "chakra-petch-latin-600-normal"),
         ("Chakra Petch", 700, "chakra-petch-latin-700-normal"), ("Outfit", 400, "outfit-latin-400-normal"), ("Outfit", 500, "outfit-latin-500-normal"), ("Outfit", 700, "outfit-latin-700-normal")]
FONT_CSS = "<style>" + "".join(f'@font-face{{font-family:"{f}";font-style:normal;font-weight:{w};font-display:swap;src:url(data:font/woff2;base64,{b64(WEB / "fonts" / (n + ".woff2"))}) format("woff2")}}' for f, w, n in FONTS) + "</style>"
CDN = "https://cdn.jsdelivr.net/npm/three@0.147.0/"
SCRIPTS = {CDN + "build/three.min.js": "three.min.js", CDN + "examples/js/controls/OrbitControls.js": "OrbitControls.js", CDN + "examples/js/loaders/GLTFLoader.js": "GLTFLoader.js",
           CDN + "examples/js/utils/BufferGeometryUtils.js": "BufferGeometryUtils.js", CDN + "examples/js/utils/SkeletonUtils.js": "SkeletonUtils.js", CDN + "examples/js/environments/RoomEnvironment.js": "RoomEnvironment.js"}

def offline(html):
    """Swap every internet fetch in a page for its packed-in copy."""
    html = re.sub(r'<link[^>]+fonts\.(googleapis|gstatic)\.com[^>]*>\n?', "", html)
    html = html.replace("<style>", FONT_CSS + "\n<style>", 1)
    for url, name in SCRIPTS.items():
        html = html.replace(f'<script src="{url}"></script>', "<script>" + V(name) + "\n</script>")
    if "rapier3d-compat" in html:   # Star Dozer's physics: a module, loaded from a packed-in copy through a blob URL
        html = html.replace("await import(RAPIER_URL)", 'await import(URL.createObjectURL(new Blob([document.getElementById("rapier-src").textContent], { type: "text/javascript" })))')
        html = html.replace('"https://cdn.jsdelivr.net/npm/@dimforge/rapier3d-compat@0.14.0/rapier.es.js"', '"(packed in)"')
        html = html.replace("<script>", '<script type="text/plain" id="rapier-src">' + V("rapier.es.js") + "</script>\n<script>", 1)
    left = re.findall(r'https://(?:cdn\.jsdelivr\.net|fonts\.googleapis\.com|unpkg\.com|cdnjs\.cloudflare\.com)[^"\'\s)]*', html)
    if left: raise SystemExit(f"still fetches from the internet: {sorted(set(left))[:5]}")
    return html

if OUT.exists(): shutil.rmtree(OUT)
(OUT / "games").mkdir(parents=True); (OUT / "assets").mkdir()
for g in sorted((LOBBY / "games").glob("*.html")): (OUT / "games" / g.name).write_text(offline(g.read_text()))
for a in sorted((LOBBY / "assets").glob("*.b64.txt")): shutil.copy(a, OUT / "assets" / a.name)

# the home-screen icon: drawn in a headless browser with the casino's own fonts and gold bar
bar = "data:image/webp;base64," + b64(ROOT / "slot/icons3/bar1.a.webp")
icon_html = FONT_CSS + f"""<style>body{{margin:0}}.i{{width:512px;height:512px;display:grid;place-items:center;background:radial-gradient(circle at 50% 38%,#3a1f7a,#0a0620 72%);overflow:hidden;position:relative}}
.r{{position:absolute;inset:44px;border-radius:50%;border:10px solid #5fe8ff;box-shadow:0 0 30px #5fe8ff,inset 0 0 30px #5fe8ff}}
.t{{position:absolute;top:96px;width:100%;text-align:center;font:400 92px Bungee;color:#fff;text-shadow:0 0 18px #ff5fae,0 0 4px #fff}}
.c{{position:absolute;top:186px;width:100%;text-align:center;font:400 96px Yellowtail;color:#ffe9b0;text-shadow:0 0 16px #ffc845}}
.b{{position:absolute;top:300px;left:136px;width:240px;height:150px;background:url({bar}) center/contain no-repeat;filter:drop-shadow(0 0 22px #ffc845aa)}}</style>
<div class=i><div class=r></div><div class=t>ALIEN</div><div class=c>Casino</div><div class=b></div></div>"""
(OUT / "_icon.html").write_text(icon_html)
subprocess.run(["node", "-e", """const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:512,height:512}});
await p.goto('file://'+process.argv[1]);await p.waitForTimeout(400);for(const s of [512,192,180]){await p.setViewportSize({width:512,height:512});await p.screenshot({path:process.argv[2]+'/icon-'+s+'.png',clip:{x:0,y:0,width:512,height:512},scale:'css'});}
await b.close();})()""", str(OUT / "_icon.html"), str(OUT)], check=True)
(OUT / "_icon.html").unlink()
from PIL import Image
for s in (192, 180): Image.open(OUT / "icon-512.png").resize((s, s), Image.LANCZOS).save(OUT / f"icon-{s}.png")

(OUT / "manifest.webmanifest").write_text(json.dumps({"name": "Alien Casino", "short_name": "Alien Casino", "start_url": "./", "scope": "./", "display": "standalone", "orientation": "portrait",
  "background_color": "#03040f", "theme_color": "#03040f", "icons": [{"src": "icon-192.png", "sizes": "192x192", "type": "image/png"}, {"src": "icon-512.png", "sizes": "512x512", "type": "image/png"}]}, indent=1))

# the lobby page, with the skeleton the artifact host normally adds, plus what makes it an app: icon, manifest, full-screen, the service worker
lobby = offline((LOBBY / "lobby.html").read_text())
head = """<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Alien Casino"><meta name="theme-color" content="#03040f"><link rel="manifest" href="manifest.webmanifest"><link rel="apple-touch-icon" href="icon-180.png">
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}</style></head><body>"""
sw_reg = """<script>if("serviceWorker" in navigator) addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));</script>"""
(OUT / "index.html").write_text(head + lobby + sw_reg + "</body></html>")

# the service worker: keeps every file on the phone; a new build gets a new cache name, so the app updates the next time it's opened online
files = sorted(p.relative_to(OUT).as_posix() for p in OUT.rglob("*") if p.is_file())
ver = hashlib.sha1(b"".join((OUT / f).read_bytes() for f in files)).hexdigest()[:10]
(OUT / "sw.js").write_text(f"""// Alien Casino offline cache, version {ver}. Built by web/build_site.py: keeps every file on the device so the casino works with no connection.
const CACHE = "alien-casino-{ver}", FILES = {json.dumps(["./"] + files)};
self.addEventListener("install", e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())));
self.addEventListener("activate", e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("alien-casino-") && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener("fetch", e => {{ if (e.request.method !== "GET") return;
  e.respondWith(caches.match(e.request, {{ ignoreSearch: true }}).then(hit => hit || fetch(e.request).then(r => {{ if (r.ok && new URL(e.request.url).origin === location.origin) {{ const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }} return r; }}))); }});
""")
(OUT / ".nojekyll").write_text("")
total = sum((OUT / f).stat().st_size for f in files)
print(f"site/: {len(files)} files, {total / 1e6:.1f} MB, cache version {ver}")
