// Level-up cards overlay (DOM, not canvas, for easy clicks).
(function () {
  'use strict';

  let overlay = null;

  function showCards(choices, onPick) {
    hideCards();
    overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.style.zIndex = '20';

    const title = document.createElement('div');
    title.className = 'title-big';
    title.style.fontSize = '52px';
    title.style.color = '#d4af37';
    title.textContent = 'LEVEL UP';
    title.style.animation = 'pulse 1.2s ease-in-out infinite';
    overlay.appendChild(title);

    const sub = document.createElement('div');
    sub.className = 'title-sub';
    sub.textContent = 'CHOOSE A POWER';
    overlay.appendChild(sub);

    const wrap = document.createElement('div');
    wrap.className = 'cards-wrap';

    for (const c of choices) {
      const card = document.createElement('div');
      card.className = 'level-card';
      const icon = document.createElement('div');
      icon.className = 'icon';
      icon.textContent = c.skill.icon || '*';
      const h3 = document.createElement('h3');
      h3.textContent = c.skill.name;
      const lvl = document.createElement('div');
      lvl.className = 'lvl';
      lvl.textContent = c.isNew ? 'NEW SKILL' : ('Level ' + c.nextLevel);
      const desc = document.createElement('div');
      desc.className = 'desc';
      desc.textContent = typeof c.skill.desc === 'function' ? c.skill.desc(c.nextLevel) : c.skill.desc;
      card.appendChild(icon);
      card.appendChild(h3);
      card.appendChild(lvl);
      card.appendChild(desc);
      card.addEventListener('click', () => onPick(c));
      wrap.appendChild(card);
    }
    overlay.appendChild(wrap);
    G.ui.root.appendChild(overlay);
  }

  function hideCards() {
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    overlay = null;
  }

  G.uiCards = { showCards, hideCards };
})();
