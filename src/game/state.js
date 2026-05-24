// Per-run state. Reset on each new run.
(function () {
  'use strict';

  function makeRunState(heroId) {
    const hero = G.data.heroes.find(h => h.id === heroId) || G.data.heroes[0];
    const baseHp = hero.stats.hp;
    return {
      heroId,
      hero,
      paused: false,
      pauseReason: null, // 'levelup' | 'altar' | 'menu'
      pendingLevelups: 0,
      runTime: 0,
      kills: 0,

      // Player core stats — mutated by effects
      px: 0, py: 0,
      vx: 0, vy: 0,
      facing: 0,
      hp: baseHp,
      maxHp: baseHp,
      speed: hero.stats.speed,
      baseDamage: hero.stats.baseDamage,
      pickupRange: hero.stats.pickupRange,
      xp: 0,
      level: 1,
      xpToNext: 5,
      xpMult: 1,
      damageMult: 1,
      lifesteal: 0,
      fragile: 1, // multiplier on incoming damage
      shieldReady: false,
      shieldCooldown: 0,
      shieldTimer: 0,
      iframes: 0,

      // Skill levels: id -> current level
      skills: {},
      // Order acquired (for sacrifice order if needed)
      skillOrder: [],

      // Effect-derived runtime systems
      orbits: [],       // {count, damage, radius, speed, big}
      auras: [],        // {dps, radius}
      whip: null,       // {cooldown, damage, range, arc, timer}
      pullEffect: null, // {force, radius, dps}
      shieldPeriod: 0,  // seconds
      burstFire: null,  // {cooldown, damage, count, speed, pierce, timer}
      onHitAoe: null,   // {damage, radius}
      onKillFlame: null,
      onLevelHeal: 0,
      onKillHeal: 0,
      cometCfg: null,
      cometTimer: 0,

      // Boss state machine
      bossPhase: null,         // null | 'warning' | 'fight' | 'victory'
      bossWarningTimer: 0,
      bossIdx: -1,
      bossState: null,
      pendingBossId: null,
      bossBeams: [],           // laser beams fired by boss

      // Homelander instances (Laser legendary)
      homelanders: [],

      // Hero signature AOE (passive from start, survives Pact sacrifice)
      sigCfg: hero.signature || null,
      sigTimer: 0,
      bloodPools: [],   // for Butcher signature + sigil skill
      boneRings: [],    // for Necromancer + frost_nova
      bombs: [],        // for Skull Bombs
      lightningFx: [],  // chain lightning visual

      // New skill timers and configs (set by effects.recompute)
      ravensCfg: null, ravensTimer: 0,
      sigilCfg: null,  sigilTimer: 0, sigils: [],
      chainCfg: null,  chainTimer: 0,
      novaCfg: null,   novaTimer: 0,
      bombCfg: null,   bombTimer: 0,
      yoinkCfg: null,  yoinkTimer: 0,
      holyCfg: null,   holyTimer: 0,
      thornsCfg: null,
      critChance: 0, critMult: 2,
      berserkVal: 0,
      regenVal: 0,
      armorVal: 0,
      killEcho: null,

      // Ally
      allies: [],

      // Pact tracking
      altarTimer: 120,
      pactCounts: { power: 0, brotherhood: 0, greed: 0, flesh: 0, skip: 0 },

      // Boss tracking
      bossesSpawned: 0,

      // Tutorial state (in-world prompts)
      tutPhase: 0,   // 0 = move, 1 = collect, 2 = choose, 3 = done
      tutTimer: 0,
    };
  }

  G.state = { makeRunState };
})();
