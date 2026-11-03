/* Motor do Acampamento: gera e resolve quebra-cabeças de "barracas e árvores".
   Regras: cada árvore tem exatamente uma barraca encostada nela (em cima, embaixo ou dos lados),
   cada barraca pertence a uma árvore só, barracas não se encostam (nem na diagonal) e os números
   dizem quantas barracas há em cada linha e coluna.
   Funciona no navegador (window.AcampamentoEngine) e no Node. */
(function (root) {
  'use strict';

  const TREE = 1, UNK = 0, GRASS = 2, TENT = 3;

  function shuffle(arr, rnd) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  function orth(n, i) {
    const r = Math.floor(i / n), c = i % n, out = [];
    if (r > 0) out.push(i - n);
    if (r < n - 1) out.push(i + n);
    if (c > 0) out.push(i - 1);
    if (c < n - 1) out.push(i + 1);
    return out;
  }
  function around(n, i) {
    const r = Math.floor(i / n), c = i % n, out = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue;
        const rr = r + dr, cc = c + dc;
        if (rr >= 0 && rr < n && cc >= 0 && cc < n) out.push(rr * n + cc);
      }
    }
    return out;
  }
  const touching = (n, a, b) => Math.abs(Math.floor(a / n) - Math.floor(b / n)) <= 1 && Math.abs((a % n) - (b % n)) <= 1;

  /* ---------- Resolvedor "humano" ----------
     Básico (o que se faz de cabeça):
       1 — casa sem árvore ao lado: grama.
       2 — em volta de uma barraca (8 vizinhas): grama.
       3 — linha/coluna com a conta fechada: o resto é grama; casas livres exatamente na conta: barracas.
       4 — árvore com uma única casa possível: a barraca vai ali (e as duas ficam "casadas").
           Barraca com uma única árvore livre ao lado: casadas. Casa cujas árvores vizinhas já estão
           casadas: grama.
     Avançado (o que se faz no papel):
       5 — casa vizinha de todas as opções de uma árvore: qualquer que seja a barraca, ela encosta
           nessa casa, então é grama.
       6 — linha/coluna: testando todas as formas de pôr as barracas que faltam (sem encostar),
           casas que são barraca em todas viram barraca, casas que nunca são viram grama, e casas
           das linhas vizinhas que encostam numa barraca em todas as formas viram grama.
     Recebe o estado inicial opcional (para dicas). Devolve { solved, grid, order, usedAdvanced }. */
  function logicSolve(n, trees, rows, cols, opts = {}) {
    const N = n * n;
    const g = new Array(N).fill(UNK);
    for (const t of trees) g[t] = TREE;
    if (opts.start) opts.start.forEach((v, i) => { if (g[i] !== TREE && (v === TENT || v === GRASS)) g[i] = v; });
    const advanced = opts.advanced !== false;
    const order = [];
    const pairOfTree = new Map(), pairOfTent = new Map();
    let usedAdvanced = false, contradiction = false, changed = true;

    const set = (i, v, adv) => {
      if (g[i] === v) return;
      if (g[i] !== UNK) { contradiction = true; return; }
      g[i] = v; changed = true; order.push(i);
      if (adv) usedAdvanced = true;
    };
    const pair = (tree, tent) => { pairOfTree.set(tree, tent); pairOfTent.set(tent, tree); changed = true; };
    const lineCells = (k, isRow) => Array.from({ length: n }, (_, j) => (isRow ? k * n + j : j * n + k));

    // 1
    for (let i = 0; i < N; i++) if (g[i] === UNK && !orth(n, i).some((j) => g[j] === TREE)) set(i, GRASS);

    const basicPass = () => {
      for (let i = 0; i < N; i++) {
        if (contradiction) return;
        if (g[i] === TENT) for (const j of around(n, i)) { if (g[j] === TENT) contradiction = true; else if (g[j] === UNK) set(j, GRASS); }
      }
      for (let k = 0; k < n; k++) {
        for (const isRow of [true, false]) {
          const cells = lineCells(k, isRow), want = isRow ? rows[k] : cols[k];
          const tents = cells.filter((i) => g[i] === TENT).length, unk = cells.filter((i) => g[i] === UNK);
          if (tents > want || tents + unk.length < want) { contradiction = true; return; }
          if (unk.length && tents === want) unk.forEach((i) => set(i, GRASS));
          else if (unk.length && tents + unk.length === want) unk.forEach((i) => set(i, TENT));
        }
      }
      for (const t of trees) {
        if (pairOfTree.has(t)) continue;
        const cand = orth(n, t).filter((j) => g[j] === UNK || (g[j] === TENT && !pairOfTent.has(j)));
        if (!cand.length) { contradiction = true; return; }
        if (cand.length === 1) { set(cand[0], TENT); pair(t, cand[0]); }
      }
      for (let i = 0; i < N; i++) {
        if (g[i] !== TENT || pairOfTent.has(i)) continue;
        const free = orth(n, i).filter((j) => g[j] === TREE && !pairOfTree.has(j));
        if (!free.length) { contradiction = true; return; }
        if (free.length === 1) pair(free[0], i);
      }
      for (let i = 0; i < N; i++) {
        if (g[i] === UNK && orth(n, i).every((j) => g[j] !== TREE || pairOfTree.has(j))) set(i, GRASS);
      }
    };

    const commonNeighbors = () => {
      for (const t of trees) {
        if (pairOfTree.has(t)) continue;
        const cand = orth(n, t).filter((j) => g[j] === UNK || (g[j] === TENT && !pairOfTent.has(j)));
        if (cand.length < 2) continue;
        for (let i = 0; i < N; i++) {
          if (g[i] !== UNK || cand.includes(i)) continue;
          if (cand.every((c) => touching(n, c, i))) set(i, GRASS, true);
        }
      }
    };

    const lineEnum = () => {
      for (const isRow of [true, false]) {
        for (let k = 0; k < n; k++) {
          const cells = lineCells(k, isRow), want = isRow ? rows[k] : cols[k];
          const need = want - cells.filter((i) => g[i] === TENT).length;
          const unk = cells.filter((i) => g[i] === UNK);
          if (!unk.length || need <= 0 || need === unk.length) continue;
          // posições (índice dentro da linha) das casas livres
          const pos = unk.map((i) => (isRow ? i % n : Math.floor(i / n)));
          const always = new Array(unk.length).fill(true), ever = new Array(unk.length).fill(false);
          // casas das linhas vizinhas: tocadas em todas as formas?
          let touchAll = null, count = 0;
          const pick = [];
          const rec = (s, left) => {
            if (left === 0) {
              count++;
              const chosen = new Set(pick);
              for (let a = 0; a < unk.length; a++) { if (chosen.has(a)) ever[a] = true; else always[a] = false; }
              const touched = new Set();
              for (const a of pick) for (let d = -1; d <= 1; d++) touched.add(pos[a] + d);
              if (touchAll === null) touchAll = touched;
              else for (const p of [...touchAll]) if (!touched.has(p)) touchAll.delete(p);
              return;
            }
            for (let a = s; a <= unk.length - left; a++) {
              if (pick.length && pos[a] - pos[pick[pick.length - 1]] < 2) continue;
              pick.push(a); rec(a + 1, left - 1); pick.pop();
            }
          };
          rec(0, need);
          if (!count) { contradiction = true; return; }
          unk.forEach((i, a) => { if (always[a]) set(i, TENT, true); else if (!ever[a]) set(i, GRASS, true); });
          if (touchAll && touchAll.size) {
            for (const dk of [-1, 1]) {
              const kk = k + dk;
              if (kk < 0 || kk >= n) continue;
              for (const p of touchAll) {
                if (p < 0 || p >= n) continue;
                const i = isRow ? kk * n + p : p * n + kk;
                if (g[i] === UNK) set(i, GRASS, true);
              }
            }
          }
          if (contradiction) return;
        }
      }
    };

    while (changed && !contradiction) {
      changed = false;
      basicPass();
      if (changed || contradiction || !advanced) continue;
      commonNeighbors();
      if (changed || contradiction) continue;
      lineEnum();
    }
    const solved = !contradiction && g.every((v) => v !== UNK);
    return { solved, contradiction, grid: g, order, usedAdvanced };
  }

  /* ---------- Gerador ----------
     Espalha barracas sem encostar, põe uma árvore ao lado de cada uma e confere com o resolvedor:
     só fica a grade que fecha inteira por dedução (o que também garante solução única). */
  function layout(n, rnd) {
    const N = n * n;
    const target = Math.round(N * (n <= 6 ? 0.2 : 0.19));
    for (let attempt = 0; attempt < 200; attempt++) {
      const tents = [];
      const blocked = new Uint8Array(N);
      for (const i of shuffle([...Array(N).keys()], rnd)) {
        if (blocked[i]) continue;
        tents.push(i); blocked[i] = 1;
        for (const j of around(n, i)) blocked[j] = 1;
        if (tents.length === target) break;
      }
      if (tents.length < target) continue;
      const isTent = new Uint8Array(N);
      tents.forEach((t) => { isTent[t] = 1; });
      const taken = new Uint8Array(N), trees = [];
      let ok = true;
      for (const t of shuffle(tents.slice(), rnd)) {
        const opts = orth(n, t).filter((j) => !isTent[j] && !taken[j]);
        if (!opts.length) { ok = false; break; }
        const j = opts[Math.floor(rnd() * opts.length)];
        taken[j] = 1; trees.push(j);
      }
      if (!ok) continue;
      return { tents: tents.sort((a, b) => a - b), trees: trees.sort((a, b) => a - b) };
    }
    return null;
  }

  // level: 'facil' (só deduções básicas), 'medio' (qualquer), 'dificil' (exige deduções avançadas)
  function generate(n, rnd = Math.random, level = 'medio', tries = 4000) {
    let fallback = null;
    for (let t = 0; t < tries; t++) {
      const L = layout(n, rnd);
      if (!L) continue;
      const rows = new Array(n).fill(0), cols = new Array(n).fill(0);
      for (const i of L.tents) { rows[Math.floor(i / n)]++; cols[i % n]++; }
      const basic = logicSolve(n, L.trees, rows, cols, { advanced: false });
      if (basic.solved) {
        if (level === 'dificil') { fallback = fallback || { ...L, rows, cols }; continue; }
        return { n, ...L, rows, cols };
      }
      if (level === 'facil') continue;
      const full = logicSolve(n, L.trees, rows, cols);
      if (full.solved) return { n, ...L, rows, cols };
    }
    if (fallback) return { n, ...fallback };
    throw new Error('não foi possível gerar');
  }

  const api = { generate, logicSolve, layout, orth, around, TREE, UNK, GRASS, TENT };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.AcampamentoEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);
