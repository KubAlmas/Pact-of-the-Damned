# 🩸 Pact of the Damned

<p align="center">
  <a href="https://kubalmas.github.io/Pact-of-the-Damned/">
    <img src="https://img.shields.io/badge/▶_PLAY_NOW-c41e3a?style=for-the-badge&logo=github&logoColor=white&labelColor=1a0606" alt="Play Now" height="80">
  </a>
</p>

<p align="center">
  <b><a href="https://kubalmas.github.io/Pact-of-the-Damned/">https://kubalmas.github.io/Pact-of-the-Damned/</a></b>
</p>

<p align="center">
  <i>A web-native vampire-survival roguelike with arcade bullet-hell bosses.</i><br/>
  <i>One click. No install. Runs in any modern browser.</i>
</p>

---

## Controls

| Key | Action |
|---|---|
| **WASD** / Arrows | Move (works on RU/KZ/EN layouts) |
| **Mouse** | Aim throwing daggers |
| **1 / 2 / 3 / 4** | Ally commands (Follow / Hunt / Guard / Sacrifice) |
| **ESC** | Pause → Resume / Restart / Main Menu |

## The Hook

Every **120 seconds** the Altar appears. Choose what to sacrifice:

- **Pact of Power** — burn ALL skills, gain one **Legendary**
- **Pact of Brotherhood** — burn half your skills, gain **+1 ally**
- **Pact of Greed** — burn half your XP, **2× XP** for the run
- **Pact of Flesh** — halve max HP forever, **+200% damage**
- **Walk Away** — keep what you have

Every **60 seconds** a boss appears (cleared arena, arcade-style bullet patterns: spreads, spirals, lasers, mortars, beam-walls). Survive, kill it, choose 3 skill upgrades OR claim 100 Soul Shards for the talent tree.

## Features

- **Single hero** with PNG sprite-sheet 8-directional animations
- **30+ skills**: Throwing Daggers (cursor-aimed), Bat Swarm, Blood Whip, Ravens, Fireball, Boomerang, Banana Mines, Frost Lance, Shadow Bolt, Chain Lightning, Witch Sigil, Frost Nova, Skull Bombs, Spectral Hand, Holy Fire, Thorns, Crit, Berserk, Regen, Iron Skin, Soul Echo, Whirlwind, Spiked Shell — and more
- **7 legendary skills** (Blood Moon, Eternal Night, Soul Drain, Crimson Comet, Void Pact, **Nuke**, **Anti-Agro**, **Laser/Homelander**)
- **9 enemy types** + 4 cycling bosses (Crimson Lord, Bone Tyrant, Plague Mother, Void Lord) each with own bullet patterns
- **Talent tree** with persistent Soul Shards across runs
- **Retro Web-Audio SFX** + procedural Touhou-style dark-castle music

## Tech

Pure HTML5 + vanilla JS + Canvas. No build step, no dependencies, no backend. Sprite sheets baked at runtime, skills are data-driven JSON, enemy SoA pool runs 60 FPS with 600+ on screen.

```
index.html      — script-tag loader
src/engine/     — game loop, canvas, input, spatial hash
src/data/       — heroes, enemies, skills, pacts, waves
src/game/       — player, enemies, projectiles, ally, boss, effects
src/audio/      — synthesized SFX + procedural music
src/render/     — sprite sheets, particles, damage numbers
src/scenes/     — menu, run, gameover, talent tree
```

## Run locally

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File serve.ps1 -Port 5173
```

Then open `http://localhost:5173`. Or just double-click `index.html`.

---

<p align="center">
  <a href="https://kubalmas.github.io/Pact-of-the-Damned/">
    <img src="https://img.shields.io/badge/CLICK_HERE_TO_PLAY-8b0000?style=for-the-badge" alt="Click to Play" height="60">
  </a>
</p>
