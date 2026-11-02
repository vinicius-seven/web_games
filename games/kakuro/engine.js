/* Motor do Kakuro: gera grades simétricas e confere que fecham só com raciocínio.
   Grade: n×n; a primeira linha e a primeira coluna são sempre pretas (pistas).
   Funciona no navegador (window.KakuroEngine) e no Node. */
(function (root) {
  'use strict';

  const bits = (m) => { const o = []; for (let d = 1; d <= 9; d++) if (m & (1 << d)) o.push(d); return o; };
  const pop = (m) => { let c = 0; for (; m; m &= m - 1) c++; return c; };
  const ALL = 0x3fe;

  // COMBOS[len][sum] = máscaras de conjuntos de algarismos distintos (1–9) com esse tamanho e soma.
  const COMBOS = Array.from({ length: 10 }, () => Array.from({ length: 46 }, () => []));
  for (let m = 0; m < 1024; m++) {
    if (m & 1) continue;
    const ds = bits(m);
    const s = ds.reduce((a, b) => a + b, 0);
    COMBOS[ds.length][s].push(m);
  }

  function shuffle(a, rnd) {
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  // Sequências (horizontais e verticais) de casas brancas.
  function runsOf(n, white) {
    const runs = [];
    for (const horiz of [true, false]) {
      for (let a = 0; a < n; a++) {
        let cur = [];
        for (let b = 0; b <= n; b++) {
          const i = horiz ? a * n + b : b * n + a;
          if (b < n && white[i]) cur.push(i);
          else {
            if (cur.length) runs.push({ cells: cur, horiz, clue: horiz ? cur[0] - 1 : cur[0] - n });
            cur = [];
          }
        }
      }
    }
    return runs;
  }

  /* ---------- Forma da grade ---------- */
  function layout(n, rnd, density, maxRun = 9) {
    const white = new Array(n * n).fill(false);
    for (let r = 1; r < n; r++) for (let c = 1; c < n; c++) white[r * n + c] = true;
    // Simetria de 180° em volta do centro da área interna.
    const mirror = (r, c) => [n - r, n - c];
    for (let r = 1; r < n; r++) {
      for (let c = 1; c < n; c++) {
        if (rnd() < density) {
          white[r * n + c] = false;
          const [mr, mc] = mirror(r, c);
          white[mr * n + mc] = false;
        }
      }
    }
    // Sem sequências de 1 casa e sem sequências maiores que 9.
    for (let guard = 0; guard < 200; guard++) {
      let changed = false;
      for (let r = 1; r < n; r++) {
        for (let c = 1; c < n; c++) {
          const i = r * n + c;
          if (!white[i]) continue;
          const h = (white[i - 1] ? 1 : 0) + (c + 1 < n && white[i + 1] ? 1 : 0);
          const v = (white[i - n] ? 1 : 0) + (r + 1 < n && white[i + n] ? 1 : 0);
          if (h === 0 || v === 0) {
            white[i] = false;
            const [mr, mc] = mirror(r, c);
            white[mr * n + mc] = false;
            changed = true;
          }
        }
      }
      for (const run of runsOf(n, white)) {
        if (run.cells.length > maxRun) {
          const i = run.cells[Math.floor(run.cells.length / 2)];
          const r = Math.floor(i / n), c = i % n;
          white[i] = false;
          const [mr, mc] = mirror(r, c);
          white[mr * n + mc] = false;
          changed = true;
        }
      }
      if (!changed) break;
    }
    // Casas brancas precisam formar um bloco só.
    const whites = white.map((w, i) => (w ? i : -1)).filter((i) => i >= 0);
    if (whites.length < (n - 1) * (n - 1) * 0.4) return null;
    const seen = new Set([whites[0]]), st = [whites[0]];
    while (st.length) {
      const i = st.pop();
      for (const j of [i - 1, i + 1, i - n, i + n]) if (j >= 0 && j < n * n && white[j] && !seen.has(j) && (Math.abs((j % n) - (i % n)) <= 1)) { seen.add(j); st.push(j); }
    }
    if (seen.size !== whites.length) return null;
    return white;
  }

  /* ---------- Preenchimento com algarismos ---------- */
  function fill(n, white, runs, rnd) {
    // Cada sequência tende a algarismos baixos, altos ou neutros: somas extremas têm uma combinação só,
    // e é delas que o raciocínio começa.
    const bias = runs.map(() => { const x = rnd(); return x < 0.4 ? -1 : x < 0.8 ? 1 : 0; });
    const runOf = new Map();
    runs.forEach((r, k) => r.cells.forEach((i) => { if (!runOf.has(i)) runOf.set(i, []); runOf.get(i).push(k); }));
    const val = new Array(n * n).fill(0);
    const used = runs.map(() => 0);
    const cells = white.map((w, i) => (w ? i : -1)).filter((i) => i >= 0);
    let steps = 0;
    const rec = (idx) => {
      if (++steps > 200000) return false;
      if (idx === cells.length) return true;
      // Casa mais restrita primeiro.
      let best = idx, bestCnt = 10;
      for (let k = idx; k < cells.length; k++) {
        const i = cells[k];
        let m = ALL; for (const r of runOf.get(i)) m &= ~used[r];
        const c = pop(m);
        if (c < bestCnt) { best = k; bestCnt = c; if (c <= 1) break; }
      }
      [cells[idx], cells[best]] = [cells[best], cells[idx]];
      const i = cells[idx];
      let m = ALL; for (const r of runOf.get(i)) m &= ~used[r];
      const pref = runOf.get(i).reduce((a, r) => a + bias[r], 0);
      const ds = bits(m).map((d) => [d, pref * (d - 5) + (rnd() - 0.5) * 3]).sort((a, b) => b[1] - a[1]).map((x) => x[0]);
      for (const d of ds) {
        val[i] = d;
        for (const r of runOf.get(i)) used[r] |= 1 << d;
        if (rec(idx + 1)) return true;
        for (const r of runOf.get(i)) used[r] &= ~(1 << d);
      }
      val[i] = 0;
      [cells[idx], cells[best]] = [cells[best], cells[idx]];
      return false;
    };
    return rec(0) ? val : null;
  }

  /* ---------- Resolvedor "humano" ----------
     Para cada soma: quais combinações de algarismos ainda cabem, considerando o que cada casa aceita;
     a casa só fica com os algarismos que aparecem em alguma distribuição válida da sequência.
     Algarismo resolvido sai das outras casas das suas duas sequências. Devolve { solved, grid }. */
  function logicSolve(n, runs, start = null) {
    const cand = new Array(n * n).fill(0);
    const runOf = new Map();
    runs.forEach((r, k) => r.cells.forEach((i) => { cand[i] = ALL; if (!runOf.has(i)) runOf.set(i, []); runOf.get(i).push(k); }));
    if (start) start.forEach((d, i) => { if (d) cand[i] = 1 << d; });
    let broken = false;

    const runPass = (run) => {
      const cs = run.cells;
      const possible = cs.map(() => 0);
      for (const combo of COMBOS[cs.length][run.sum] || []) {
        if (cs.some((i) => !(cand[i] & combo))) continue;
        // Atalho: se todas as casas aceitam todos os algarismos do conjunto, qualquer um serve em qualquer casa.
        if (cs.every((i) => (cand[i] & combo) === combo)) { cs.forEach((_, p) => { possible[p] |= combo; }); continue; }
        // Distribuições do conjunto pelas casas (busca com poda; para quando já não há o que descobrir).
        const assign = new Array(cs.length).fill(0);
        const found = cs.map(() => 0);
        const target = cs.map((i) => cand[i] & combo);
        let complete = false;
        const order = cs.map((_, k) => k).sort((a, b) => pop(cand[cs[a]] & combo) - pop(cand[cs[b]] & combo));
        const rec = (k, left) => {
          if (complete) return;
          if (k === order.length) {
            order.forEach((p) => { found[p] |= 1 << assign[p]; });
            complete = found.every((f, p) => f === target[p]);
            return;
          }
          const p = order[k];
          for (const d of bits(cand[cs[p]] & left)) { assign[p] = d; rec(k + 1, left & ~(1 << d)); if (complete) return; }
        };
        rec(0, combo);
        found.forEach((f, p) => { possible[p] |= f; });
      }
      let changed = false;
      cs.forEach((i, p) => {
        const nc = cand[i] & possible[p];
        if (!nc) broken = true;
        if (nc !== cand[i]) { cand[i] = nc; changed = true; }
      });
      return changed;
    };

    for (let guard = 0; guard < 400 && !broken; guard++) {
      let changed = false;
      for (const run of runs) if (runPass(run)) changed = true;
      if (!changed) break;
    }
    const solved = !broken && cand.every((m) => m === 0 || pop(m) === 1);
    return { solved, grid: cand.map((m) => (m && pop(m) === 1 ? bits(m)[0] : 0)) };
  }

  const SIZES = { 6: 0.18, 8: 0.22, 10: 0.25, 12: 0.27 };

  /* Busca local: troca o algarismo de uma casa ainda não deduzida (muda as somas das suas duas sequências)
     e mantém a troca se o resolvedor passar a deduzir pelo menos o mesmo número de casas. */
  function improve(n, white, runs, val, rnd, maxIt) {
    const runOf = new Map();
    runs.forEach((r, k) => r.cells.forEach((i) => { if (!runOf.has(i)) runOf.set(i, []); runOf.get(i).push(k); }));
    const setSums = () => runs.forEach((r) => { r.sum = r.cells.reduce((s, i) => s + val[i], 0); });
    const score = () => { const res = logicSolve(n, runs); return { res, open: res.grid.filter((d, i) => white[i] && !d).length }; };
    setSums();
    let cur = score();
    for (let it = 0; it < maxIt && cur.open > 0; it++) {
      const open = [];
      cur.res.grid.forEach((d, i) => { if (white[i] && !d) open.push(i); });
      const i = open[Math.floor(rnd() * open.length)];
      let used = 0;
      for (const k of runOf.get(i)) for (const j of runs[k].cells) if (j !== i) used |= 1 << val[j];
      const opts = bits(ALL & ~used).filter((d) => d !== val[i]);
      if (!opts.length) continue;
      const old = val[i];
      val[i] = opts[Math.floor(rnd() * opts.length)];
      setSums();
      const next = score();
      if (next.open <= cur.open) cur = next;
      else { val[i] = old; setSums(); }
    }
    return cur.open === 0;
  }

  function generate(n, rnd = Math.random, tries = 300, itPerCell = 60) {
    for (let t = 0; t < tries; t++) {
      // Nos tamanhos grandes, sequências de até 7 casas: mais variedade de formas e geração bem mais rápida.
      const white = layout(n, rnd, SIZES[n] || 0.25, n >= 10 ? 7 : 9);
      if (!white) continue;
      const runs = runsOf(n, white);
      const val = fill(n, white, runs, rnd);
      if (!val) continue;
      if (!improve(n, white, runs, val, rnd, itPerCell * n)) continue;
      const res = logicSolve(n, runs);
      if (res.solved && res.grid.every((d, i) => d === val[i])) {
        return { n, white, solution: val, runs: runs.map((r) => ({ cells: r.cells, horiz: r.horiz, clue: r.clue, sum: r.sum })) };
      }
    }
    throw new Error('Não foi possível gerar a grade');
  }

  const api = { generate, logicSolve, runsOf, COMBOS, bits };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.KakuroEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);
