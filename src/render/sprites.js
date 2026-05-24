// All entity sprites as 8x8 (heroes/enemies) / 12x12 (boss) / smaller (gems, projectiles) pixel art.
// Each entry in `cache` is an ARRAY of frames (length 1 for static).
(function () {
  'use strict';

  const cache = Object.create(null);
  const meta = Object.create(null); // id -> { fps, frames, w, h }

  // === Helper palettes ===
  const RED_EYE = '#ff3030';
  const YELLOW_EYE = '#fff200';
  const BONE = '#f4e4c1';
  const SHADOW = '#0a0000';

  function set(id, frames, fps) {
    cache[id] = frames;
    meta[id] = { fps: fps || 0, frames: frames.length, w: frames[0].width, h: frames[0].height };
  }

  // === Heroes — pure stick figures, single dark color, 8x8 scale 4 ===
  // Three unique direction silhouettes (front, side, diagonal) used for all 8
  // compass directions (N/S share front; NE/SE share diag; W/NW/SW mirror E/NE/SE).
  const heroDirs = {
    // Front view (used for S and N)
    S: [
      [ // F0 — arms wide stance, legs split (mid-stride)
        '...##...',
        '...##...',
        '.######.',
        '...##...',
        '...##...',
        '...##...',
        '..#..#..',
        '.#....#.',
      ],
      [ // F1 — arms tucked, legs together (push-off)
        '...##...',
        '...##...',
        '..####..',
        '...##...',
        '...##...',
        '...##...',
        '...##...',
        '..#..#..',
      ],
    ],
    // Same shape, used for N
    N: [
      [
        '...##...',
        '...##...',
        '.######.',
        '...##...',
        '...##...',
        '...##...',
        '..#..#..',
        '.#....#.',
      ],
      [
        '...##...',
        '...##...',
        '..####..',
        '...##...',
        '...##...',
        '...##...',
        '...##...',
        '..#..#..',
      ],
    ],
    // Side profile (E). Mirrored at draw time for W.
    E: [
      [
        '...##...',
        '...##...',
        '...####.',
        '...##...',
        '...##...',
        '...##...',
        '..####..',
        '.##.....',
      ],
      [
        '...##...',
        '...##...',
        '...####.',
        '...##...',
        '...##...',
        '...##...',
        '...##...',
        '...####.',
      ],
    ],
    // Diagonal (SE/NE). Mirrored for SW/NW.
    SE: [
      [
        '...##...',
        '...##...',
        '..#####.',
        '...##...',
        '...##...',
        '...##...',
        '..#.#...',
        '.#...##.',
      ],
      [
        '...##...',
        '...##...',
        '..#####.',
        '...##...',
        '...##...',
        '...##...',
        '...##...',
        '..#..##.',
      ],
    ],
    NE: [
      [
        '...##...',
        '...##...',
        '..#####.',
        '...##...',
        '...##...',
        '...##...',
        '..#.#...',
        '.#...##.',
      ],
      [
        '...##...',
        '...##...',
        '..#####.',
        '...##...',
        '...##...',
        '...##...',
        '...##...',
        '..#..##.',
      ],
    ],
  };

  // One color per hero — bright enough to read against the dark gradient.
  const heroPals = {
    stalker:     { '#': '#3a1a4a' }, // dark purple
    butcher:     { '#': '#5a0a10' }, // dark blood-red
    necromancer: { '#': '#1a1a28' }, // near-black ink
    hero:        { '#': '#f4e4c1' }, // bone-cream fallback (high contrast vs background)
  };

  for (const heroId of ['stalker', 'butcher', 'necromancer', 'hero']) {
    for (const dir of ['S', 'N', 'E', 'SE', 'NE']) {
      set('hero_' + heroId + '_' + dir, G.pixelArt.bake(heroDirs[dir], heroPals[heroId], 4), 6);
    }
    // Legacy single-key fallback for UIs that don't use direction
    set('hero_' + heroId, G.pixelArt.bake(heroDirs.S, heroPals[heroId], 4), 6);
  }

  // === Enemies (8x8, scale 4 -> 32px) ===
  // Zombie — shambling green
  const zombiePal = { '#': '#5a7a4a', 'o': '#8aa86a', 'R': RED_EYE, 'k': SHADOW };
  const zombieFrames = [
    [
      '..####..',
      '.#oooo#.',
      '.#R..R#.',
      '.######.',
      '########',
      '.######.',
      '.#....#.',
      '#......#',
    ],
    [
      '..####..',
      '.#oooo#.',
      '.#R..R#.',
      '.######.',
      '#######.',
      '.######.',
      '.#....#.',
      '.#....#.',
    ],
  ];
  set('zombie', G.pixelArt.bake(zombieFrames, zombiePal, 4), 4);

  // Bat — flapping wings
  const batPal = { '#': '#403040', 'o': '#604060', 'R': RED_EYE, 'k': SHADOW };
  const batFrames = [
    [
      '........',
      '#......#',
      '##....##',
      '###oo###',
      '########',
      '.######.',
      '..####..',
      '...##...',
    ],
    [
      '#......#',
      '##....##',
      '###oo###',
      '########',
      '.######.',
      '..####..',
      '...##...',
      '........',
    ],
  ];
  set('bat', G.pixelArt.bake(batFrames, batPal, 4), 7);

  // Ghoul — hunched, two-headed look
  const ghoulPal = { '#': '#8a4060', 'o': '#c06080', 'R': YELLOW_EYE, 'k': SHADOW };
  const ghoulFrames = [
    [
      '#......#',
      '##....##',
      '#oo##oo#',
      '#R####R#',
      '########',
      '.######.',
      '..#..#..',
      '.#....#.',
    ],
    [
      '.#....#.',
      '##....##',
      '#oo##oo#',
      '#R####R#',
      '########',
      '.######.',
      '.#....#.',
      '#......#',
    ],
  ];
  set('ghoul', G.pixelArt.bake(ghoulFrames, ghoulPal, 4), 5);

  // Skeleton — bony, slow, white
  const skelPal = { '#': '#d8d0b8', 'o': '#f4ecd0', 'R': RED_EYE, 'k': SHADOW };
  set('skeleton', G.pixelArt.bake([
    [
      '..####..',
      '.#oooo#.',
      '.#R..R#.',
      '.######.',
      '.#o##o#.',
      '########',
      '.#....#.',
      '#.#..#.#',
    ],
    [
      '..####..',
      '.#oooo#.',
      '.#R..R#.',
      '.######.',
      '.#o##o#.',
      '########',
      '##....##',
      '.#....#.',
    ],
  ], skelPal, 4), 4);

  // Wraith — blue ghost, semi-transparent feel
  const wraithPal = { '#': '#80b8c8', 'o': '#c0e0e8', 'R': '#ffffff' };
  set('wraith', G.pixelArt.bake([
    [
      '..####..',
      '.#oooo#.',
      '#R#oo#R#',
      '#oooooo#',
      '#oooooo#',
      '.######.',
      '.#.##.#.',
      '#.#..#.#',
    ],
    [
      '..####..',
      '.#oooo#.',
      '#R#oo#R#',
      '#oooooo#',
      '#oooooo#',
      '.######.',
      '#.#..#.#',
      '.#.##.#.',
    ],
  ], wraithPal, 4), 6);

  // Slime — round, jiggly green blob
  const slimePal = { '#': '#60c050', 'o': '#90e070', 'R': RED_EYE, 'k': '#205020' };
  set('slime', G.pixelArt.bake([
    [
      '..####..',
      '.#oooo#.',
      '#oooooo#',
      '#R####R#',
      '#oooooo#',
      '#oooooo#',
      '.######.',
      '..####..',
    ],
    [
      '...##...',
      '.######.',
      '#oooooo#',
      '#R#oo#R#',
      '#oooooo#',
      '#oooooo#',
      '########',
      '.######.',
    ],
  ], slimePal, 4), 5);

  // Mini-slime — smaller version, scale 3 instead of 4
  set('miniSlime', G.pixelArt.bake([
    [
      '..####..',
      '.######.',
      '#R####R#',
      '#oooooo#',
      '.######.',
      '..####..',
    ],
    [
      '...##...',
      '.######.',
      '#R#oo#R#',
      '#oooooo#',
      '########',
      '.######.',
    ],
  ], slimePal, 3), 5);

  // Imp — tiny fast orange demon
  const impPal = { '#': '#ff8030', 'o': '#ffb060', 'R': '#fff200', 'k': SHADOW };
  set('imp', G.pixelArt.bake([
    [
      '.#....#.',
      '##....##',
      '.######.',
      '.#R##R#.',
      '.######.',
      '..####..',
      '..#..#..',
      '.#....#.',
    ],
    [
      '##....##',
      '.######.',
      '.######.',
      '.#R##R#.',
      '.######.',
      '..####..',
      '.#....#.',
      '#......#',
    ],
  ], impPal, 3), 8);

  // Demon — mid-tier purple horned brute
  const demonPal = { '#': '#a02080', 'o': '#d050b0', 'R': '#fff200', 'k': SHADOW, 'h': '#3a0030' };
  set('demon', G.pixelArt.bake([
    [
      '.h#hh#h.',
      'hh####hh',
      '#oooooo#',
      '#R####R#',
      '#oooooo#',
      '########',
      '##....##',
      '#......#',
    ],
    [
      '.h#hh#h.',
      'hh####hh',
      '#oooooo#',
      '#R####R#',
      '#oooooo#',
      '########',
      '#......#',
      '##....##',
    ],
  ], demonPal, 5), 4);

  // Knight — armored steel, mid-tier melee
  const knightPal = { '#': '#8c95b0', 'o': '#b8c0d8', 'R': RED_EYE, 'k': '#2a2e3a' };
  set('knight', G.pixelArt.bake([
    [
      '..####..',
      '.#oooo#.',
      '.#kRRk#.',
      '.#kkkk#.',
      '########',
      '.######.',
      '.#.##.#.',
      '#.#..#.#',
    ],
    [
      '..####..',
      '.#oooo#.',
      '.#kRRk#.',
      '.#kkkk#.',
      '########',
      '.######.',
      '##....##',
      '.#.##.#.',
    ],
  ], knightPal, 4), 5);

  // Reaver — shadowy fast assassin
  const reaverPal = { '#': '#503070', 'o': '#7a50a0', 'R': '#ff5050', 'k': '#1a0a28' };
  set('reaver', G.pixelArt.bake([
    [
      '.k....k.',
      'kk####kk',
      '.#RRRR#.',
      '.#oooo#.',
      '.######.',
      '..####..',
      '.#.##.#.',
      '#.#..#.#',
    ],
    [
      '.k....k.',
      '##....##',
      'kk####kk',
      '.#RRRR#.',
      '.######.',
      '..####..',
      '##....##',
      '.#.##.#.',
    ],
  ], reaverPal, 4), 7);

  // Giant — huge brown brute (12x12 scale 5)
  const giantPal = { '#': '#806040', 'o': '#a08060', 'R': '#ff3030', 'k': '#3a2010' };
  set('giant', G.pixelArt.bake([
    [
      '...####.....',
      '..######....',
      '.#oo##oo#...',
      '.#R####R#...',
      '.#oooooo#...',
      '############',
      '.##########.',
      '.##########.',
      '.##.####.##.',
      '..##....##..',
      '.kk......kk.',
      '#............',
    ],
    [
      '...####.....',
      '..######....',
      '.#oo##oo#...',
      '.#R####R#...',
      '.#oooooo#...',
      '############',
      '.##########.',
      '.##########.',
      '.##.####.##.',
      '...##..##...',
      '..kk....kk..',
      '.#..........',
    ],
  ], giantPal, 5), 3);

  // === Boss — Crimson Lord (12x12, scale 6 -> 72px, 2 frames) ===
  const bossPal = { '#': '#c41e3a', 'o': '#ff4060', 'k': '#2a0000', 'R': YELLOW_EYE, 'r': '#600010' };
  const bossFrames = [
    [
      '..k....k....',
      '.kk#k.k.kk#.',
      '.kkkkkkkkkk.',
      '.##########.',
      '.#oR####Ro#.',
      '.##rrrrrr##.',
      '.##########.',
      '############',
      '.##########.',
      '.##.####.##.',
      '.##.####.##.',
      '.k...##...k.',
    ],
    [
      '..k....k....',
      '.kk.k#k#.kk.',
      '.kkkkkkkkkk.',
      '.##########.',
      '.#oR####Ro#.',
      '.##rrrrrr##.',
      '.##########.',
      '############',
      '.##########.',
      '.##.####.##.',
      '.##.####.##.',
      '...k.##.k...',
    ],
  ];
  set('crimsonLord', G.pixelArt.bake(bossFrames, bossPal, 6), 3);

  // Bone Tyrant — huge skeleton, white/yellow eyes
  const boneBossPal = { '#': '#e8e0c0', 'o': '#fff8d8', 'k': '#3a3020', 'R': '#ff3030', 'r': '#604010' };
  set('boneTyrant', G.pixelArt.bake([
    [
      '.k.k..k.k...',
      'kk#k##k##kk.',
      'kk########k.',
      '.##oooooo##.',
      '.#R######R#.',
      '.##rrrrrr##.',
      '.##oooooo##.',
      '############',
      '.##########.',
      '.##.####.##.',
      '.##.####.##.',
      '.k..####..k.',
    ],
    [
      '.k.k..k.k...',
      'kk#k##k##kk.',
      'kk########k.',
      '.##oooooo##.',
      '.#R######R#.',
      '.##rrrrrr##.',
      '.##oooooo##.',
      '############',
      '.##########.',
      '.##.####.##.',
      '.##.####.##.',
      '..k.####.k..',
    ],
  ], boneBossPal, 6), 3);

  // Plague Mother — bloated green slime queen
  const plaguePal = { '#': '#60c050', 'o': '#a0e070', 'k': '#205020', 'R': '#ff80c0', 'r': '#306030' };
  set('plagueMother', G.pixelArt.bake([
    [
      '...####.....',
      '..######....',
      '.########.k.',
      '#oooooooo##.',
      '#oooooooo##.',
      '#R##oo##R##.',
      '#oooooooo##.',
      '############',
      '#oooooooo##.',
      '.##rrrrrr##.',
      '.##########.',
      '..########..',
    ],
    [
      '....##......',
      '..######....',
      '.########...',
      '#oooooooo##.',
      '#oooooooo##.',
      '#R##oo##R##.',
      '#oooooooo##.',
      '############',
      '############',
      '#oorrrrrroo#',
      '.##########.',
      '..########..',
    ],
  ], plaguePal, 6), 4);

  // Void Lord — dark purple horned monstrosity
  const voidPal = { '#': '#6020a0', 'o': '#a050d0', 'k': '#200a30', 'R': '#ffff00', 'r': '#1a0020' };
  set('voidLord', G.pixelArt.bake([
    [
      '.k.k..k.k...',
      'kk#k##k##kk.',
      '############',
      '#oooooooo##.',
      '#R##oooo##R#',
      '##rrrrrrrr##',
      '#oooooooo##.',
      '############',
      '#oooooooo##.',
      '.##oooooo##.',
      '.##########.',
      '.k..####..k.',
    ],
    [
      '.k.k..k.k...',
      'kk#k##k##kk.',
      '############',
      '#oooooooo##.',
      '#R##oooo##R#',
      '##rrrrrrrr##',
      '#oooooooo##.',
      '############',
      '#oooooooo##.',
      '.##oooooo##.',
      '.##########.',
      '..k.####.k..',
    ],
  ], voidPal, 6), 3);

  // === Ally — purple vampire (similar to Necromancer, smaller) ===
  const allyPal = { '#': '#a070c0', 'o': '#d0a0e0', 'R': '#ffff80', 'k': SHADOW };
  const allyFrames = [
    [
      '..####..',
      '.#oooo#.',
      '.#R..R#.',
      '.######.',
      '.######.',
      '.#k##k#.',
      '.#....#.',
      '#......#',
    ],
    [
      '........',
      '..####..',
      '.#oooo#.',
      '.#R..R#.',
      '.######.',
      '.######.',
      '.#k##k#.',
      '#......#',
    ],
  ];
  set('ally', G.pixelArt.bake(allyFrames, allyPal, 4), 5);

  // === Misc tiny sprites ===
  // XP gem — diamond shape (6x6, scale 3 -> 18px)
  const gemPal = { '#': '#ff5080', 'o': '#ffb8c8', 'k': '#5a0a30' };
  set('gem', G.pixelArt.bake([[
    '..##..',
    '.#oo#.',
    '#oooo#',
    '#oooo#',
    '.####.',
    '..##..',
  ]], gemPal, 3), 0);
  set('gemBig', G.pixelArt.bake([[
    '..##..',
    '.#oo#.',
    '#oooo#',
    '#oooo#',
    '.####.',
    '..##..',
  ]], gemPal, 5), 0);

  // Projectile — small bullet (4x4, scale 4 -> 16px)
  const projPal = { '#': '#ffd060', 'o': '#fff8c0' };
  set('projectile', G.pixelArt.bake([[
    '.##.',
    '#oo#',
    '#oo#',
    '.##.',
  ]], projPal, 4), 0);

  // Bat pet (orbit) — small bat
  set('batPet', G.pixelArt.bake([
    ['.#..#.', '######', '.####.', '..##..'],
    ['#....#', '######', '.####.', '..##..'],
  ], { '#': '#7a3da8' }, 4), 6);

  // Raven (homing projectile) — 12x8, flapping wings, 3x scale -> 36x24 px
  const ravenPal = {
    'B': '#0a0008',  // body / outline
    'o': '#1a1018',  // body highlight
    'R': '#ff2020',  // glowing eye
    'W': '#150510',  // wing tip
  };
  const ravenFrames = [
    [ // F0 — wings up (spread high)
      'WW........WW',
      '.WW......WW.',
      '..WBBoooBW..',
      '..BBRBoooBB.',
      '..BoooooooB.',
      '...BoooooB..',
      '....BBBB....',
      '.....BB.....',
    ],
    [ // F1 — wings down (flap)
      '............',
      'WWBBoooBBWWW',
      '.WBBoooooBW.',
      '..BBRBoooBB.',
      '..BoooooooB.',
      '...BoooooB..',
      '....BBBB....',
      '.....BB.....',
    ],
  ];
  set('raven', G.pixelArt.bake(ravenFrames, ravenPal, 3), 10);

  // Boomerang — spinning wooden L-shape (4 frames for rotation)
  const boomPal = { '#': '#a07030', 'o': '#c89050' };
  set('boomerang', G.pixelArt.bake([
    ['..##..', '.####.', '##....', '#.....', '#.....', '......'],
    ['##....', '##....', '##....', '##.##.', '..####', '...###'],
    ['......', '.....#', '.....#', '....##', '.####.', '..##..'],
    ['###...', '####..', '.##.##', '....##', '....##', '....##'],
  ], boomPal, 4), 14);

  // Fireball — pulsing orange ball with halo (3 frames)
  const firePal = { '#': '#ff5020', 'o': '#ffd060', 'w': '#fff0c0' };
  set('fireball', G.pixelArt.bake([
    ['..##..', '.####.', '##oo##', '#owwo#', '.####.', '..##..'],
    ['.####.', '##oo##', '#owwo#', '#owwo#', '##oo##', '.####.'],
    ['..##..', '.####.', '##oo##', '#owwo#', '.####.', '..##..'],
  ], firePal, 4), 8);

  // Banana — yellow curved peel (static)
  const bananaPal = { '#': '#ffd040', 'o': '#fff080', 'k': '#8a6010' };
  set('banana', G.pixelArt.bake([[
    '..##....',
    '.####...',
    '#oo#k...',
    '#oo###..',
    'k##oo#..',
    '.kk#oo#.',
    '..kk##k.',
    '...kkk..',
  ]], bananaPal, 3), 0);

  // Frost lance — long blue spike
  const lancePal = { '#': '#80c8ff', 'o': '#e0f0ff' };
  set('frost_lance', G.pixelArt.bake([[
    '.....#',
    '....##',
    '...##.',
    '..##o.',
    '.##oo.',
    '##oo..',
    '#oo...',
    'oo....',
  ]], lancePal, 3), 0);

  // Homelander — small caped figure with glowing red eyes
  const homePal = {
    '#': '#2050a0',  // blue suit
    'o': '#c00020',  // red cape
    'w': '#f4e4c1',  // skin/face
    'R': '#ff3030',  // glowing eyes
    'L': '#0a0a20',  // boots
  };
  set('homelander', G.pixelArt.bake([[
    '..####..',
    '.wwwwwww',
    '.wR##Rw.',
    'oo####oo',
    'oo####oo',
    '.######.',
    '..#..#..',
    '.LL..LL.',
  ]], homePal, 4), 0);

  // Throwing dagger — sharper, smaller than the sword; pointed up by default
  const daggerPal = { '#': '#d8dce8', 'o': '#ffffff', 'h': '#5a3010', 'k': '#1a1a1a' };
  set('dagger', G.pixelArt.bake([[
    '....o...',
    '....#...',
    '....#...',
    '....#...',
    '....#...',
    '...###..',
    '....h...',
    '....h...',
  ]], daggerPal, 3), 0);

  // Sword (Whirlwind) — vertical blade with crossguard + handle
  const swordPal = { '#': '#d0d8e0', 'o': '#ffffff', 'h': '#8a5020', 'k': '#3a2010' };
  set('sword', G.pixelArt.bake([[
    '...o....',
    '...#....',
    '...#....',
    '...#....',
    '..###...',
    '.h###h..',
    '...h....',
    '...h....',
  ]], swordPal, 3), 0);

  // Shadow bolt — dark purple comet with trail
  const shadowPal = { '#': '#3a0040', 'o': '#a040c0', 'k': '#1a0020' };
  set('shadow_bolt', G.pixelArt.bake([
    ['..##..', '.####.', '##oo##', '##oo##', '.####.', '..##..'],
    ['..oo..', '.####.', '##oo##', '##oo##', '.####.', '..oo..'],
  ], shadowPal, 3), 8);

  // Blood pool (puddle) - for Butcher signature
  const bloodPal = { '#': 'rgba(196,30,58,0.7)', 'o': 'rgba(120,10,20,0.6)' };
  set('bloodPool', G.pixelArt.bake([[
    '.######.',
    '########',
    '##oooo##',
    '#oooooo#',
    '#oooooo#',
    '##oooo##',
    '########',
    '.######.',
  ]], bloodPal, 6), 0);

  function build() {
    // Already built statically when the script ran. Kept for back-compat.
  }

  // Helpers for renderers
  function getFrames(id) { return cache[id]; }
  function getMeta(id) { return meta[id]; }
  function pickFrame(id, animTime) {
    const m = meta[id];
    if (!m || m.frames <= 1 || m.fps <= 0) return cache[id] ? cache[id][0] : null;
    const idx = Math.floor(animTime * m.fps) % m.frames;
    return cache[id][idx];
  }

  G.sprites = { cache, meta, build, getFrames, getMeta, pickFrame };
})();
