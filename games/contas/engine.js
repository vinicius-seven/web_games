/* Motor da Contas Relâmpago: gera a sequência de contas (igual para todos num duelo).
   Funciona no navegador (window.ContasEngine) e no Node. */
(function (root) {
  'use strict';

  function mulberry32(seed) {
    return () => {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const OPS = { facil: ['+', '−'], normal: ['+', '−', '×'], dificil: ['+', '−', '×', '÷'] };

  // A i-ésima conta: fica mais difícil conforme avança (t vai de 0 a 1 nas primeiras 30 contas).
  function problem(rnd, level, i) {
    const t = Math.min(1, i / 30);
    const big = level === 'dificil' ? 1.6 : level === 'normal' ? 1.2 : 1;
    const r = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
    const ops = OPS[level];
    const op = ops[Math.floor(rnd() * ops.length)];
    let a, b, ans;
    if (op === '+') {
      const hi = Math.round((9 + 50 * t) * big);
      a = r(2, hi); b = r(2, hi); ans = a + b;
    } else if (op === '−') {
      const hi = Math.round((12 + 60 * t) * big);
      a = r(4, hi); b = r(1, a - 1); ans = a - b;
    } else if (op === '×') {
      const hi = level === 'dificil' ? Math.round(6 + 7 * t) : Math.round(5 + 5 * t);
      a = r(2, hi); b = r(2, level === 'dificil' && t > 0.6 ? 15 : 10); ans = a * b;
    } else {
      const hi = Math.round(5 + 7 * t);
      b = r(2, hi); ans = r(2, hi); a = b * ans;
    }
    return { a, b, op, ans };
  }
  // Sequência de N contas a partir de uma semente.
  function sequence(seed, level, N = 200) {
    const rnd = mulberry32(seed);
    return Array.from({ length: N }, (_, i) => problem(rnd, level, i));
  }
  // Pontos de um acerto com `streak` acertos seguidos (contando este).
  const points = (streak) => 10 + (streak >= 6 ? 10 : streak >= 3 ? 5 : 0);

  const api = { sequence, points };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ContasEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);
