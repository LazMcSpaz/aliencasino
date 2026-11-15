# Still-works checklist
Run after any change that touches how the game behaves. Takes about 5 minutes.

**Start:** open `slot/slot.html` in a phone-sized browser window, or open the published prototype link.

1. **Load.** The face greets you with a line, the reels show symbols, and the credits show in the top-left.
2. **Spin.** Tap SPIN. Credits drop by the bet, all three reels spin and stop smoothly (no black squares, no symbols jumping), and any win counts up with its payline drawn.
3. **Lines.** Tap the line buttons 1–5. The bet changes, and the lines you're playing are shown on the reels.
4. **Bonus.** Open ⓘ → Debug → Force bonus, then spin. The bonus intro plays, the screen transforms, and free spins run. The ×2 medal climbs when the top symbol lands. At the end, you return to normal with the total added.
5. **Machines.** In ⓘ, switch machines: Take a Bite → Club → Capone. The name, symbols, colours, frame and music all change. Force a bonus on each to see its own intro.
6. **Moods.** In Debug, tap "Mood: sleepy". The MOOD CHANGE banner shows, the side labels and the reel rim turn blue, and during a spin you can tap a reel to stop it.
7. **Nudge.** Tap "Mood: giddy" and spin. NUDGE tags appear on all three reels, and tapping one slides it down a step.
8. **Sound.** After your first tap, music plays and spins make sounds. The speaker button mutes everything, and the music button in ⓘ mutes just the music.
9. **3D robot.** Open `model3d/slot_bot.html`. The robot turns slowly, and the Idle/Walk/Grab buttons and the mood buttons change its animation and face.

## Known issues
- (none recorded yet)
