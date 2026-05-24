// Pact altar overlay. Dramatic UI with skip option.
(function () {
  'use strict';

  let overlay = null;

  function showAltar(pacts, onPick) {
    hideAltar();
    overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.style.zIndex = '25';
    overlay.style.background = 'radial-gradient(ellipse at center, rgba(40,5,5,0.9) 0%, rgba(0,0,0,0.97) 80%)';

    const title = document.createElement('div');
    title.className = 'altar-title';
    title.textContent = 'THE ALTAR';
    overlay.appendChild(title);

    const sub = document.createElement('div');
    sub.className = 'altar-sub';
    sub.textContent = 'choose what to sacrifice — or walk away';
    overlay.appendChild(sub);

    const wrap = document.createElement('div');
    wrap.className = 'pacts-wrap';
    for (const p of pacts) {
      const card = document.createElement('div');
      card.className = 'pact-card';
      const h3 = document.createElement('h3'); h3.textContent = p.name;
      const cost = document.createElement('div'); cost.className = 'cost'; cost.textContent = 'Cost: ' + p.cost;
      const reward = document.createElement('div'); reward.className = 'reward'; reward.textContent = 'Gain: ' + p.reward;
      const desc = document.createElement('div'); desc.className = 'desc'; desc.textContent = p.desc;
      card.appendChild(h3); card.appendChild(cost); card.appendChild(reward); card.appendChild(desc);
      card.addEventListener('click', () => onPick(p.kind));
      wrap.appendChild(card);
    }
    overlay.appendChild(wrap);

    const skip = document.createElement('button');
    skip.className = 'pact-skip';
    skip.textContent = 'Walk Away';
    skip.addEventListener('click', () => onPick('skip'));
    overlay.appendChild(skip);

    G.ui.root.appendChild(overlay);
  }

  function hideAltar() {
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    overlay = null;
  }

  G.uiAltar = { showAltar, hideAltar };
})();
