/* Motor dos Lampiões (gênero Akari / "Light Up"): gera e resolve.
   Funciona no navegador (window.LampioesEngine) e no Node.

   Grade n×n. walls[i]: -2 = calçada (casa livre), -1 = muro sem número, 0..4 = muro com número.
   Cada lampião ilumina a própria casa e segue em linha reta nas quatro direções até bater num muro.
   Regras: toda calçada iluminada; nenhum lampião ilumina outro; cada número diz quantos lampiões
   encostam (em cima, embaixo, dos lados) naquele muro.
   Estado de cada casa livre: 0 = em aberto, 1 = lampião, 2 = sem lampião (ponto). */
(function (root) {
  'use strict';

  const FREE = -2, WALL = -1;
  const UNK = 0, LAMP = 1, DOT = 2;

  function shuffle(arr, rnd) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Pré-calcula, para cada casa livre, as casas que ela enxerga (sem ela mesma) e os vizinhos.
  function geom(n, walls) {
    const N = n * n;
    const sees = new Array(N), nb = new Array(N);
    for (let i = 0; i < N; i++) {
      const r = Math.floor(i / n), c = i % n;
      nb[i] = [];
      if (r > 0) nb[i].push(i - n);
      if (r < n - 1) nb[i].push(i + n);
      if (c > 0) nb[i].push(i - 1);
      if (c < n - 1) nb[i].push(i + 1);
      if (walls[i] !== FREE) continue;
      const s = [];
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        let rr = r + dr, cc = c + dc;
        while (rr >= 0 && cc >= 0 && rr < n && cc < n && walls[rr * n + cc] === FREE) { s.push(rr * n + cc); rr += dr; cc += dc; }
      }
      sees[i] = s;
    }
    const free = [], numbered = [];
    for (let i = 0; i < N; i++) { if (walls[i] === FREE) free.push(i); else if (walls[i] >= 0) numbered.push(i); }
    return { n, N, walls, sees, nb, free, numbered };
  }

  class Stop extends Error {}

  /* ---------- Resolvedor ----------
     Nível 0: casa iluminada não leva lampião; número com a conta fechada / só sobra o necessário;
              casa escura com um único jeito de ser iluminada.
     Nível 1: + "se pusesse aqui, aquela casa ficaria no escuro" e as combinações de cada número
              (casa iluminada em todas as combinações possíveis não leva lampião).
     Nível 2: + hipótese curta (uma suposição que logo dá contradição). */
  function solver(G, level) {
    const { sees, nb, free, numbered, walls } = G;

    function lit(s) {
      const L = new Uint8Array(G.N);
      for (const i of free) if (s[i] === LAMP) { L[i] = 1; for (const j of sees[i]) L[j] = 1; }
      return L;
    }
    // casa já iluminada agora (lido na hora: as regras mudam o estado no meio da varredura)
    const isLit = (s, i) => s[i] === LAMP || sees[i].some((j) => s[j] === LAMP);
    // candidatos a lampião que iluminariam a casa i (ela mesma ou quem ela enxerga)
    const lighters = (s, i) => [i, ...sees[i]].filter((j) => s[j] === UNK);

    function ruleBasic(s, put) {
      for (const i of free) {
        if (s[i] !== LAMP) continue;
        for (const j of sees[i]) { if (s[j] === LAMP) throw new Stop('see'); if (s[j] === UNK) put(j, DOT, { rule: 'lit', cell: j, by: i }); }
      }
      for (const w of numbered) {
        const k = walls[w];
        let L = 0;
        const U = [];
        for (const j of nb[w]) { if (walls[j] !== FREE) continue; if (s[j] === LAMP) L++; else if (s[j] === UNK) U.push(j); }
        if (L > k || L + U.length < k) throw new Stop('num');
        if (!U.length) continue;
        if (L === k) U.forEach((j) => put(j, DOT, { rule: 'numFull', wall: w }));
        else if (L + U.length === k) U.forEach((j) => put(j, LAMP, { rule: 'numNeed', wall: w }));
      }
      for (const i of free) {
        if (isLit(s, i)) continue;
        const c = lighters(s, i);
        if (!c.length) throw new Stop('dark');
        if (c.length === 1) put(c[0], LAMP, { rule: 'onlyLight', cell: i });
      }
    }

    function ruleShadow(s, put) {
      // Lampião em y deixaria a casa escura x sem nenhuma opção de luz.
      for (const x of free) {
        if (isLit(s, x)) continue;
        const c = lighters(s, x);
        if (c.length < 2) continue;
        const cs = new Set(c);
        for (const y of free) {
          if (s[y] !== UNK || cs.has(y)) continue;
          const sy = new Set(sees[y]);
          if (c.every((z) => sy.has(z))) put(y, DOT, { rule: 'shadow', cell: y, dark: x });
        }
      }
      // Combinações de cada número.
      for (const w of numbered) {
        const k = walls[w];
        let have = 0;
        const U = [];
        for (const j of nb[w]) { if (walls[j] !== FREE) continue; if (s[j] === LAMP) have++; else if (s[j] === UNK) U.push(j); }
        const need = k - have;
        if (need <= 0 || need >= U.length) continue;
        let common = null;
        const always = new Set(U), never = new Set(U);
        for (let m = 0; m < 1 << U.length; m++) {
          const pick = U.filter((_, b) => (m >> b) & 1);
          if (pick.length !== need) continue;
          let ok = true;
          for (let a = 0; a < pick.length && ok; a++) for (let b = a + 1; b < pick.length; b++) if (sees[pick[a]].includes(pick[b])) { ok = false; break; }
          if (!ok) continue;
          const seen = new Set();
          for (const p of pick) for (const j of sees[p]) seen.add(j);
          if (common === null) common = seen;
          else for (const j of [...common]) if (!seen.has(j)) common.delete(j);
          for (const u of U) { if (pick.includes(u)) never.delete(u); else always.delete(u); }
        }
        if (common === null) throw new Stop('numCombo');
        for (const u of always) put(u, LAMP, { rule: 'numCombo', wall: w });
        for (const u of never) put(u, DOT, { rule: 'numCombo', wall: w });
        for (const j of common) if (s[j] === UNK && !U.includes(j)) put(j, DOT, { rule: 'numLight', wall: w, cell: j });
      }
    }

    const rules = [ruleBasic];
    if (level >= 1) rules.push(ruleShadow);

    function propagate(s, onPut, firstOnly) {
      let changed = true;
      const put = (i, val, why) => {
        if (s[i] === val) return;
        if (s[i] !== UNK) throw new Stop('clash');
        s[i] = val; changed = true;
        if (onPut) onPut(i, val, why);
        if (firstOnly) throw new Stop('first');
      };
      try {
        while (changed) {
          changed = false;
          for (const r of rules) { r(s, put); if (changed) break; }
        }
      } catch (err) {
        if (!(err instanceof Stop)) throw err;
        return err.message === 'first';
      }
      return true;
    }

    // Hipótese curta: supõe e segue só as regras simples até achar contradição.
    function trial(s, onPut) {
      const quick = level >= 1 ? solver(G, 0).propagate : propagate;
      const cand = free.filter((i) => s[i] === UNK && !isLit(s, i));
      for (const i of cand) {
        for (const val of [LAMP, DOT]) {
          const t = s.slice();
          t[i] = val;
          if (!quick(t)) {
            s[i] = val === LAMP ? DOT : LAMP;
            if (onPut) onPut(i, s[i], { rule: 'trial', cell: i, tried: val });
            return true;
          }
        }
      }
      return false;
    }
    return { propagate, trial, lit, isLit };
  }

  function isSolved(G, s) {
    const S = solver(G, 0);
    const L = S.lit(s);
    for (const i of G.free) {
      if (!L[i]) return false;
      if (s[i] === LAMP) for (const j of G.sees[i]) if (s[j] === LAMP) return false;
    }
    for (const w of G.numbered) {
      let k = 0;
      for (const j of G.nb[w]) if (G.walls[j] === FREE && s[j] === LAMP) k++;
      if (k !== G.walls[w]) return false;
    }
    return true;
  }
  const decided = (G, s) => G.free.every((i) => s[i] !== UNK);

  function logicSolve(n, walls, level = 2, start = null) {
    const G = geom(n, walls);
    const s = start ? Int8Array.from(start) : new Int8Array(G.N);
    let usedLevel = 0;
    const done = () => isSolved(G, s.map((v) => (v === LAMP ? LAMP : DOT)));
    if (!solver(G, 0).propagate(s)) return { solved: false, state: s, usedLevel };
    if (level >= 1 && !done()) { usedLevel = 1; if (!solver(G, 1).propagate(s)) return { solved: false, state: s, usedLevel }; }
    if (level >= 2) {
      const S1 = solver(G, 1);
      let guard = 0;
      while (!done() && guard++ < 300) {
        if (!S1.trial(s)) break;
        usedLevel = 2;
        if (!S1.propagate(s)) return { solved: false, state: s, usedLevel };
      }
    }
    return { solved: decided(G, s) && done(), state: s, usedLevel };
  }

  function hintStep(n, walls, s) {
    const G = geom(n, walls);
    for (let level = 0; level <= 1; level++) {
      const t = Int8Array.from(s);
      let got = null;
      const ok = solver(G, level).propagate(t, (i, val, why) => { if (!got) got = { i, val, why }; }, true);
      if (got) return got;
      if (!ok) return null;
    }
    const t = Int8Array.from(s);
    let got = null;
    solver(G, 1).trial(t, (i, val, why) => { got = { i, val, why }; });
    return got;
  }

  /* ---------- Gerador ---------- */
  function generate(n, rnd = Math.random, level = 1, opts = {}) {
    const N = n * n;
    let best = null;
    for (let t = 0; t < (opts.tries || 40); t++) {
      // muros simétricos (giro de 180°)
      const walls = new Array(N).fill(FREE);
      const dens = 0.17 + rnd() * 0.08;
      for (let i = 0; i < N; i++) {
        const j = N - 1 - i;
        if (j < i) break;
        if (rnd() < dens) { walls[i] = WALL; walls[j] = WALL; }
      }
      // lampiões: acende casas escuras ao acaso até tudo ficar iluminado
      const s = new Int8Array(N);
      const relight = (G) => {
        const litM = new Uint8Array(N);
        for (const i of G.free) if (s[i] === LAMP) { litM[i] = 1; for (const j of G.sees[i]) litM[j] = 1; }
        for (const i of shuffle(G.free.slice(), rnd)) {
          if (litM[i]) continue;
          s[i] = LAMP; litM[i] = 1;
          for (const j of G.sees[i]) litM[j] = 1;
        }
      };
      let G0 = geom(n, walls);
      relight(G0);
      // Onde o raciocínio empaca (área aberta demais), vira muro: a grade fica fechável.
      const numberAll = () => walls.map((w, i) => (w === FREE ? FREE : G0.nb[i].filter((j) => s[j] === LAMP && walls[j] === FREE).length));
      let full = numberAll();
      for (let fix = 0; fix < 40; fix++) {
        const res = logicSolve(n, full, level);
        if (res.solved) break;
        const stuck = G0.free.filter((i) => res.state[i] === UNK && s[i] !== LAMP);
        if (!stuck.length) break;
        const u = stuck[Math.floor(rnd() * stuck.length)];
        for (const x of [u, N - 1 - u]) if (walls[x] === FREE && s[x] !== LAMP) { walls[x] = WALL; s[x] = UNK; }
        G0 = geom(n, walls);
        relight(G0);
        full = numberAll();
      }
      const lamps = G0.free.filter((i) => s[i] === LAMP);
      const lampSet = new Set(lamps);
      let cur = full.slice();
      if (!logicSolve(n, cur, level).solved) continue;
      const wallIdx = shuffle(walls.map((w, i) => (w === WALL ? i : -1)).filter((i) => i >= 0), rnd);
      for (const i of wallIdx) {
        const k = cur[i];
        cur[i] = WALL;
        if (!logicSolve(n, cur, level).solved) cur[i] = k;
      }
      const res = logicSolve(n, cur, level);
      if (!res.solved) continue;
      // confere que a solução achada é a gerada
      const ok = G0.free.every((i) => (res.state[i] === LAMP) === lampSet.has(i));
      if (!ok) continue;
      const out = { n, walls: cur, lamps, level: res.usedLevel };
      if (res.usedLevel >= level) return out;
      if (!best || res.usedLevel > best.level) best = out;
    }
    return best;
  }

  // Propaga em `s` (altera `s`); false se houver contradição.
  const propagateState = (n, walls, s, level = 1) => solver(geom(n, walls), level).propagate(s);
  const litMap = (n, walls, s) => solver(geom(n, walls), 0).lit(s);

  const api = { geom, generate, logicSolve, hintStep, isSolved, propagateState, litMap, FREE, WALL, UNK, LAMP, DOT };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.LampioesEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);
