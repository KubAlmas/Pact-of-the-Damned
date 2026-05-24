// Wave director: spawn rate and composition over time.
(function () {
  'use strict';

  // Returns { rate (enemies/sec), pool (weighted enemy ids), maxAlive }
  function wave(t) {
    if (t < 30)   return { rate: 6.0,  pool: ['zombie','bat'], weights: [0.7,0.3], maxAlive: 140 };
    if (t < 60)   return { rate: 9.0,  pool: ['zombie','bat','imp'], weights: [0.55,0.30,0.15], maxAlive: 220 };
    if (t < 90)   return { rate: 11.0, pool: ['zombie','bat','imp','knight'], weights: [0.40,0.30,0.20,0.10], maxAlive: 280 };
    if (t < 150)  return { rate: 13.0, pool: ['zombie','bat','imp','skeleton','knight'], weights: [0.30,0.25,0.15,0.15,0.15], maxAlive: 360 };
    if (t < 210)  return { rate: 14.0, pool: ['zombie','bat','ghoul','skeleton','knight','wraith','reaver'], weights: [0.20,0.20,0.13,0.13,0.13,0.13,0.08], maxAlive: 440 };
    if (t < 270)  return { rate: 17.0, pool: ['zombie','bat','ghoul','skeleton','knight','wraith','slime','reaver'], weights: [0.16,0.15,0.13,0.13,0.13,0.13,0.10,0.07], maxAlive: 500 };
    if (t < 330)  return { rate: 20.0, pool: ['zombie','bat','ghoul','knight','wraith','slime','demon','reaver','giant'], weights: [0.13,0.15,0.12,0.13,0.12,0.10,0.10,0.10,0.05], maxAlive: 600 };
    if (t < 420)  return { rate: 24.0, pool: ['zombie','bat','ghoul','knight','wraith','slime','demon','imp','reaver','giant'], weights: [0.10,0.13,0.11,0.12,0.11,0.10,0.10,0.09,0.09,0.05], maxAlive: 750 };
    return            { rate: 28.0, pool: ['zombie','bat','ghoul','knight','wraith','slime','demon','imp','reaver','giant'], weights: [0.08,0.10,0.11,0.12,0.11,0.10,0.13,0.09,0.10,0.06], maxAlive: 900 };
  }

  // Boss spawn schedule: one boss every minute, cycling through 4 types.
  // Spans 30 minutes — plenty for any reasonable run.
  const bossTypes = ['crimsonLord', 'boneTyrant', 'plagueMother', 'voidLord'];
  const bossSchedule = [];
  for (let m = 1; m <= 30; m++) {
    bossSchedule.push({ t: m * 60, id: bossTypes[(m - 1) % bossTypes.length] });
  }
  const bossTimes = bossSchedule.map(b => b.t);

  G.data.waves = { wave, bossTimes, bossSchedule };
})();
