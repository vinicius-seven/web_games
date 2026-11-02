/* Motor do Sudoku: gera grades que se resolvem só com raciocínio (sem chute) e mede a dificuldade
   pela técnica mais avançada necessária. Funciona no navegador (window.SudokuEngine) e no Node. */
(function (root) {
  'use strict';

  const ROW = (i) => Math.floor(i / 9);
  const COL = (i) => i % 9;
  const BOX = (i) => Math.floor(ROW(i) / 3) * 3 + Math.floor(COL(i) / 3);
  const PEERS = Array.from({ length: 81 }, (_, i) => {
    const out = [];
    for (let j = 0; j < 81; j++) {
      if (j !== i && (ROW(j) === ROW(i) || COL(j) === COL(i) || BOX(j) === BOX(i))) out.push(j);
    }
    return out;
  });
  const ROWS = Array.from({ length: 9 }, (_, r) => Array.from({ length: 9 }, (__, c) => r * 9 + c));
  const COLS = Array.from({ length: 9 }, (_, c) => Array.from({ length: 9 }, (__, r) => r * 9 + c));
  const BOXES = Array.from({ length: 9 }, (_, b) => Array.from({ length: 9 }, (__, k) =>
    (Math.floor(b / 3) * 3 + Math.floor(k / 3)) * 9 + (b % 3) * 3 + (k % 3)));
  const UNITS = [...ROWS, ...COLS, ...BOXES];

  const pop = (m) => { let n = 0; for (; m; m &= m - 1) n++; return n; };
  const digitsOf = (m) => { const out = []; for (let d = 1; d <= 9; d++) if (m & (1 << d)) out.push(d); return out; };
  function combos(arr, k, start = 0, acc = [], out = []) {
    if (acc.length === k) { out.push(acc.slice()); return out; }
    for (let i = start; i < arr.length; i++) { acc.push(arr[i]); combos(arr, k, i + 1, acc, out); acc.pop(); }
    return out;
  }
  function shuffle(arr, rnd) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /* ---------- Resolvedor por força bruta (para montar a grade completa) ---------- */
  function bruteSolve(grid, rnd) {
    const g = Int8Array.from(grid);
    const rows = new Int16Array(9), cols = new Int16Array(9), boxes = new Int16Array(9);
    for (let i = 0; i < 81; i++) if (g[i]) { const b = 1 << g[i]; rows[ROW(i)] |= b; cols[COL(i)] |= b; boxes[BOX(i)] |= b; }
    const rec = () => {
      let best = -1, bestMask = 0, bestCount = 10;
      for (let i = 0; i < 81; i++) {
        if (g[i]) continue;
        const m = ~(rows[ROW(i)] | cols[COL(i)] | boxes[BOX(i)]) & 0x3fe;
        const n = pop(m);
        if (!n) return false;
        if (n < bestCount) { best = i; bestMask = m; bestCount = n; }
      }
      if (best < 0) return true;
      const ds = digitsOf(bestMask);
      if (rnd) shuffle(ds, rnd);
      for (const d of ds) {
        const b = 1 << d;
        g[best] = d; rows[ROW(best)] |= b; cols[COL(best)] |= b; boxes[BOX(best)] |= b;
        if (rec()) return true;
        g[best] = 0; rows[ROW(best)] &= ~b; cols[COL(best)] &= ~b; boxes[BOX(best)] &= ~b;
      }
      return false;
    };
    return rec() ? Array.from(g) : null;
  }

  /* ---------- Resolvedor "humano" ----------
     Níveis de técnica:
       1 — casa única (só um número cabe) e número único (só uma casa da linha/coluna/bloco aceita)
       2 — candidatos travados (apontar / reivindicar entre bloco e linha/coluna)
       3 — pares e trios (nus e ocultos)
       4 — X-Wing e Y-Wing
     Devolve { solved, level, values }. Só faz deduções válidas, então se resolve, a solução é única. */
  function logicSolve(puzzle, maxLevel = 4) {
    const vals = Int8Array.from(puzzle);
    const cand = new Uint16Array(81);
    for (let i = 0; i < 81; i++) {
      if (vals[i]) continue;
      let m = 0x3fe;
      for (const p of PEERS[i]) if (vals[p]) m &= ~(1 << vals[p]);
      cand[i] = m;
    }
    let level = 0, broken = false;
    const place = (i, d) => {
      vals[i] = d; cand[i] = 0;
      for (const p of PEERS[i]) cand[p] &= ~(1 << d);
    };
    const eliminate = (i, mask) => { if (cand[i] & mask) { cand[i] &= ~mask; return true; } return false; };

    const singles = () => {
      for (let i = 0; i < 81; i++) {
        if (vals[i]) continue;
        if (!cand[i]) { broken = true; return false; }
        if (pop(cand[i]) === 1) { place(i, digitsOf(cand[i])[0]); return true; }
      }
      for (const u of UNITS) {
        for (let d = 1; d <= 9; d++) {
          const bit = 1 << d;
          let where = -1, count = 0, present = false;
          for (const i of u) {
            if (vals[i] === d) { present = true; break; }
            if (cand[i] & bit) { where = i; count++; }
          }
          if (present) continue;
          if (count === 0) { broken = true; return false; }
          if (count === 1) { place(where, d); return true; }
        }
      }
      return false;
    };

    const locked = () => {
      let changed = false;
      for (let b = 0; b < 9; b++) {
        for (let d = 1; d <= 9; d++) {
          const bit = 1 << d;
          const cells = BOXES[b].filter((i) => cand[i] & bit);
          if (cells.length < 2) continue;
          const r = ROW(cells[0]), c = COL(cells[0]);
          if (cells.every((i) => ROW(i) === r)) for (const i of ROWS[r]) if (BOX(i) !== b) changed = eliminate(i, bit) || changed;
          if (cells.every((i) => COL(i) === c)) for (const i of COLS[c]) if (BOX(i) !== b) changed = eliminate(i, bit) || changed;
        }
      }
      for (const u of [...ROWS, ...COLS]) {
        for (let d = 1; d <= 9; d++) {
          const bit = 1 << d;
          const cells = u.filter((i) => cand[i] & bit);
          if (cells.length < 2) continue;
          const b = BOX(cells[0]);
          if (cells.every((i) => BOX(i) === b)) for (const i of BOXES[b]) if (!u.includes(i)) changed = eliminate(i, bit) || changed;
        }
      }
      return changed;
    };

    const subsets = () => {
      let changed = false;
      for (const u of UNITS) {
        const empty = u.filter((i) => !vals[i]);
        for (const k of [2, 3]) {
          if (empty.length <= k) continue;
          // Nus: k casas que juntas só aceitam k números.
          for (const set of combos(empty, k)) {
            let m = 0; for (const i of set) m |= cand[i];
            if (pop(m) !== k) continue;
            for (const i of empty) if (!set.includes(i)) changed = eliminate(i, m) || changed;
          }
          // Ocultos: k números que só cabem nas mesmas k casas.
          const missing = [];
          for (let d = 1; d <= 9; d++) if (!u.some((i) => vals[i] === d)) missing.push(d);
          for (const ds of combos(missing, k)) {
            const cells = new Set();
            for (const d of ds) for (const i of empty) if (cand[i] & (1 << d)) cells.add(i);
            if (cells.size !== k) continue;
            let keep = 0; for (const d of ds) keep |= 1 << d;
            for (const i of cells) changed = eliminate(i, ~keep & 0x3fe) || changed;
          }
        }
      }
      return changed;
    };

    const wings = () => {
      let changed = false;
      // X-Wing: um número que, em duas linhas, só cabe nas mesmas duas colunas (e vice-versa).
      for (const [A, B, cross] of [[ROWS, COLS, COL], [COLS, ROWS, ROW]]) {
        for (let d = 1; d <= 9; d++) {
          const bit = 1 << d;
          const lines = [];
          A.forEach((u, idx) => {
            const cells = u.filter((i) => cand[i] & bit);
            if (cells.length === 2) lines.push({ idx, pos: cells.map(cross) });
          });
          for (const [p, q] of combos(lines, 2)) {
            if (p.pos[0] !== q.pos[0] || p.pos[1] !== q.pos[1]) continue;
            for (const x of p.pos) {
              for (const i of B[x]) {
                const line = A === ROWS ? ROW(i) : COL(i);
                if (line !== p.idx && line !== q.idx) changed = eliminate(i, bit) || changed;
              }
            }
          }
        }
      }
      // Y-Wing: pivô com {a,b} vê duas pinças {a,c} e {b,c}; quem vê as duas pinças não pode ser c.
      for (let pv = 0; pv < 81; pv++) {
        if (vals[pv] || pop(cand[pv]) !== 2) continue;
        const [a, b] = digitsOf(cand[pv]);
        const pincers = PEERS[pv].filter((i) => !vals[i] && pop(cand[i]) === 2);
        for (const x of pincers) {
          if (!(cand[x] & (1 << a)) || (cand[x] & (1 << b))) continue;
          const c = digitsOf(cand[x] & ~(1 << a))[0];
          for (const y of pincers) {
            if (y === x || cand[y] !== ((1 << b) | (1 << c))) continue;
            const bit = 1 << c;
            for (const i of PEERS[x]) if (i !== y && i !== pv && PEERS[y].includes(i)) changed = eliminate(i, bit) || changed;
          }
        }
      }
      return changed;
    };

    const steps = [[1, singles], [2, locked], [3, subsets], [4, wings]].filter(([l]) => l <= maxLevel);
    for (let guard = 0; guard < 2000; guard++) {
      let progressed = false;
      for (const [l, fn] of steps) {
        if (fn()) { level = Math.max(level, l); progressed = true; break; }
        if (broken) return { solved: false, level, values: Array.from(vals) };
      }
      if (!progressed) break;
    }
    const solved = vals.every((v) => v);
    return { solved, level, values: Array.from(vals) };
  }

  /* ---------- Geração ---------- */
  // tech: técnica máxima permitida; want: técnica que a grade deve exigir; min: mínimo de pistas.
  const LEVELS = {
    facil: { tech: 1, want: 1, min: 36 },
    medio: { tech: 2, want: 2, min: 26 },
    dificil: { tech: 3, want: 3, min: 23 },
    especialista: { tech: 4, want: 4, min: 21 },
  };

  function attempt(cfg, rnd) {
    const solution = bruteSolve(new Array(81).fill(0), rnd);
    const puzzle = solution.slice();
    let count = 81;
    // Tira pares simétricos e depois casas soltas, mantendo a grade resolvível só com lógica.
    const pairs = shuffle([...Array(41).keys()], rnd);
    for (const i of pairs) {
      if (count <= cfg.min) break;
      const j = 80 - i, vi = puzzle[i], vj = puzzle[j];
      puzzle[i] = 0; puzzle[j] = 0;
      if (logicSolve(puzzle, cfg.tech).solved) count -= i === j ? 1 : 2;
      else { puzzle[i] = vi; puzzle[j] = vj; }
    }
    for (const i of shuffle([...Array(81).keys()], rnd)) {
      if (count <= cfg.min) break;
      if (!puzzle[i]) continue;
      const v = puzzle[i];
      puzzle[i] = 0;
      if (logicSolve(puzzle, cfg.tech).solved) count--; else puzzle[i] = v;
    }
    const { level } = logicSolve(puzzle, cfg.tech);
    return { puzzle, solution, level, givens: count };
  }

  function generate(diff, rnd = Math.random, tries = 16) {
    const cfg = LEVELS[diff];
    let best = null;
    for (let t = 0; t < tries; t++) {
      const r = attempt(cfg, rnd);
      if (r.level >= cfg.want) return r;
      if (!best || r.level > best.level || (r.level === best.level && r.givens < best.givens)) best = r;
    }
    return best; // sempre resolvível por lógica; só pode ficar um pouco abaixo da técnica pedida
  }

  const api = { generate, logicSolve, LEVELS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SudokuEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);
