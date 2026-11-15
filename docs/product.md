# Alien Casino

## What it is
You're a human abducted by aliens and invited aboard their travelling casino, and you gamble to win your way home. The casino is the product: a place full of alien games that are easy to pick up and a little familiar, but novel and unfamiliar is part of the appeal. The first game is a living slot machine with moods. More games will follow.

## Who it's for
The public, mostly regular casino and slot players. New ideas like moods are unfamiliar to them, so they need to be shown clearly, not explained in paragraphs. · Runs on: phones, portrait screen.

## The core loop
Move around the alien casino, pick a game, and play it to grow your gold bars. "Winning your way home" is story flavour for now, with no built-in finish line yet. Inside each game, its own loop applies. For the slot: spin, read the machine's mood, use what that mood allows, and chase the big bonus moment.

## Version 1 (minimum worth using)
- The casino itself: a low-poly 3D space you move around by tapping where to go, with the wandering slot robot in it.
- Two or three games playable from inside the casino. The slot machine is the first; the others are still to be designed.
- The slot machine game, built so far:
  - The screen fills the phone. The top quarter is the machine's face, with gray-alien almond eyes that show its mood, and it says short canned lines.
  - Three themed machines that share the face and background but differ in symbols, name, colours, frame, music and feel:
    - **Take a Bite**: alien food, with the goop "Bowl-nus".
    - **Club**: nightclub, with the VIA "Very Important Alien" card. Name still to be decided.
    - **Al'ien Capone's Casino**: alien mafia, with a briefcase of gold bars.
  - Clear paylines, with more lines as you bet more, explained visually rather than in text.
  - Harsh base odds that swing with winning and losing streaks, so play has ups and downs.
  - Teases before big moments: last-reel slow-downs and near-misses.
  - A bonus round that is the high point: a big, lingering, interactive intro for each machine, the whole screen transforming, and a multiplier that climbs from ×2 to ×5.
  - Moods, phase one: the five moods drift on their own, each changing the spins and what a tap does, with clear visual cues and short hints.
- The single gold bar is the currency across the whole casino.

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
- Art made with ChatGPT image generation as sprite sheets. 2D art is easy to get; 3D art is hard, so the 3D world stays low-poly and built in code.

## Future directions
| Direction | Status | What it means for the structure |
|---|---|---|
| The 3D casino: low-poly space with tap-to-travel; the slot robot wanders it with mood animations matching the game's moods | likely | 3D work lives in `model3d/` today. The casino gets its own folder; each game stays playable on its own and is opened from the casino. |
| Real-money credit purchases | likely | Credit changes go through the engine only. Never tie odds to purchases. |
| More slot machines | likely | Machine themes are data in one table (`MACHINES`); a new machine means a new entry plus art, not new code paths. |
| Moods phase two: player influences moods (feeding, petting, bet style) | likely | Mood state and drift live in the engine (`MOODS`, `moodTick`), so influence hooks attach there. |
| Cloud saves tied to the player's Google Play or Apple account (no separate sign-up) | likely | Progress isn't saved yet (only settings are). When saving is added, all of it goes through one save spot, so it can switch to the platform's cloud save. Never build our own account system. |
| Other casino games beyond slots (alien card game, alien roulette) | likely | Each game gets its own folder beside `slot/`. Shared pieces (gold bars, sound engine, the alien face) must not be tied to slot internals. |
| Ads, e.g. watch an ad for free credits | likely | Ads may only grant credits; they never change odds or moods. One spot in the code hands out ad rewards. |
| Social: leaderboards, gifting credits, playing alongside others | maybe | Noted; credits stay in one engine variable, so it doesn't rule this out. |

Revisit this table whenever a feature seems to push the project in a new direction.
