// Enemy archetypes referenced by spawner.
(function () {
  'use strict';
  G.data.enemies = {
    zombie: {
      hp: 12, speed: 70, damage: 8, radius: 14, xp: 1, color: '#5a7a4a', shape: 'humanoid',
    },
    bat: {
      hp: 6, speed: 150, damage: 5, radius: 10, xp: 1, color: '#403040', shape: 'bat',
    },
    ghoul: {
      hp: 30, speed: 110, damage: 14, radius: 16, xp: 3, color: '#8a4060', shape: 'humanoid',
    },
    // === Mid-tier and special variants ===
    skeleton: {
      hp: 35, speed: 88, damage: 12, radius: 14, xp: 2, color: '#d8d0b8', shape: 'humanoid',
    },
    wraith: {
      hp: 18, speed: 195, damage: 9, radius: 12, xp: 2, color: '#80b8c8', shape: 'wraith',
    },
    slime: {
      hp: 45, speed: 65, damage: 10, radius: 18, xp: 3, color: '#60c050', shape: 'slime',
      onDeath: 'split_slime',
    },
    miniSlime: {
      hp: 12, speed: 105, damage: 6, radius: 9, xp: 1, color: '#80e070', shape: 'slime',
    },
    imp: {
      hp: 6, speed: 230, damage: 4, radius: 8, xp: 1, color: '#ff8030', shape: 'imp',
    },
    demon: {
      hp: 150, speed: 105, damage: 22, radius: 22, xp: 12, color: '#a02080', shape: 'demon',
    },
    // === New high-tier enemies ===
    knight: {
      hp: 80, speed: 80, damage: 18, radius: 16, xp: 4, color: '#a8b0c8', shape: 'humanoid',
    },
    reaver: {
      hp: 50, speed: 215, damage: 16, radius: 12, xp: 4, color: '#604080', shape: 'humanoid',
    },
    giant: {
      hp: 280, speed: 50, damage: 38, radius: 30, xp: 10, color: '#806040', shape: 'giant',
    },

    // Bosses (one per major time gate) — HP boosted, ~60-90s fight target
    crimsonLord: {
      hp: 2500, speed: 70, damage: 30, radius: 36, xp: 100, color: '#c41e3a', shape: 'boss', isBoss: true,
      bannerName: 'THE CRIMSON LORD APPROACHES',
    },
    boneTyrant: {
      hp: 5000, speed: 60, damage: 38, radius: 40, xp: 200, color: '#e8e0c0', shape: 'boss', isBoss: true,
      bannerName: 'BONE TYRANT RISES',
      onDeath: 'split_skeletons',
    },
    plagueMother: {
      hp: 8000, speed: 50, damage: 42, radius: 44, xp: 350, color: '#60c050', shape: 'boss', isBoss: true,
      bannerName: 'THE PLAGUE MOTHER BLOATS',
      onDeath: 'split_slime_swarm',
    },
    voidLord: {
      hp: 15000, speed: 80, damage: 60, radius: 50, xp: 800, color: '#6020a0', shape: 'boss', isBoss: true,
      bannerName: 'THE VOID LORD HUNGERS',
    },
  };
})();
