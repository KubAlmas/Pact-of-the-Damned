// Uniform spatial hash grid. Rebuilt each frame from enemy SoA.
(function () {
  'use strict';

  const CELL = 64;

  function makeHash() {
    const map = new Map(); // key -> array of enemy indices
    function clear() { map.clear(); }
    function key(cx, cy) { return cx * 100000 + cy; }
    function insert(idx, x, y) {
      const cx = Math.floor(x / CELL), cy = Math.floor(y / CELL);
      const k = key(cx, cy);
      let arr = map.get(k);
      if (!arr) { arr = []; map.set(k, arr); }
      arr.push(idx);
    }
    // Iterate enemy indices in a query radius. Calls cb(index) for each.
    function query(x, y, r, cb) {
      const minX = Math.floor((x - r) / CELL);
      const maxX = Math.floor((x + r) / CELL);
      const minY = Math.floor((y - r) / CELL);
      const maxY = Math.floor((y + r) / CELL);
      for (let cy = minY; cy <= maxY; cy++) {
        for (let cx = minX; cx <= maxX; cx++) {
          const arr = map.get(key(cx, cy));
          if (!arr) continue;
          for (let i = 0; i < arr.length; i++) cb(arr[i]);
        }
      }
    }
    return { clear, insert, query, CELL };
  }

  G.spatial = makeHash();
  G.makeHash = makeHash;
})();
