# Pact of the Damned

A web-native vampire-survival roguelike. Hordes of the dead, an Altar every two minutes, and a single question: **how much of you will be left at sunrise?**

## Run it

**Option A — double-click.** Open `index.html` in any modern browser. No build, no install.

**Option B — local server (if your browser blocks something).** PowerShell:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File serve.ps1 -Port 5173
```

then open <http://localhost:5173>.

## Controls

| Key | Action |
|---|---|
| **WASD** / Arrows | Move |
| Auto | Attacks fire on their own |
| **1 / 2 / 3 / 4** | Ally commands: Follow / Hunt / Guard / Sacrifice |
| **ESC** | Pause |

## The Pact System (the differentiator)

Every **120 seconds** the Altar appears. Five choices:

- **Pact of Power** — burn ALL skills, gain one **Legendary**
- **Pact of Brotherhood** — burn half your skills, gain **+1 ally** with 4 commands
- **Pact of Greed** — burn half your XP, **2x XP** for the rest of the run
- **Pact of Flesh** — halve max HP forever, **+200% damage** on everything
- **Walk Away** — keep what you have

## What's in the box

- 3 heroes (Stalker / Butcher / Necromancer) — each with a unique **signature AOE** that survives the Pact of Power:
  - **Stalker** → *Bat Burst* — 8 piercing bats every 2s
  - **Butcher** → *Blood Pool* — damaging puddle every 3s (stacks)
  - **Necromancer** → *Bone Storm* — expanding shockwave every 3.5s
- ~15 skills with up to 5 levels each (data-driven, easy to extend)
- 5 legendary skills (Blood Moon, Eternal Night, Soul Drain, Crimson Comet, Void Pact)
- 4 Pact archetypes
- Wave director with rising difficulty
- Crimson Lord boss at the 5-minute mark
- **8×8 pixel-art sprites** with 2-frame walk cycles (heroes, enemies, ally, boss 12×12)
- **Retro-synth SFX** (19 sounds via Web Audio: hit, kill, hurt, level-up, altar, every Pact, boss roar, ally commands, sacrifice, bat-burst, blood-pool, bone-storm, death, pickup, button click)
- **Procedural dark-castle music** — Dm-Bb-C-Dm minor progression with bass, organ pad, and bell hits
- localStorage stats + settings (SFX volume, music volume, screen shake)

## Tech

- Pure HTML + JS, classic script tags, no build step
- HTML5 Canvas with pre-rendered procedural sprites
- Struct-of-Arrays enemy pool (`Float32Array`) — tested at 60 FPS with 600+ enemies on screen
- Uniform spatial hash (64px cells) for collisions
- Fixed 60Hz timestep with accumulator
- All skills are **data composed of effect tags** (`damage_mult`, `orbit_damage`, `aura_damage`, …) — adding a new skill is one JSON-shaped object

## File map

```
index.html                   - script-tag loader
src/styles.css               - gothic palette + UI styling
src/main.js                  - global G namespace
src/boot.js                  - scene router + loop start (loads last)
src/engine/                  - loop, canvas, input, rng, spatial hash
src/data/                    - heroes (with signature AOEs), enemies, skills, pacts, waves
src/game/                    - player, enemies (SoA), projectiles, xp, ally, spawner, levelup, pact, effects, state
src/audio/                   - sfx (Web Audio synth), music (procedural castle ambient)
src/render/                  - pixelArt (bitmap encoder), sprites (all 8x8 bitmaps), particles, damageNumbers
src/ui/                      - hud, cards, altar, menu helpers
src/scenes/                  - menu, heroSelect, run, gameover
src/meta/                    - localStorage storage
serve.ps1                    - optional PowerShell static server
```

## Adding a new skill (≤10 lines)

Open `src/data/skills.js` and append:

```js
{
  id: 'my_skill',
  name: 'My Skill',
  icon: '\u{1F525}',
  maxLevel: 5,
  desc: (lv) => `Does cool stuff at level ${lv}.`,
  effects: (lv) => [{ type: 'damage_mult', value: 1 + lv * 0.1 }],
}
```

The effect interpreter in `src/game/effects.js` handles ~15 tag types; reuse them or add a new tag and a `case` in `applyEffect`.
