# Alien Casino

A mobile game concept: you've been abducted by aliens and invited aboard their travelling casino, where you gamble to win your way home. The first game is a **living slot machine** with moods. It has a glowing gray-alien face, and later it will wander the casino on stubby corrugated legs.

This repo holds the playable slot prototype (a single web page) and the 3D model of the walking slot machine.

---

## What's here

```
slot/        the slot machine prototype
  shell.html       page layout, styles, screen logic (intros, moods on screen, music, UI)
  part_engine.js   the maths: paytable, odds, streaks, bonus, moods, nudges, multiplier boosters
  part_sound.js    all sound effects and music, made live in the browser (no audio files except two clips)
  build.py         glues everything into one file → slot.html
  slot.html        the finished, playable prototype (open it in any browser)
  icons/ icons2/ icons3/   symbol art for the three machines (food / club / mafia)
  bg/              intro backgrounds (club curtain, mafia brick wall, hi-res VIA card)
  audio/           tommy-gun and tyre-squeal clips used in the mafia bonus intro
  tools/           simulations and automated test scripts (see below)

gravity/     Gravity Well: spiral roulette — a comet spirals down a 3-tier bowl into a black hole
  part_engine.js   tiers (4 / 12 / 24 sections, ×4 / ×12 / ×24), void slivers (house edge), path and void bets
  shell.html       the bowl (it is the betting table), the comet's flight, reveals, sound
  build.py         → gravity.html · tools/sim.js checks payback (each tier ≈95%), tools/playtest.js browser test

moons/       Twin Moons: alien craps — two 8-sided moons, the GAP between them counts, matching moons collide (the crash)
  part_engine.js   come-out / point rules, With / Against / Gap / Collide bets · tools/sim.js checks payback, tools/playtest.js browser test
  shell.html, build.py → moons.html

warp/        Warp Drive: a "crash" game — the ship's multiplier climbs; cash out before the warp core blows
  part_engine.js   crash point (payback ≈96% at any cash-out target), bets, cash out · tools/sim.js checks payback, tools/playtest.js browser test
  shell.html       flight screen (left ⅔): the drone (art/drone.webp) climbs off a planet, through clouds, into space; flashier at each threshold
                   betting panel (right ⅓): wager, auto bail, flight board of up to 8 aliens, BAIL · build.py → warp.html · tools/frames.js screenshots

asteroid/    Asteroid Field: a "mines" game — crack asteroids for crystals, collect before you hit a black hole
  part_engine.js   5×5 field, 1–24 black holes, multiplier = fair odds × 97% · tools/sim.js checks payback, tools/playtest.js browser test
  shell.html       holo field with procedural rocks and crystals, multiplier ladder, escalating effects, black-hole pull · build.py → asteroid.html

pusher/      Star Dozer, a coin pusher: drop coins on the sliding pusher, shove the pile over the front edge; coins stack one level; the tray is kept between visits
  part_engine.js   physics (coins, pusher, stacking), payouts, prizes; pure logic · shell.html drawing + screen · build.py → pusher.html
  tools/sim.js     payback check (about 95% over a long run) · tools/playtest.js headless play-through
lobby/       the Alien Casino floor: walk it in first person (or switch to the bird's-eye view), walk up to a machine and tap it to play
  lobby.src.html   room, lights, picking, the card, the game overlay, the wallet · build.py → lobby.html (+ copies the built games into games/, not committed)
  part_walk.js     first-person walking: swipe up to walk, sideways to turn, release to stop; hologram controls; collisions
  part_extras.js   the front lounge (DJ stage, dance floor, booths), jackpot board, screens, plants, planets, and the alien patrons
  part_music.js    lounge music made live in the browser (no audio files)
  assets/          CC0 models by Quaternius (quaternius.com: Ultimate Space Kit, Ultimate Modular Sci-Fi), unpacked from Draco and trimmed
  tools/shot.js, tools/views.js   screenshots (serve lobby/ over http first)

model3d/     the walking slot-machine robot
  model.js         builds the robot in code (cabinet, corrugated legs and arms, claws, animations)
  viewer.src.html  the interactive 3D viewer page (template)
  build3d.py       builds slot_bot.html from the template + model + textures
  slot_bot.html    the finished interactive viewer (open in a browser)
  export3d.js      exports the Godot-ready model → out/slot_bot.glb
  capture.js       screenshots the real game to make the robot's screen textures
  cap/             those screen textures (top sign, face per mood, reels, controls)
  out/             slot_bot.glb (for Godot) + the five mood face images
  pyramid_model.js       the Pyramid Scheme robot: beefy cabinet, one continuous curved screen, squat legs, no arms
  pyramid_viewer.src.html / build_pyramid3d.py → pyramid_bot.html (its 3D viewer)
  capture_pyramid.js     screenshots the real Pyramid game for its curved screen → cap/pyr_screen.webp
  gravity_model.js       Gravity Well table (concept): stepped bowl with the game's art, dealer console with a face, big arm holding the launcher
  gravity_viewer.src.html / build_gravity3d.py → gravity_table.html · capture_gravity.js grabs the bowl art → cap/gw_bowl.webp
  moons_model.js        the Twin Moons craps-style table (long felt tub, bumpers, mirrored layout, robot dealer, laser wall + end launcher)
  moons_viewer.src.html / build_moons3d.py → twin_moons_table.html · shotmoons.js takes test screenshots
  alien_model.js        the tentacled alien patron: skinned tentacles (crest, arms, gown of legs), 4 colourways; clips Idle/Glide/Play/Cheer
  alien_viewer.src.html / build_alien3d.py → alien_patron.html · shotalien.js takes test screenshots
  warp_model.js, pusher_model.js         the Warp Drive stage: tall flight screen, leaderboard screen on arms, holo rings, 7 betting podiums with stools; launch = lights, steam
  warp_viewer.src.html / build_warp3d.py → warp_stage.html · capture_warp.js grabs flight frames from the game → cap/warp_*.webp
```

## How to rebuild

- **Slot game:** from `slot/`, run `python3 build.py`. This writes `slot.html`.
- **3D viewer:** from `model3d/`, run `python3 build3d.py`. This writes `slot_bot.html`.
- **Godot model:** from `model3d/`, run `node export3d.js` (needs Playwright and three.js 0.147). This writes `out/slot_bot.glb`.

## The three machines

| Machine | Theme | Wild | Bonus trigger | Bonus multiplier booster |
|---|---|---|---|---|
| **Take a Bite** | Alien food | Spiky fruit | Goop bowl ("Bowl-nus") | Alien boar |
| **Club** (name TBD) | Nightclub | Space crystals | VIA card ("Very Important Alien") | Alien DJ |
| **Al'ien Capone's Casino** | Alien mafia | Cannoli | Briefcase of gold bars | Al'ien Capone |

The single gold bar is the game's currency. It's play money only and never cashes out.

## The moods (phase one)

The machine drifts between five moods, roughly every 10–30 spins. Winning a lot makes it grumpy, losing makes it happy or giddy, and leaving it alone sends it to sleep. Each mood changes the spins and gives the player one tap power:

| Mood | Spins | Tap power |
|---|---|---|
| Happy | normal | pat its face (just for fun) |
| Giddy | a bit leaner | **nudge** a reel down one step after every spin. The new result replaces the old one, so you can nudge a win away |
| Grumpy | fewer but bigger wins | **smack** its face; sometimes it coughs up coins |
| Sleepy | slow reels | **tap a reel to stop it** (it drifts 0–2 symbols past your tap) |
| Mischievous | fakes bonus teases, swaps symbols | **call its bluff** during a tease (its eyes go sly when it's faking) |

The mood is always shown on the face screen: the eye colour, a label running up the left edge, the power down the right edge, and a coloured rim around the reels. A banner announces each change.

## Fairness

- **Payout:** the machine pays back about **87%** of what's bet over the long run. Each mood stays within about 80–91% depending on how well its power is used, so reading the machine helps a little but never beats it.
- **Checking it:** `slot/tools/simmood.js` and `slot/tools/simbonus.js` run the real engine code for hundreds of thousands of spins to verify this.
- **Real money:** buys credits only. Moods, items and odds are never tied to spending.

## Tools

Run these from `slot/`:
- `node tools/simbonus.js part_engine.js label`: overall payout, bonus frequency, session outcomes.
- `node tools/simmood.js`: payout per mood, hands-off versus attentive play.
- `node tools/simmult.js`: how high the bonus multiplier climbs.
- The other files in `tools/` are automated browser tests (Playwright) for moods, nudges, the multiplier, performance and music.

## Next

- A real name for the club machine.
- Phase two of moods: the player influences the mood (feeding, petting, betting style).
- The Godot build with the 3D casino and the walking robot, with mood animations matching the moods above.
