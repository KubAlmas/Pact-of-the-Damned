// Pact altar. Triggers every 120s. Player picks a Pact or skips.
(function () {
  'use strict';

  const INTERVAL = 120;
  let pendingPact = false;

  function tick(dt) {
    const s = G.runState;
    if (!s) return;
    s.altarTimer -= dt;
    if (s.altarTimer <= 0 && !pendingPact) {
      pendingPact = true;
      trigger();
    }
  }

  function trigger() {
    const s = G.runState;
    s.paused = true;
    s.pauseReason = 'altar';
    G.banner.clear();
    G.cam.shake(6, 0.4);
    if (G.sfx) G.sfx.play('altar');
    G.ui.showAltar(G.data.pacts, choose);
  }

  function choose(pactKind) {
    const s = G.runState;
    if (G.sfx) G.sfx.play('pact_' + pactKind);
    if (pactKind === 'skip') {
      s.pactCounts.skip++;
    } else if (pactKind === 'power') {
      // Sacrifice ALL skills, gain one legendary
      sacrificeAll();
      const leg = pickLegendary();
      G.effects.addSkill(leg.id);
      G.banner.show('LEGENDARY: ' + leg.name.toUpperCase(), 3);
      G.cam.shake(18, 0.6);
      G.particles.burst(s.px, s.py, { count: 80, color: '#ffd060', size: 6, speed: 380, life: 1.0 });
      s.pactCounts.power++;
    } else if (pactKind === 'brotherhood') {
      sacrificeHalf();
      G.ally.spawn();
      G.banner.show('A BROTHER RISES (1-2-3-4 to command)', 3);
      s.pactCounts.brotherhood++;
    } else if (pactKind === 'greed') {
      s.xp = Math.floor(s.xp * 0.5);
      s._greedMult = (s._greedMult || 1) * 2;
      G.effects.recompute();
      G.banner.show('GREED: XP DOUBLED', 2);
      s.pactCounts.greed++;
    } else if (pactKind === 'flesh') {
      const newMax = Math.max(20, Math.floor(s.maxHp * 0.5));
      s.maxHp = newMax;
      s.hp = Math.min(s.hp, newMax);
      s._fleshMult = (s._fleshMult || 1) * 3.0; // +200% damage = x3
      G.effects.recompute();
      G.banner.show('FLESH: TRIPLED DAMAGE', 2);
      G.cam.shake(12, 0.4);
      s.pactCounts.flesh++;
    }

    G.ui.hideAltar();
    s.paused = false;
    s.pauseReason = null;
    s.altarTimer = INTERVAL;
    pendingPact = false;
  }

  function sacrificeAll() {
    const s = G.runState;
    const ids = Object.keys(s.skills);
    for (const id of ids) G.effects.removeSkill(id);
    G.particles.burst(s.px, s.py, { count: 40, color: '#ff5050', size: 5, speed: 250, life: 0.9 });
  }

  function sacrificeHalf() {
    const s = G.runState;
    const ids = Object.keys(s.skills);
    // Shuffle + take half
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    const drop = Math.ceil(ids.length / 2);
    for (let i = 0; i < drop; i++) G.effects.removeSkill(ids[i]);
    G.particles.burst(s.px, s.py, { count: 24, color: '#a070c0', size: 4, speed: 200, life: 0.8 });
  }

  function pickLegendary() {
    const owned = G.data.legendary.filter(l => G.runState.skills[l.id]);
    const pool = G.data.legendary.filter(l => !G.runState.skills[l.id]);
    return (pool.length ? pool : G.data.legendary)[Math.floor(Math.random() * (pool.length || G.data.legendary.length))];
  }

  function reset() { pendingPact = false; }

  G.pact = { tick, choose, reset, INTERVAL };
})();
