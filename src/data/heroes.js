// 3 selectable heroes with different starting kits.
(function () {
  'use strict';
  // Single hero — uses user-provided GIF animations rendered via drawImage
  G.data.heroes = [
    {
      id: 'hero',
      name: 'The Hunter',
      portrait: '\u{1F987}', // bat
      tagline: 'Hunts what hunts the night.',
      description: 'Bat-blessed vampire hunter. Starts with Bat Swarm and Crimson Aura, pulses BAT BURST every 2s.',
      stats: { hp: 60, speed: 220, pickupRange: 65, baseDamage: 12 },
      startingSkills: ['bat_swarm', 'throwing_daggers'],
      signature: { type: 'bat_burst', name: 'Bat Burst', cooldown: 2.0, count: 8, damage: 18, speed: 280, life: 0.9 },
      color: '#5a3050',
    },
  ];
})();
