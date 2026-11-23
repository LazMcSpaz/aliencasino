// Alien Casino offline cache, version 26d7b3d9ab. Built by web/build_site.py: keeps every file on the device so the casino works with no connection.
// Files are saved one at a time with progress messages to the page; anything that fails is retried every time the app is opened online.
const CACHE = "alien-casino-26d7b3d9ab", FILES = ["./", "assets/bush_1.b64.txt", "assets/cute_alien.b64.txt", "assets/cute_alien_tall.b64.txt", "assets/enemy_extrasmall.b64.txt", "assets/enemy_flying.b64.txt", "assets/enemy_large.b64.txt", "assets/enemy_small.b64.txt", "assets/planet_1.b64.txt", "assets/planet_2.b64.txt", "assets/planet_5.b64.txt", "assets/planet_9.b64.txt", "assets/plant_1.b64.txt", "assets/plant_3.b64.txt", "assets/props_statue.b64.txt", "assets/tree_blob_1.b64.txt", "assets/tree_floating_1.b64.txt", "assets/tree_light_1.b64.txt", "assets/tree_spiral_1.b64.txt", "games/asteroid.html", "games/gravity.html", "games/moons.html", "games/pusher.html", "games/pyramid.html", "games/slot.html", "games/warp.html", "games/wheel.html", "icon-180.png", "icon-192.png", "icon-512.png", "index.html", "manifest.webmanifest"];
const tell = async msg => { for (const c of await self.clients.matchAll({ includeUncontrolled: true })) c.postMessage({ type: "offline", ...msg }); };
let filling = null;
function fill() { return filling || (filling = (async () => { const c = await caches.open(CACHE); let have = 0, missing = 0;
  for (const f of FILES) { if (await c.match(f)) { have++; continue; }
    let ok = false; for (let t = 0; t < 3 && !ok; t++) { try { const r = await fetch(f, { cache: "reload" }); if (r.ok) { await c.put(f, r); ok = true; } } catch (e) {} }
    if (ok) have++; else missing++; tell({ have, total: FILES.length, done: false }); }
  tell({ have, total: FILES.length, done: true, missing }); filling = null; return missing; })()); }
self.addEventListener("install", e => e.waitUntil(fill().then(() => self.skipWaiting())));
self.addEventListener("activate", e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("alien-casino-") && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener("message", e => { if (e.data === "status") fill(); });
self.addEventListener("fetch", e => { if (e.request.method !== "GET") return;
  e.respondWith((async () => { const c = await caches.open(CACHE);
    const hit = await c.match(e.request, { ignoreSearch: true }) || (e.request.mode === "navigate" ? await c.match("./") : null);
    if (hit) return hit;
    try { const r = await fetch(e.request); if (r.ok && new URL(e.request.url).origin === location.origin) c.put(e.request, r.clone()); return r; }
    catch (err) { return (await c.match("./")) || Response.error(); } })()); });
