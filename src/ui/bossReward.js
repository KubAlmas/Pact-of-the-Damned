// Boss victory reward overlay: pick 3 skill upgrades OR claim 100 souls.
(function () {
  'use strict';

  let overlay = null;

  function show(onChoose) {
    hide();
    overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.style.zIndex = '40';
    overlay.style.background = 'radial-gradient(ellipse at center, rgba(40,30,5,0.92) 0%, rgba(0,0,0,0.97) 80%)';

    const title = document.createElement('div');
    title.className = 'altar-title';
    title.style.color = '#d4af37';
    title.textContent = 'BOSS SLAIN';
    overlay.appendChild(title);

    const sub = document.createElement('div');
    sub.className = 'altar-sub';
    sub.textContent = 'claim your spoils';
    overlay.appendChild(sub);

    const wrap = document.createElement('div');
    wrap.className = 'pacts-wrap';
    wrap.style.gridTemplateColumns = 'repeat(2, 1fr)';

    const skillCard = card({
      title: 'Triple Power',
      icon: '\u{2728}',
      cost: 'choose 3 of the same level-up cards',
      reward: 'instantly upgrade 3 skills',
      desc: 'Pick three powers in a row. Cards roll independently — chase synergy or hedge.',
    }, () => onChoose('skills'));
    wrap.appendChild(skillCard);

    const soulsCard = card({
      title: 'Soul Harvest',
      icon: '\u{1F480}',
      cost: 'walk away from new power',
      reward: '+100 Soul Shards (for talents)',
      desc: 'Pocket the boss\'s essence. Spend it in the Talent tree from the main menu.',
    }, () => onChoose('souls'));
    wrap.appendChild(soulsCard);

    overlay.appendChild(wrap);
    G.ui.root.appendChild(overlay);
  }

  function card(opts, onClick) {
    const c = document.createElement('div');
    c.className = 'pact-card';
    c.style.borderColor = '#d4af37';
    c.style.background = 'rgba(35,25,5,0.92)';
    const h = document.createElement('h3');
    h.style.color = '#d4af37';
    h.textContent = (opts.icon || '') + ' ' + opts.title;
    const cost = document.createElement('div'); cost.className = 'cost'; cost.textContent = opts.cost;
    const reward = document.createElement('div'); reward.className = 'reward'; reward.textContent = opts.reward;
    const desc = document.createElement('div'); desc.className = 'desc'; desc.textContent = opts.desc;
    c.appendChild(h); c.appendChild(cost); c.appendChild(reward); c.appendChild(desc);
    c.addEventListener('click', () => {
      if (G.sfx) G.sfx.play('button_click');
      onClick();
    });
    return c;
  }

  function hide() {
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    overlay = null;
  }

  G.uiBossReward = { show, hide };
})();
