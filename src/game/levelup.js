// Level-up flow. Pauses game, picks 3 random skill choices, applies on select.
(function () {
  'use strict';

  let currentChoices = null;

  function trigger() {
    const s = G.runState;
    if (!s) return;
    const pool = G.effects.getAvailableForLevelUp();
    if (pool.length === 0) {
      // No skills left to acquire — give a fallback heal
      G.player.heal(20);
      s.pendingLevelups = Math.max(0, s.pendingLevelups - 1);
      return;
    }
    // Pick 3 unique
    const shuffled = pool.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    currentChoices = shuffled.slice(0, Math.min(3, shuffled.length));
    s.paused = true;
    s.pauseReason = 'levelup';
    G.ui.showCards(currentChoices, choose);
  }

  function choose(skillObj) {
    const s = G.runState;
    G.effects.addSkill(skillObj.skill.id);
    s.pendingLevelups = Math.max(0, s.pendingLevelups - 1);
    G.ui.hideCards();
    currentChoices = null;
    if (s.pendingLevelups > 0) {
      // chain to next
      trigger();
    } else {
      s.paused = false;
      s.pauseReason = null;
    }
  }

  G.levelup = { trigger, choose };
})();
