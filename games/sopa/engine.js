/* Motor da Sopa Relâmpago: sorteia a grade de letras e acha todas as palavras possíveis.
   Funciona no navegador (window.SopaEngine) e no Node.

   As palavras se formam ligando letras vizinhas (inclusive na diagonal), sem repetir a mesma casa.
   A peça "QU" vale as duas letras juntas. Acentos e cedilha não importam. */
(function (root) {
  'use strict';

  const norm = (w) => w.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  // Pesos aproximados das letras no português (Q vira a peça QU; K, W e Y ficam de fora).
  const WEIGHTS = { a: 13.5, e: 12, o: 10, s: 7.5, r: 6.8, i: 6.8, n: 5, d: 4.6, m: 4.5, u: 4.2, t: 5, c: 4.2, l: 3.6, p: 2.8, v: 1.8, g: 1.4, h: 0.5, qu: 1, b: 1.2, f: 1.2, z: 0.6, j: 0.5, x: 0.4 };
  const VOWELS = new Set(['a', 'e', 'i', 'o', 'u']);
  const BAG = Object.entries(WEIGHTS);
  const TOTAL = BAG.reduce((s, [, w]) => s + w, 0);

  let DICT = null;
  function dict(list) {
    if (DICT) return DICT;
    const words = new Map(), prefixes = new Set();
    for (const w of list.split(' ')) {
      const k = norm(w);
      if (k.length < 3 || words.has(k)) continue;
      words.set(k, w);
      for (let i = 1; i < k.length; i++) prefixes.add(k.slice(0, i));
    }
    DICT = { words, prefixes };
    return DICT;
  }

  function neighbors(n) {
    const out = [];
    for (let i = 0; i < n * n; i++) {
      const r = Math.floor(i / n), c = i % n, a = [];
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue;
        const rr = r + dr, cc = c + dc;
        if (rr >= 0 && cc >= 0 && rr < n && cc < n) a.push(rr * n + cc);
      }
      out.push(a);
    }
    return out;
  }

  // Todas as palavras da grade: Map palavra → caminho (índices das casas).
  function findAll(grid, n, D) {
    const nb = neighbors(n), found = new Map(), used = new Uint8Array(n * n), path = [];
    const go = (i, s) => {
      used[i] = 1; path.push(i);
      if (s.length >= 3 && D.words.has(s) && !found.has(s)) found.set(s, path.slice());
      if (D.prefixes.has(s)) for (const j of nb[i]) if (!used[j]) go(j, s + grid[j]);
      used[i] = 0; path.pop();
    };
    for (let i = 0; i < n * n; i++) go(i, grid[i]);
    return found;
  }

  // Um caminho na grade que forma a palavra (para quem digita), ou null.
  function findPath(grid, n, word) {
    const nb = neighbors(n), used = new Uint8Array(n * n), path = [];
    const go = (i, pos) => {
      const t = grid[i];
      if (!word.startsWith(t, pos)) return false;
      used[i] = 1; path.push(i);
      const np = pos + t.length;
      if (np === word.length) return true;
      for (const j of nb[i]) if (!used[j] && go(j, np)) return true;
      used[i] = 0; path.pop();
      return false;
    };
    for (let i = 0; i < n * n; i++) if (go(i, 0)) return path;
    return null;
  }

  function pick(rnd) {
    let x = rnd() * TOTAL;
    for (const [l, w] of BAG) { x -= w; if (x <= 0) return l; }
    return 'e';
  }

  function generate(n, rnd, list, minWords) {
    const D = dict(list);
    let best = null;
    for (let t = 0; t < 400; t++) {
      const grid = Array.from({ length: n * n }, () => pick(rnd));
      const v = grid.filter((l) => VOWELS.has(l)).length;
      if (v < n * n * 0.32 || v > n * n * 0.55) continue;
      if (grid.filter((l) => l === 'qu').length > 1) continue;
      const words = findAll(grid, n, D);
      const long = [...words.keys()].filter((w) => w.length >= 5).length;
      if (!best || words.size > best.words.size) best = { grid, words };
      if (words.size >= minWords && long >= minWords / 6) return { grid, words };
    }
    return best;
  }

  const POINTS = [0, 0, 0, 1, 2, 3, 5, 8];
  const points = (len) => (len >= 8 ? 11 : POINTS[len]);

  const api = { generate, findAll, findPath, dict, norm, points, neighbors };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SopaEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);
