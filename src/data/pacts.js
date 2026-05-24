// Pacts — the differentiator. Triggered at the Altar every 120s.
// Legendary skills (used only as Pact of Power rewards).
(function () {
  'use strict';

  G.data.pacts = [
    {
      id: 'pact_of_power',
      name: 'Pact of Power',
      cost: 'Sacrifice ALL skills',
      reward: 'Gain one LEGENDARY skill',
      desc: 'The Old Ones are amused by your hunger. Burn what you have for something singular.',
      kind: 'power',
    },
    {
      id: 'pact_of_brotherhood',
      name: 'Pact of Brotherhood',
      cost: 'Sacrifice half your skills',
      reward: '+1 vampire ally (4 commands)',
      desc: 'A brother rises from blood. Command him with 1-2-3-4.',
      kind: 'brotherhood',
    },
    {
      id: 'pact_of_greed',
      name: 'Pact of Greed',
      cost: 'Sacrifice half your XP',
      reward: '2x XP for the rest of the run',
      desc: 'Hunger feeds hunger. Lose now, drown in essence later.',
      kind: 'greed',
    },
    {
      id: 'pact_of_flesh',
      name: 'Pact of Flesh',
      cost: 'Halve your max HP permanently',
      reward: '+200% damage on everything',
      desc: 'Carve out your softness. What remains will erase legions.',
      kind: 'flesh',
    },
  ];

  G.data.legendary = [
    {
      id: 'blood_moon',
      name: 'Blood Moon',
      icon: '\u{1F315}',
      desc: 'A red moon spins around you. 80 damage, vast radius.',
      effects: () => [{ type: 'orbit_damage', count: 1, damage: 80, radius: 180, speed: 1.4, big: true }],
    },
    {
      id: 'eternal_night',
      name: 'Eternal Night',
      icon: '\u{1F319}',
      desc: 'Constant aura: 60 dps in a huge radius.',
      effects: () => [{ type: 'aura_damage', dps: 60, radius: 240 }],
    },
    {
      id: 'soul_drain',
      name: 'Soul Drain',
      icon: '\u{1F47B}',
      desc: '8% lifesteal. Every kill heals 4 HP.',
      effects: () => [{ type: 'lifesteal', value: 0.08 }, { type: 'on_kill_heal', value: 4 }],
    },
    {
      id: 'crimson_comet',
      name: 'Crimson Comet',
      icon: '\u{2604}',
      desc: 'Bombards random enemies. 120 damage every 0.6s.',
      effects: () => [{ type: 'comet', cooldown: 0.6, damage: 120, radius: 70 }],
    },
    {
      id: 'void_pact',
      name: 'Void Pact',
      icon: '\u{1F300}',
      desc: 'Massive damage and speed, but you take +50% damage.',
      effects: () => [{ type: 'damage_mult', value: 2.0 }, { type: 'speed_mult', value: 1.4 }, { type: 'fragile', value: 1.5 }],
    },
    {
      id: 'nuke',
      name: 'Nuke',
      icon: '\u{2622}',
      desc: 'Every 8s, a screen-wide blast for 400 damage. Sky burns.',
      effects: () => [{ type: 'nuke', cooldown: 8, damage: 400, radius: 700 }],
    },
    {
      id: 'anti_agro',
      name: 'Anti-Agro',
      icon: '\u{1F9E0}',
      desc: 'Every 12s, enemies forget you and tear each other apart for 4s.',
      effects: () => [{ type: 'anti_agro', cooldown: 12, duration: 4 }],
    },
    {
      id: 'laser',
      name: 'Laser (Homelander)',
      icon: '\u{1F576}',
      desc: 'Every 6s, Homelander descends. Eye-lasers sweep 8 directions for 1.5s.',
      effects: () => [{ type: 'laser', cooldown: 6, duration: 1.5, beams: 8, dps: 90, range: 360 }],
    },
  ];
})();
