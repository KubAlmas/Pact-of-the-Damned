// Hero select scene. 3 portraits. Click → run.
(function () {
  'use strict';

  function build() {
    G.ui.clearOverlays();
    const o = document.createElement('div');
    o.className = 'overlay';

    const t = document.createElement('div');
    t.className = 'title-big'; t.style.fontSize = '52px'; t.textContent = 'Choose Your Vessel';
    o.appendChild(t);

    const heroes = document.createElement('div');
    heroes.className = 'heroes';
    for (const h of G.data.heroes) {
      const card = document.createElement('div');
      card.className = 'hero-card';
      const port = document.createElement('div'); port.className = 'hero-portrait';
      port.style.background = 'radial-gradient(circle, ' + h.color + '44, transparent)';
      port.textContent = h.portrait;
      card.appendChild(port);
      const h3 = document.createElement('h3'); h3.textContent = h.name;
      card.appendChild(h3);
      const tag = document.createElement('p'); tag.style.fontStyle = 'italic'; tag.style.color = '#d4af37';
      tag.textContent = h.tagline; card.appendChild(tag);
      const d = document.createElement('p'); d.textContent = h.description; card.appendChild(d);
      const st = document.createElement('div'); st.className = 'stats';
      st.textContent = 'HP ' + h.stats.hp + ' • SPD ' + h.stats.speed + ' • DMG ' + h.stats.baseDamage;
      card.appendChild(st);
      card.addEventListener('click', () => {
        if (G.sfx) G.sfx.play('button_click');
        G.startRun(h.id);
      });
      heroes.appendChild(card);
    }
    o.appendChild(heroes);

    const back = document.createElement('button');
    back.className = 'btn'; back.style.marginTop = '20px'; back.textContent = 'Back';
    back.addEventListener('click', () => { G.nextScene = 'menu'; });
    o.appendChild(back);

    G.ui.root.appendChild(o);
  }

  G.sceneHeroSelect = { build };
})();
