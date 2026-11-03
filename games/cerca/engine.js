/* Motor do Cerca (gênero Slitherlink): gera e resolve.
   Funciona no navegador (window.CercaEngine) e no Node.

   Grade de R×C casas; pontos (R+1)×(C+1); cercas (arestas) entre pontos vizinhos.
     horizontais: id = r*C + c            (r = 0..R, c = 0..C-1)
     verticais:   id = HN + r*(C+1) + c   (r = 0..R-1, c = 0..C), HN = (R+1)*C
   Estado de cada cerca: 0 = em aberto, 1 = cerca, 2 = sem cerca (×).
   Pistas: clues[cell] = 0..3, ou -1 (sem número).
   Solução: um único laço fechado, sem cruzar nem tocar a si mesmo; cada número diz
   quantos lados da casa têm cerca. */
(function (root) {
  'use strict';

  const UNK = 0, LINE = 1, CROSS = 2;

  function shuffle(arr, rnd) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /* ---------- Geometria ---------- */
  const GEOM = new Map();
  function geom(R, C) {
    const key = R + 'x' + C;
    if (GEOM.has(key)) return GEOM.get(key);
    const HN = (R + 1) * C, E = HN + R * (C + 1), V = (R + 1) * (C + 1), N = R * C;
    const h = (r, c) => r * C + c, v = (r, c) => HN + r * (C + 1) + c, vx = (r, c) => r * (C + 1) + c;
    const cellEdges = [], vertEdges = Array.from({ length: V }, () => []), edgeVerts = [], edgeCells = [];
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) cellEdges.push([h(r, c), h(r + 1, c), v(r, c), v(r, c + 1)]);
    const OUT = N; // "casa" de fora da grade
    for (let r = 0; r <= R; r++) {
      for (let c = 0; c < C; c++) {
        const e = h(r, c);
        edgeVerts[e] = [vx(r, c), vx(r, c + 1)];
        edgeCells[e] = [r > 0 ? (r - 1) * C + c : OUT, r < R ? r * C + c : OUT];
      }
    }
    for (let r = 0; r < R; r++) {
      for (let c = 0; c <= C; c++) {
        const e = v(r, c);
        edgeVerts[e] = [vx(r, c), vx(r + 1, c)];
        edgeCells[e] = [c > 0 ? r * C + c - 1 : OUT, c < C ? r * C + c : OUT];
      }
    }
    for (let e = 0; e < E; e++) for (const x of edgeVerts[e]) vertEdges[x].push(e);
    const g = { R, C, HN, E, V, N, OUT, cellEdges, vertEdges, edgeVerts, edgeCells, h, v, vx };
    GEOM.set(key, g);
    return g;
  }

  /* ---------- Resolvedor ----------
     Nível 0 (básico): números (conta fechada / só sobra o que falta), pontos (passam 0 ou 2 cercas)
       e laço (não fechar um cercado menor enquanto há cerca fora dele).
     Nível 1 (+ dentro/fora): cada casa está dentro ou fora do cercado; cerca entre duas casas
       = uma dentro e outra fora. Liga casas por essas relações e usa os números nelas.
     Nível 2 (+ hipótese curta): "se esta cerca existisse, os níveis anteriores dariam contradição". */
  class Stop extends Error {}

  function solver(G, clues, level) {
    const { E, V, N, OUT, cellEdges, vertEdges, edgeVerts, edgeCells } = G;
    const clueCells = [];
    for (let i = 0; i < N; i++) if (clues[i] >= 0) clueCells.push(i);

    // Cada regra recebe o estado `s` (Int8Array) e `put(e, val, why)`.
    function ruleCells(s, put) {
      for (const i of clueCells) {
        const k = clues[i];
        let L = 0, U = 0;
        for (const e of cellEdges[i]) { if (s[e] === LINE) L++; else if (s[e] === UNK) U++; }
        if (L > k || L + U < k) throw new Stop('cell');
        if (!U) continue;
        if (L === k) for (const e of cellEdges[i]) { if (s[e] === UNK) put(e, CROSS, { rule: 'cellFull', cell: i }); }
        else if (L + U === k) for (const e of cellEdges[i]) { if (s[e] === UNK) put(e, LINE, { rule: 'cellNeed', cell: i }); }
      }
    }
    function ruleVerts(s, put) {
      for (let x = 0; x < V; x++) {
        let L = 0, U = 0;
        for (const e of vertEdges[x]) { if (s[e] === LINE) L++; else if (s[e] === UNK) U++; }
        if (L > 2 || (L === 1 && U === 0)) throw new Stop('vert');
        if (!U) continue;
        if (L === 2) for (const e of vertEdges[x]) { if (s[e] === UNK) put(e, CROSS, { rule: 'vertFull', vert: x }); }
        else if (L === 1 && U === 1) for (const e of vertEdges[x]) { if (s[e] === UNK) put(e, LINE, { rule: 'vertGo', vert: x }); }
        else if (L === 0 && U === 1) for (const e of vertEdges[x]) { if (s[e] === UNK) put(e, CROSS, { rule: 'vertDead', vert: x }); }
      }
    }
    function ruleLoop(s, put) {
      const p = new Int32Array(V).map((_, i) => i), cnt = new Int32Array(V);
      const find = (a) => { while (p[a] !== a) { p[a] = p[p[a]]; a = p[a]; } return a; };
      let total = 0;
      for (let e = 0; e < E; e++) {
        if (s[e] !== LINE) continue;
        total++;
        const [a, b] = edgeVerts[e];
        const ra = find(a), rb = find(b);
        if (ra === rb) cnt[ra]++;
        else { p[ra] = rb; cnt[rb] += cnt[ra] + 1; }
      }
      // ciclo já fechado com cerca sobrando fora dele: contradição
      const verts = new Int32Array(V);
      for (let x = 0; x < V; x++) { let d = 0; for (const e of vertEdges[x]) if (s[e] === LINE) d++; if (d) verts[find(x)]++; }
      for (let x = 0; x < V; x++) if (find(x) === x && cnt[x] && cnt[x] === verts[x] && cnt[x] < total) throw new Stop('loop');
      for (let e = 0; e < E; e++) {
        if (s[e] !== UNK) continue;
        const [a, b] = edgeVerts[e];
        const r = find(a);
        if (r !== find(b) || !cnt[r]) continue;
        if (cnt[r] < total) { put(e, CROSS, { rule: 'loopEarly', edge: e }); continue; }
        // fecharia o laço inteiro: só vale se todos os números ficarem certos
        let ok = true;
        for (const i of clueCells) {
          let L = 0;
          for (const f of cellEdges[i]) if (s[f] === LINE || f === e) L++;
          if (L !== clues[i]) { ok = false; break; }
        }
        if (!ok) put(e, CROSS, { rule: 'loopWrong', edge: e });
      }
    }
    function ruleColor(s, put) {
      const M = N + 1;
      const p = new Int32Array(M).map((_, i) => i), par = new Int8Array(M);
      const find = (a) => {
        let x = a, acc = 0;
        while (p[x] !== x) { acc ^= par[x]; x = p[x]; }
        // compressão
        let y = a, accY = acc;
        while (p[y] !== y) { const nx = p[y], py = par[y]; p[y] = x; par[y] = accY; accY ^= py; y = nx; }
        return [x, acc];
      };
      const unite = (a, b, d) => {
        const [ra, pa] = find(a), [rb, pb] = find(b);
        if (ra === rb) { if ((pa ^ pb) !== d) throw new Stop('color'); return; }
        p[ra] = rb; par[ra] = pa ^ pb ^ d;
      };
      for (let e = 0; e < E; e++) if (s[e] !== UNK) unite(edgeCells[e][0], edgeCells[e][1], s[e] === LINE ? 1 : 0);
      for (let e = 0; e < E; e++) {
        if (s[e] !== UNK) continue;
        const [ra, pa] = find(edgeCells[e][0]), [rb, pb] = find(edgeCells[e][1]);
        if (ra === rb) put(e, (pa ^ pb) ? LINE : CROSS, { rule: 'color', edge: e });
      }
      // Números: quantas vizinhas são de "lado" diferente.
      for (const i of clueCells) {
        const k = clues[i];
        const [ri, pi] = find(i);
        const groups = new Map(); // raiz → [paridade de cada aresta relativa à raiz]
        let fixed = 0;
        const es = cellEdges[i];
        const info = es.map((e) => {
          const nb = edgeCells[e][0] === i ? edgeCells[e][1] : edgeCells[e][0];
          const [rn, pn] = find(nb);
          if (rn === ri) { if (pn ^ pi) fixed++; return null; }
          if (!groups.has(rn)) groups.set(rn, groups.size);
          return [groups.get(rn), pn ^ pi];
        });
        const G2 = groups.size;
        if (!G2) continue;
        let valid = 0, allOn = (1 << G2) - 1, allOff = (1 << G2) - 1;
        for (let m = 0; m < 1 << G2; m++) {
          let d = fixed;
          for (const it of info) if (it && (((m >> it[0]) & 1) ^ it[1])) d++;
          if (d === k) { valid++; allOn &= m; allOff &= ~m; }
        }
        if (!valid) throw new Stop('colorClue');
        if (!allOn && !allOff) continue;
        // grupo g com relação fixa x (casa i vs raiz do grupo, ajustada): decide as arestas desse grupo
        es.forEach((e, j) => {
          const it = info[j];
          if (!it || s[e] !== UNK) return;
          const [g, pr] = it;
          if (allOn & (1 << g)) put(e, (1 ^ pr) ? LINE : CROSS, { rule: 'colorClue', cell: i });
          else if (allOff & (1 << g)) put(e, pr ? LINE : CROSS, { rule: 'colorClue', cell: i });
        });
      }
    }

    const rules = [ruleCells, ruleVerts, ruleLoop];
    if (level >= 1) rules.push(ruleColor);

    // Aplica as regras até parar. Devolve false se houver contradição.
    function propagate(s, onPut, firstOnly) {
      let changed = true;
      const put = (e, val, why) => {
        if (s[e] === val) return;
        if (s[e] !== UNK) throw new Stop('clash');
        s[e] = val; changed = true;
        if (onPut) onPut(e, val, why);
        if (firstOnly) throw new Stop('first');
      };
      try {
        while (changed) {
          changed = false;
          for (const r of rules) { r(s, put); if (changed) break; }
        }
      } catch (err) {
        if (!(err instanceof Stop)) throw err;
        if (err.message === 'first') return true;
        return false;
      }
      return true;
    }

    // Hipótese curta: testa cercas perto do que já se sabe.
    function trial(s, onPut) {
      const cand = [];
      for (let e = 0; e < E; e++) {
        if (s[e] !== UNK) continue;
        let near = false;
        for (const x of edgeVerts[e]) for (const f of vertEdges[x]) if (s[f] === LINE) near = true;
        for (const c of edgeCells[e]) if (c !== OUT && clues[c] >= 0) near = true;
        if (near) cand.push(e);
      }
      for (const e of cand) {
        for (const val of [LINE, CROSS]) {
          const t = s.slice();
          t[e] = val;
          if (!propagate(t)) {
            s[e] = val === LINE ? CROSS : LINE;
            if (onPut) onPut(e, s[e], { rule: 'trial', edge: e, tried: val });
            return true;
          }
        }
      }
      return false;
    }

    return { propagate, trial };
  }

  function isSolved(G, clues, s) {
    const { E, V, N, cellEdges, vertEdges, edgeVerts } = G;
    for (let e = 0; e < E; e++) if (s[e] === UNK) return false;
    for (let i = 0; i < N; i++) {
      if (clues[i] < 0) continue;
      let L = 0;
      for (const e of cellEdges[i]) if (s[e] === LINE) L++;
      if (L !== clues[i]) return false;
    }
    let start = -1, total = 0;
    for (let x = 0; x < V; x++) {
      let d = 0;
      for (const e of vertEdges[x]) if (s[e] === LINE) d++;
      if (d !== 0 && d !== 2) return false;
      if (d) start = x;
    }
    for (let e = 0; e < E; e++) if (s[e] === LINE) total++;
    if (!total) return false;
    // percorre o laço
    let prev = -1, x = start, steps = 0;
    do {
      const e = vertEdges[x].find((f) => s[f] === LINE && f !== prev);
      if (e == null) return false;
      x = edgeVerts[e][0] === x ? edgeVerts[e][1] : edgeVerts[e][0];
      prev = e; steps++;
    } while (x !== start && steps <= total);
    return steps === total;
  }

  // Resolve só por dedução. Devolve { solved, state, usedLevel }.
  function logicSolve(R, C, clues, level = 2, start = null) {
    const G = geom(R, C);
    const s = start ? Int8Array.from(start) : new Int8Array(G.E);
    const S0 = solver(G, clues, Math.min(level, 1));
    let usedLevel = 0;
    // descobre o nível exigido: resolve com básico, depois com dentro/fora, depois com hipótese
    const SB = solver(G, clues, 0);
    if (!SB.propagate(s)) return { solved: false, state: s, usedLevel };
    if (level >= 1 && !isSolved(G, clues, s)) {
      usedLevel = 1;
      if (!S0.propagate(s)) return { solved: false, state: s, usedLevel };
    }
    if (level >= 2) {
      let guard = 0;
      while (!isSolved(G, clues, s) && guard++ < 400) {
        if (!S0.trial(s)) break;
        usedLevel = 2;
        if (!S0.propagate(s)) return { solved: false, state: s, usedLevel };
      }
    }
    return { solved: isSolved(G, clues, s), state: s, usedLevel };
  }

  // Um passo para a dica: a primeira dedução a partir do estado `s` (não altera `s`).
  function hintStep(R, C, clues, s) {
    const G = geom(R, C);
    for (let level = 0; level <= 1; level++) {
      const t = Int8Array.from(s);
      let got = null;
      const ok = solver(G, clues, level).propagate(t, (e, val, why) => { if (!got) got = { e, val, why }; }, true);
      if (got) return got;
      if (!ok) return null;
    }
    const t = Int8Array.from(s);
    let got = null;
    solver(G, clues, 1).trial(t, (e, val, why) => { got = { e, val, why }; });
    return got;
  }

  /* ---------- Gerador ---------- */
  // Região de casas "dentro" do cercado, crescida ao acaso sem buracos nem pontos de encontro.
  function region(R, C, rnd, frac) {
    const inside = new Uint8Array(R * C);
    const at = (r, c) => (r < 0 || c < 0 || r >= R || c >= C ? 0 : inside[r * C + c]);
    const okLocal = (r, c) => {
      // nenhum quadrado 2×2 em xadrez (dois dentro na diagonal, dois fora)
      for (const [dr, dc] of [[-1, -1], [-1, 0], [0, -1], [0, 0]]) {
        const a = at(r + dr, c + dc), b = at(r + dr, c + dc + 1), x = at(r + dr + 1, c + dc), y = at(r + dr + 1, c + dc + 1);
        if (a === y && b === x && a !== b) return false;
      }
      return true;
    };
    const outsideConnected = () => {
      const W = C + 2, H = R + 2, seen = new Uint8Array(W * H);
      const q = [0]; seen[0] = 1;
      let reach = 0, need = 0;
      for (let i = 0; i < R * C; i++) if (!inside[i]) need++;
      while (q.length) {
        const k = q.pop(), r = Math.floor(k / W) - 1, c = (k % W) - 1;
        if (r >= 0 && c >= 0 && r < R && c < C) reach++;
        for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const rr = r + dr, cc = c + dc;
          if (rr < -1 || cc < -1 || rr > R || cc > C) continue;
          const kk = (rr + 1) * W + cc + 1;
          if (seen[kk] || at(rr, cc)) continue;
          seen[kk] = 1; q.push(kk);
        }
      }
      return reach === need;
    };
    const s0 = Math.floor(rnd() * R * C);
    inside[s0] = 1;
    let size = 1;
    const target = Math.round(R * C * frac);
    let fails = 0;
    while (size < target && fails < 4000) {
      const front = [];
      for (let i = 0; i < R * C; i++) {
        if (inside[i]) continue;
        const r = Math.floor(i / C), c = i % C;
        if (at(r - 1, c) || at(r + 1, c) || at(r, c - 1) || at(r, c + 1)) front.push(i);
      }
      if (!front.length) break;
      const i = front[Math.floor(rnd() * front.length)];
      const r = Math.floor(i / C), c = i % C;
      inside[i] = 1;
      if (!okLocal(r, c) || !outsideConnected()) { inside[i] = 0; fails++; continue; }
      size++;
    }
    return inside;
  }

  function loopFromRegion(G, inside) {
    const s = new Int8Array(G.E);
    for (let e = 0; e < G.E; e++) {
      const [a, b] = G.edgeCells[e];
      const ia = a === G.OUT ? 0 : inside[a], ib = b === G.OUT ? 0 : inside[b];
      s[e] = ia !== ib ? LINE : CROSS;
    }
    return s;
  }

  // level: 0 = só básico; 1 = exige dentro/fora; 2 = exige hipótese curta
  function generate(R, C, rnd = Math.random, level = 1, opts = {}) {
    const G = geom(R, C);
    const tries = opts.tries || 40;
    let best = null;
    for (let t = 0; t < tries; t++) {
      const inside = region(R, C, rnd, 0.42 + rnd() * 0.2);
      const sol = loopFromRegion(G, inside);
      const full = G.cellEdges.map((es) => es.filter((e) => sol[e] === LINE).length);
      let clues = full.slice();
      if (logicSolve(R, C, clues, level).usedLevel > level) continue;
      // tira números enquanto der para resolver no nível pedido
      const keepMin = opts.keep != null ? Math.round(R * C * opts.keep) : 0;
      let shown = R * C;
      for (const i of shuffle([...Array(R * C).keys()], rnd)) {
        if (shown <= keepMin) break;
        const k = clues[i];
        clues[i] = -1;
        if (logicSolve(R, C, clues, level).solved) shown--;
        else clues[i] = k;
      }
      const used = logicSolve(R, C, clues, level).usedLevel;
      const res = { R, C, clues, sol: Array.from(sol), level: used };
      if (used >= level) return res;
      if (!best || used > best.level) best = res;
    }
    return best;
  }

  // Propaga as deduções em `s` (altera `s`). Devolve false se houver contradição.
  const propagateState = (R, C, clues, s, level = 1) => solver(geom(R, C), clues, level).propagate(s);

  const api = { geom, generate, logicSolve, hintStep, isSolved, propagateState, UNK, LINE, CROSS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CercaEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);
