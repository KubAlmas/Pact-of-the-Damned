// localStorage save/load. Single key, JSON shape.
(function () {
  'use strict';

  const KEY = 'xakaton.meta.v1';

  const defaults = {
    settings: { sfxVol: 0.6, musicVol: 0.4, shake: true, musicEnabled: true },
    tutorialSeen: false,
    stats: { runs: 0, totalKills: 0, bestTimeSec: 0, bestLevel: 0, favoritePact: null },
    pactCounts: { power: 0, brotherhood: 0, greed: 0, flesh: 0, skip: 0 },
    souls: 0,                  // persistent currency for talent tree
    talents: {},               // skillId -> talent level (0-5)
  };

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return JSON.parse(JSON.stringify(defaults));
      const parsed = JSON.parse(raw);
      // Shallow merge to keep newer defaults
      return Object.assign({}, defaults, parsed, {
        settings: Object.assign({}, defaults.settings, parsed.settings || {}),
        stats: Object.assign({}, defaults.stats, parsed.stats || {}),
        pactCounts: Object.assign({}, defaults.pactCounts, parsed.pactCounts || {}),
      });
    } catch (e) {
      console.warn('Meta load failed, resetting', e);
      return JSON.parse(JSON.stringify(defaults));
    }
  }

  function save(meta) {
    try {
      localStorage.setItem(KEY, JSON.stringify(meta));
    } catch (e) {
      console.warn('Meta save failed', e);
    }
  }

  function recordRun({ timeSec, level, kills, pactCounts }) {
    G.meta.stats.runs += 1;
    G.meta.stats.totalKills += kills;
    if (timeSec > G.meta.stats.bestTimeSec) G.meta.stats.bestTimeSec = timeSec;
    if (level > G.meta.stats.bestLevel) G.meta.stats.bestLevel = level;
    // Award souls: 1 per 5 kills + bonus for time
    const soulsEarned = Math.floor(kills / 5) + Math.floor(timeSec / 30);
    G.meta.souls = (G.meta.souls || 0) + soulsEarned;
    for (const k in pactCounts) {
      G.meta.pactCounts[k] = (G.meta.pactCounts[k] || 0) + pactCounts[k];
    }
    let best = null, max = 0;
    for (const k in G.meta.pactCounts) {
      if (G.meta.pactCounts[k] > max) { max = G.meta.pactCounts[k]; best = k; }
    }
    G.meta.stats.favoritePact = best;
    save(G.meta);
    return soulsEarned;
  }

  // Talent system
  function talentLevel(skillId) {
    return (G.meta.talents && G.meta.talents[skillId]) || 0;
  }
  function talentCost(currentLv) {
    // Geometric cost: 3, 6, 12, 25, 50
    const costs = [3, 6, 12, 25, 50];
    return costs[currentLv] || 9999;
  }
  function upgradeTalent(skillId) {
    const lv = talentLevel(skillId);
    if (lv >= 5) return false;
    const cost = talentCost(lv);
    if ((G.meta.souls || 0) < cost) return false;
    G.meta.souls -= cost;
    G.meta.talents = G.meta.talents || {};
    G.meta.talents[skillId] = lv + 1;
    save(G.meta);
    return true;
  }
  function resetTalents() {
    let refund = 0;
    for (const id in (G.meta.talents || {})) {
      const lv = G.meta.talents[id];
      for (let i = 0; i < lv; i++) refund += talentCost(i);
    }
    G.meta.talents = {};
    G.meta.souls = (G.meta.souls || 0) + refund;
    save(G.meta);
    return refund;
  }

  G.storage = { load, save, recordRun, talentLevel, talentCost, upgradeTalent, resetTalents, KEY };
  // Eager load
  G.meta = load();
})();
