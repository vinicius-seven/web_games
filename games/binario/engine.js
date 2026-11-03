/* Motor do Binário (gênero Takuzu / Binairo): gera e resolve.
   Funciona no navegador (window.BinarioEngine) e no Node.

   Grade n×n (n par). Casa: -1 = vazia, 0 ou 1.
   Regras: nunca três iguais seguidos (na linha ou na coluna); cada linha e cada coluna tem
   metade 0 e metade 1; não há duas linhas iguais nem duas colunas iguais. */
(function (root) {
  'use strict';

  function shuffle(arr, rnd) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // As 2n linhas (n linhas e n colunas), cada uma como lista de índices.
  const LINES = new Map();
  function lines(n) {
    if (LINES.has(n)) return LINES.get(n);
    const out = [];
    for (let r = 0; r < n; r++) out.push({ cells: Array.from({ length: n }, (_, c) => r * n + c), row: true, k: r });
    for (let c = 0; c < n; c++) out.push({ cells: Array.from({ length: n }, (_, r) => r * n + c), row: false, k: c });
    LINES.set(n, out);
    return out;
  }

  class Stop extends Error {}

  /* ---------- Resolvedor ----------
     Nível 0: par (x x → as pontas são o outro), sanduíche (x _ x → o meio é o outro), conta (a linha já tem
              metade de um algarismo → o resto é do outro).
     Nível 1: + todas as formas de completar uma linha (respeitando as regras e sem repetir uma linha pronta):
              casa igual em todas as formas fica decidida.
     Nível 2: + hipótese curta (supõe e segue o nível 0 até dar contradição). */
  function solver(n, level) {
    const L = lines(n), half = n / 2;

    function check(s) {
      for (const { cells } of L) {
        let z = 0, o = 0;
        for (let j = 0; j < n; j++) {
          const v = s[cells[j]];
          if (v === 0) z++; else if (v === 1) o++;
          if (j >= 2 && v >= 0 && v === s[cells[j - 1]] && v === s[cells[j - 2]]) throw new Stop('three');
        }
        if (z > half || o > half) throw new Stop('count');
      }
      // linhas/colunas completas repetidas
      for (const row of [true, false]) {
        const seen = new Set();
        for (const ln of L) {
          if (ln.row !== row) continue;
          const vals = ln.cells.map((i) => s[i]);
          if (vals.some((v) => v < 0)) continue;
          const k = vals.join('');
          if (seen.has(k)) throw new Stop('dup');
          seen.add(k);
        }
      }
    }

    function rule0(s, put) {
      for (const ln of L) {
        const { cells } = ln;
        for (let j = 0; j + 1 < n; j++) {
          const a = s[cells[j]], b = s[cells[j + 1]];
          if (a >= 0 && a === b) {
            if (j > 0 && s[cells[j - 1]] < 0) put(cells[j - 1], 1 - a, { rule: 'pair', line: ln, at: [cells[j], cells[j + 1]] });
            if (j + 2 < n && s[cells[j + 2]] < 0) put(cells[j + 2], 1 - a, { rule: 'pair', line: ln, at: [cells[j], cells[j + 1]] });
          }
        }
        for (let j = 0; j + 2 < n; j++) {
          const a = s[cells[j]], b = s[cells[j + 2]];
          if (a >= 0 && a === b && s[cells[j + 1]] < 0) put(cells[j + 1], 1 - a, { rule: 'sandwich', line: ln, at: [cells[j], cells[j + 2]] });
        }
        let z = 0, o = 0;
        for (const i of cells) { if (s[i] === 0) z++; else if (s[i] === 1) o++; }
        if (z + o < n && (z === half || o === half)) {
          const v = z === half ? 1 : 0;
          for (const i of cells) if (s[i] < 0) put(i, v, { rule: 'count', line: ln, digit: 1 - v });
        }
      }
    }

    function rule1(s, put) {
      for (const ln of L) {
        const { cells } = ln;
        const free = cells.filter((i) => s[i] < 0);
        if (!free.length || free.length > 14) continue;
        let z = 0;
        for (const i of cells) if (s[i] === 0) z++;
        const needZ = half - z;
        // linhas paralelas já completas (não pode repetir)
        const done = new Set();
        for (const o of L) {
          if (o.row !== ln.row || o === ln) continue;
          const vals = o.cells.map((i) => s[i]);
          if (vals.every((v) => v >= 0)) done.add(vals.join(''));
        }
        const always0 = new Array(free.length).fill(true), always1 = new Array(free.length).fill(true);
        let count = 0;
        const vals = cells.map((i) => s[i]);
        const pos = free.map((i) => cells.indexOf(i));
        const F = free.length;
        for (let m = 0; m < 1 << F; m++) {
          // m: bit = 1 → casa recebe 1
          let ones = 0;
          for (let b = 0; b < F; b++) if ((m >> b) & 1) ones++;
          if (F - ones !== needZ) continue;
          for (let b = 0; b < F; b++) vals[pos[b]] = (m >> b) & 1;
          let ok = true;
          for (let j = 2; j < n && ok; j++) if (vals[j] === vals[j - 1] && vals[j] === vals[j - 2]) ok = false;
          if (!ok || done.has(vals.join(''))) continue;
          count++;
          for (let b = 0; b < F; b++) { if ((m >> b) & 1) always0[b] = false; else always1[b] = false; }
        }
        if (!count) throw new Stop('enum');
        for (let b = 0; b < F; b++) {
          if (always0[b]) put(free[b], 0, { rule: 'enum', line: ln });
          else if (always1[b]) put(free[b], 1, { rule: 'enum', line: ln });
        }
      }
    }

    const rules = [rule0];
    if (level >= 1) rules.push(rule1);

    function propagate(s, onPut, firstOnly) {
      let changed = true;
      const put = (i, v, why) => {
        if (s[i] === v) return;
        if (s[i] >= 0) throw new Stop('clash');
        s[i] = v; changed = true;
        if (onPut) onPut(i, v, why);
        if (firstOnly) throw new Stop('first');
      };
      try {
        check(s);
        while (changed) {
          changed = false;
          for (const r of rules) { r(s, put); if (changed) break; }
          check(s);
        }
      } catch (err) {
        if (!(err instanceof Stop)) throw err;
        return err.message === 'first';
      }
      return true;
    }

    function trial(s, onPut) {
      const quick = level >= 1 ? solver(n, 0).propagate : propagate;
      for (let i = 0; i < n * n; i++) {
        if (s[i] >= 0) continue;
        for (const v of [0, 1]) {
          const t = s.slice();
          t[i] = v;
          if (!quick(t)) {
            s[i] = 1 - v;
            if (onPut) onPut(i, s[i], { rule: 'trial', cell: i, tried: v });
            return true;
          }
        }
      }
      return false;
    }
    return { propagate, trial };
  }

  const full = (s) => s.every((v) => v >= 0);

  function logicSolve(n, givens, level = 2) {
    const s = Int8Array.from(givens);
    let usedLevel = 0;
    if (!solver(n, 0).propagate(s)) return { solved: false, state: s, usedLevel };
    if (level >= 1 && !full(s)) { usedLevel = 1; if (!solver(n, 1).propagate(s)) return { solved: false, state: s, usedLevel }; }
    if (level >= 2) {
      const S = solver(n, 1);
      let guard = 0;
      while (!full(s) && guard++ < n * n) {
        if (!S.trial(s)) break;
        usedLevel = 2;
        if (!S.propagate(s)) return { solved: false, state: s, usedLevel };
      }
    }
    return { solved: full(s), state: s, usedLevel };
  }

  function hintStep(n, s) {
    for (let level = 0; level <= 1; level++) {
      const t = Int8Array.from(s);
      let got = null;
      const ok = solver(n, level).propagate(t, (i, v, why) => { if (!got) got = { i, v, why }; }, true);
      if (got) return got;
      if (!ok) return null;
    }
    const t = Int8Array.from(s);
    let got = null;
    solver(n, 1).trial(t, (i, v, why) => { got = { i, v, why }; });
    return got;
  }

  /* ---------- Gerador ---------- */
  function fullGrid(n, rnd) {
    const s = new Int8Array(n * n).fill(-1), half = n / 2;
    const ok = (i) => {
      const r = Math.floor(i / n), c = i % n, v = s[i];
      if (c >= 2 && s[i - 1] === v && s[i - 2] === v) return false;
      if (r >= 2 && s[i - n] === v && s[i - 2 * n] === v) return false;
      let rz = 0, cz = 0;
      for (let k = 0; k <= c; k++) if (s[r * n + k] === v) rz++;
      for (let k = 0; k <= r; k++) if (s[k * n + c] === v) cz++;
      if (rz > half || cz > half) return false;
      if (c === n - 1) {
        const row = s.slice(r * n, r * n + n).join('');
        for (let q = 0; q < r; q++) if (s.slice(q * n, q * n + n).join('') === row) return false;
      }
      if (r === n - 1) {
        const col = Array.from({ length: n }, (_, k) => s[k * n + c]).join('');
        for (let q = 0; q < c; q++) if (Array.from({ length: n }, (_, k) => s[k * n + q]).join('') === col) return false;
      }
      return true;
    };
    let steps = 0;
    const rec = (i) => {
      if (i === n * n) return true;
      if (++steps > 200000) return false;
      for (const v of rnd() < 0.5 ? [0, 1] : [1, 0]) {
        s[i] = v;
        if (ok(i) && rec(i + 1)) return true;
      }
      s[i] = -1;
      return false;
    };
    return rec(0) ? s : null;
  }

  function generate(n, rnd = Math.random, level = 1, opts = {}) {
    let best = null;
    for (let t = 0; t < (opts.tries || 30); t++) {
      const sol = fullGrid(n, rnd);
      if (!sol) continue;
      const g = Array.from(sol);
      for (const i of shuffle([...Array(n * n).keys()], rnd)) {
        const v = g[i];
        g[i] = -1;
        if (!logicSolve(n, g, level).solved) g[i] = v;
      }
      const res = logicSolve(n, g, level);
      const out = { n, givens: g, sol: Array.from(sol), level: res.usedLevel };
      if (res.usedLevel >= level) return out;
      if (!best || res.usedLevel > best.level) best = out;
    }
    return best;
  }

  const propagateState = (n, s, level = 0) => solver(n, level).propagate(s);
  const api = { generate, logicSolve, hintStep, lines, propagateState };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.BinarioEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);
