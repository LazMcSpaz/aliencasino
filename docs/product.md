# Alien Casino

## What it is
You're a human abducted by aliens and invited aboard their travelling casino, and you gamble to win your way home. The casino games are easy to pick up and a little familiar, but novel and unfamiliar is part of the appeal. The first game is a living slot machine with moods.

## Who it's for
The public, mostly regular slot-machine players. Moods are a new idea to them, so they need to be shown clearly, not explained in paragraphs. · Runs on: phones, portrait screen.

## The core loop
Spin the slot, read the machine's mood, use what that mood allows (nudge, stop reels, smack, call its bluff), and chase the big bonus moment.

## Version 1 (minimum worth using)
- The slot machine screen fills the phone. The top quarter is the machine's face, with gray-alien almond eyes that show its mood, and it says short canned lines.
- Three themed machines that share the face and background but differ in symbols, name, colours, frame, music and feel:
  - **Take a Bite**: alien food, with the goop "Bowl-nus".
  - **Club**: nightclub, with the VIA "Very Important Alien" card. Name still to be decided.
  - **Al'ien Capone's Casino**: alien mafia, with a briefcase of gold bars.
- Clear paylines, with more lines as you bet more, explained visually rather than in text.
- Harsh base odds that swing with winning and losing streaks, so play has ups and downs.
- Teases before big moments: last-reel slow-downs and near-misses.
- A bonus round that is the high point: a big, lingering, interactive intro for each machine, the whole screen transforming, and a multiplier that climbs from ×2 to ×5.
- Moods, phase one: the five moods drift on their own, each changing the spins and what a tap does, with clear visual cues and short hints. Phase one is built.
- The single gold bar is the currency.

## Never
- Credits never cash out. Real money buys credits only.
- Odds, moods and items are never tied to spending.
- Stutter, blank or black symbols, or reels visibly jumping. Those make players feel cheated, and smooth play is a trust issue.
- Anything covering the machine's eyes.
- Flat-looking visuals. Everything gets depth, soft fading glows and no hard-edged glows.
- Realistic or creepy eyes. Keep them cute, glowing and gray-alien shaped.
- Long text explanations of mechanics that players don't influence.
- Pop-up hints that linger or block the reels.

## Inspirations
- Real casino slot machines: the familiar feel, the paylines, and teases that build tension.
- Pub fruit machines: nudges and stopping reels yourself.

## Works with
- Godot, the planned engine for the full game. The 3D slot robot (`model3d/out/slot_bot.glb`) is built to import into it.
- Art made with ChatGPT image generation as sprite sheets. 2D art is easy to get; 3D art is hard.

## Future directions
| Direction | Status | What it means for the structure |
|---|---|---|
| Full game in Godot: low-poly 3D casino with tap-to-travel; the slot robot wanders it with mood animations | likely | Slot logic (`part_engine.js`) stays free of anything visual, so it can be rewritten in Godot one-to-one. 3D work lives in `model3d/`. |
| Real-money credit purchases | likely | Credit changes go through the engine only. Never tie odds to purchases. |
| More slot machines | likely | Machine themes are data in one table (`MACHINES`); a new machine means a new entry plus art, not new code paths. |
| Moods phase two: player influences moods (feeding, petting, bet style) | likely | Mood state and drift live in the engine (`MOODS`, `moodTick`), so influence hooks attach there. |
| Cloud saves tied to the player's Google Play or Apple account (no separate sign-up) | likely | Progress isn't saved yet (only settings are). When saving is added, all of it goes through one save spot, so it can switch to the platform's cloud save. Never build our own account system. |
| Other casino games beyond slots (alien card game, alien roulette) | likely | Each game gets its own folder beside `slot/`; shared pieces (currency, sound engine, face) must not be tied to slot internals. |
| Ads, e.g. watch an ad for free credits | likely | Ads may only grant credits; they never change odds or moods. One spot in the code hands out ad rewards. |
| Social: leaderboards, gifting credits, playing alongside others | maybe | Noted; credits stay in one engine variable, so it doesn't rule this out. |

Revisit this table whenever a feature seems to push the project in a new direction.
