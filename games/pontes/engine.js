/* Motor do Pontes (gênero Hashi): gera arquipélagos e resolve só com raciocínio.
   Regras: cada ilha recebe exatamente o número de pontes indicado; pontes só na horizontal ou vertical,
   no máximo 2 entre duas ilhas, sem cruzar; no fim, todas as ilhas ligadas num só grupo.
   Funciona no navegador (window.PontesEngine) e no Node. */
(function (root) {
  'use strict';

  const DIRS = [[0, 1], [1, 0], [0, -1], [-1, 0]];

  // Pares de ilhas que se enxergam (mesma linha/coluna, sem ilha no meio) e quais desses pares se cruzam.
  function buildEdges(n, islands) {
    const at = new Map(islands.map((s, i) => [s.r * n + s.c, i]));
    const edges = [];
    islands.forEach((s, i) => {
      for (const [dr, dc] of [[0, 1], [1, 0]]) {
        let r = s.r + dr, c = s.c + dc;
        while (r < n && c < n && !at.has(r * n + c)) { r += dr; c += dc; }
        if (r < n && c < n) {
          const j = at.get(r * n + c);
          if (Math.abs(r - s.r) + Math.abs(c - s.c) > 1) edges.push({ a: i, b: j, horiz: dr === 0 });
        }
      }
    });
    edges.forEach((e) => {
      const A = islands[e.a], B = islands[e.b];
      e.r1 = Math.min(A.r, B.r); e.r2 = Math.max(A.r, B.r); e.c1 = Math.min(A.c, B.c); e.c2 = Math.max(A.c, B.c);
    });
    const crosses = edges.map(() => []);
    for (let x = 0; x < edges.length; x++) {
      for (let y = x + 1; y < edges.length; y++) {
        const h = edges[x].horiz ? edges[x] : edges[y], v = edges[x].horiz ? edges[y] : edges[x];
        if (h.horiz === v.horiz) continue;
        if (v.r1 < h.r1 && h.r1 < v.r2 && h.c1 < v.c1 && v.c1 < h.c2) { crosses[x].push(y); crosses[y].push(x); }
      }
    }
    const byIsland = islands.map(() => []);
    edges.forEach((e, k) => { byIsland[e.a].push(k); byIsland[e.b].push(k); });
    return { edges, crosses, byIsland };
  }

  /* Resolvedor "humano": trabalha com faixas [mín, máx] de pontes em cada par.
     Deduções: capacidade da ilha (o que falta não cabe nas outras direções), ilha completa,
     limite pelo que falta ao vizinho, pontes que se cruzam e "não isolar um grupo". */
  function logicSolve(n, islands, start = null) {
    const { edges, crosses, byIsland } = buildEdges(n, islands);
    const lo = edges.map((_, k) => (start ? start[k] || 0 : 0));
    const hi = edges.map(() => 2);
    const N = islands.length;
    let broken = false;
    const rem = (i) => islands[i].v - byIsland[i].reduce((s, k) => s + lo[k], 0);

    const group = () => { // grupos ligados por pontes já certas (mín ≥ 1)
      const parent = [...Array(N).keys()];
      const find = (x) => (parent[x] === x ? x : (parent[x] = find(parent[x])));
      edges.forEach((e, k) => { if (lo[k] > 0) parent[find(e.a)] = find(e.b); });
      return find;
    };

    const step = () => {
      let changed = false;
      const set = (k, newLo, newHi) => {
        if (newLo > lo[k]) { lo[k] = newLo; changed = true; }
        if (newHi < hi[k]) { hi[k] = newHi; changed = true; }
        if (lo[k] > hi[k]) broken = true;
      };
      // Pontes que cruzam uma ponte certa não podem existir.
      edges.forEach((_, k) => { if (lo[k] > 0) for (const x of crosses[k]) set(x, lo[x], 0); });
      for (let i = 0; i < N; i++) {
        const r = rem(i);
        if (r < 0) { broken = true; return false; }
        const ks = byIsland[i];
        // Não dá para pôr mais pontes do que falta a cada ponta.
        for (const k of ks) {
          const other = edges[k].a === i ? edges[k].b : edges[k].a;
          set(k, lo[k], Math.min(hi[k], lo[k] + r, lo[k] + Math.max(0, rem(other))));
        }
        // O que falta e não cabe nas outras direções tem de ir por esta.
        const capTotal = ks.reduce((s, k) => s + (hi[k] - lo[k]), 0);
        if (capTotal < r) { broken = true; return false; }
        for (const k of ks) {
          const others = capTotal - (hi[k] - lo[k]);
          if (r - others > 0) set(k, lo[k] + (r - others), hi[k]);
        }
      }
      if (broken) return false;
      // Não isolar: completar um par sem deixar saída fecha um grupo que não é o arquipélago inteiro.
      const find = group();
      const remByGroup = new Map(), sizeByGroup = new Map();
      for (let i = 0; i < N; i++) {
        const g = find(i);
        remByGroup.set(g, (remByGroup.get(g) || 0) + rem(i));
        sizeByGroup.set(g, (sizeByGroup.get(g) || 0) + 1);
      }
      edges.forEach((e, k) => {
        const ga = find(e.a), gb = find(e.b);
        if (ga === gb) return;
        if (sizeByGroup.get(ga) + sizeByGroup.get(gb) === N) return;
        const total = remByGroup.get(ga) + remByGroup.get(gb);
        for (let x = hi[k]; x > lo[k]; x--) {
          if (2 * (x - lo[k]) >= total) set(k, lo[k], x - 1); else break;
        }
      });
      return changed;
    };

    for (let guard = 0; guard < 500 && !broken; guard++) if (!step()) break;
    const solved = !broken && edges.every((_, k) => lo[k] === hi[k]) && islands.every((_, i) => rem(i) === 0) && isConnected(N, edges, lo);
    return { solved, broken, bridges: lo, edges };
  }

  function isConnected(N, edges, counts) {
    if (N <= 1) return true;
    const adj = Array.from({ length: N }, () => []);
    edges.forEach((e, k) => { if (counts[k] > 0) { adj[e.a].push(e.b); adj[e.b].push(e.a); } });
    const seen = new Set([0]); const st = [0];
    while (st.length) { const x = st.pop(); for (const y of adj[x]) if (!seen.has(y)) { seen.add(y); st.push(y); } }
    return seen.size === N;
  }

  // Gera ilhas crescendo uma árvore de pontes a partir de uma ilha, e depois acrescenta algumas pontes extras.
  function attempt(n, target, rnd) {
    const cell = new Array(n * n).fill(0); // 0 mar livre, 1 ilha, 2 ponte
    const islands = [], sol = new Map();
    const key = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`);
    const addIsland = (r, c) => { cell[r * n + c] = 1; islands.push({ r, c, v: 0 }); return islands.length - 1; };
    const nearIsland = (r, c) => DIRS.some(([dr, dc]) => { const rr = r + dr, cc = c + dc; return rr >= 0 && cc >= 0 && rr < n && cc < n && cell[rr * n + cc] === 1; });
    addIsland(Math.floor(rnd() * n), Math.floor(rnd() * n));
    for (let tries = 0; tries < 3000 && islands.length < target; tries++) {
      const a = Math.floor(rnd() * islands.length);
      const [dr, dc] = DIRS[Math.floor(rnd() * 4)];
      const len = 2 + Math.floor(rnd() * Math.max(1, Math.floor(n / 2)));
      const r = islands[a].r + dr * len, c = islands[a].c + dc * len;
      if (r < 0 || c < 0 || r >= n || c >= n || cell[r * n + c] !== 0 || nearIsland(r, c)) continue;
      let free = true;
      for (let s = 1; s < len; s++) if (cell[(islands[a].r + dr * s) * n + islands[a].c + dc * s] !== 0) { free = false; break; }
      if (!free) continue;
      for (let s = 1; s < len; s++) cell[(islands[a].r + dr * s) * n + islands[a].c + dc * s] = 2;
      const b = addIsland(r, c);
      sol.set(key(a, b), rnd() < 0.4 ? 2 : 1);
    }
    if (islands.length < target * 0.8) return null;
    // Pontes extras entre ilhas que já se enxergam com caminho livre (formam ciclos e variam os números).
    const { edges } = buildEdges(n, islands);
    for (const e of edges) {
      if (sol.has(key(e.a, e.b)) || rnd() > 0.3) continue;
      const A = islands[e.a];
      const dr = Math.sign(islands[e.b].r - A.r), dc = Math.sign(islands[e.b].c - A.c);
      let free = true;
      for (let r = A.r + dr, c = A.c + dc; r !== islands[e.b].r || c !== islands[e.b].c; r += dr, c += dc) if (cell[r * n + c] !== 0) { free = false; break; }
      if (!free) continue;
      for (let r = A.r + dr, c = A.c + dc; r !== islands[e.b].r || c !== islands[e.b].c; r += dr, c += dc) cell[r * n + c] = 2;
      sol.set(key(e.a, e.b), rnd() < 0.3 ? 2 : 1);
    }
    for (const [k, v] of sol) { const [a, b] = k.split('-').map(Number); islands[a].v += v; islands[b].v += v; }
    return islands;
  }

  // Tamanho → quantidade de ilhas desejada.
  const TARGET = { 7: 10, 9: 15, 11: 21, 13: 28 };

  function generate(n, rnd = Math.random) {
    for (let t = 0; t < 600; t++) {
      const islands = attempt(n, TARGET[n] || Math.round(n * n / 6), rnd);
      if (!islands) continue;
      const res = logicSolve(n, islands);
      if (res.solved) return { n, islands, edges: res.edges.map((e) => ({ a: e.a, b: e.b })), solution: res.bridges };
    }
    throw new Error('Não foi possível gerar o arquipélago');
  }

  const api = { generate, logicSolve, buildEdges, isConnected };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PontesEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);
