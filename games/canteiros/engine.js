/* Motor do Canteiros: gera e resolve quebra-cabeças do gênero "Star Battle" (1 por linha/coluna/região,
   sem vizinhos encostados, nem na diagonal). Funciona no navegador (window.CanteirosEngine) e no Node. */
(function (root) {
  'use strict';

  function shuffle(arr, rnd) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Resolve linha a linha. Devolve até `limit` soluções (cada uma: coluna da flor em cada linha).
  function solve(n, regions, limit = 2) {
    const out = [];
    const cols = new Array(n).fill(-1);
    let usedCols = 0, usedRegs = 0;
    const rec = (r) => {
      if (out.length >= limit) return;
      if (r === n) { out.push(cols.slice()); return; }
      for (let c = 0; c < n; c++) {
        if (usedCols & (1 << c)) continue;
        const reg = regions[r * n + c];
        if (usedRegs & (1 << reg)) continue;
        if (r > 0 && Math.abs(cols[r - 1] - c) <= 1) continue;
        cols[r] = c; usedCols |= 1 << c; usedRegs |= 1 << reg;
        rec(r + 1);
        usedCols &= ~(1 << c); usedRegs &= ~(1 << reg);
        if (out.length >= limit) return;
      }
    };
    rec(0);
    return out;
  }

  // Uma flor por linha e coluna, sem duas encostadas (linhas vizinhas não podem ter colunas vizinhas).
  function randomPlacement(n, rnd) {
    const cols = [];
    const used = new Set();
    const rec = (r) => {
      if (r === n) return true;
      for (const c of shuffle([...Array(n).keys()], rnd)) {
        if (used.has(c) || (r > 0 && Math.abs(cols[r - 1] - c) <= 1)) continue;
        cols.push(c); used.add(c);
        if (rec(r + 1)) return true;
        cols.pop(); used.delete(c);
      }
      return false;
    };
    rec(0);
    return cols;
  }

  const neighbors4 = (n, i) => {
    const r = Math.floor(i / n), c = i % n, out = [];
    if (r > 0) out.push(i - n);
    if (r < n - 1) out.push(i + n);
    if (c > 0) out.push(i - 1);
    if (c < n - 1) out.push(i + 1);
    return out;
  };

  // Regiões crescem a partir de cada flor, uma casa por vez, em ordem aleatória.
  function growRegions(n, seeds, rnd) {
    const regions = new Array(n * n).fill(-1);
    seeds.forEach((cell, k) => { regions[cell] = k; });
    let left = n * n - n;
    while (left > 0) {
      const frontier = [];
      for (let i = 0; i < n * n; i++) {
        if (regions[i] !== -1) continue;
        const owners = neighbors4(n, i).map((j) => regions[j]).filter((x) => x !== -1);
        if (owners.length) frontier.push([i, owners]);
      }
      // Cresce algumas casas por rodada; regiões sorteadas de forma desigual geram formas variadas.
      shuffle(frontier, rnd);
      const take = Math.max(1, Math.floor(frontier.length * 0.35));
      for (let k = 0; k < take; k++) {
        const [i, owners] = frontier[k];
        if (regions[i] !== -1) continue;
        regions[i] = owners[Math.floor(rnd() * owners.length)];
        left--;
      }
    }
    return regions;
  }

  function connectedWithout(n, regions, cell) {
    const reg = regions[cell];
    const members = [];
    for (let i = 0; i < n * n; i++) if (regions[i] === reg && i !== cell) members.push(i);
    if (!members.length) return false;
    const seen = new Set([members[0]]);
    const stack = [members[0]];
    while (stack.length) {
      const i = stack.pop();
      for (const j of neighbors4(n, i)) {
        if (j !== cell && regions[j] === reg && !seen.has(j)) { seen.add(j); stack.push(j); }
      }
    }
    return seen.size === members.length;
  }

  // Gera um tabuleiro com solução única. Quando aparece uma segunda solução, uma casa dela
  // muda de canteiro para quebrá-la (sem mexer nas casas da solução planejada).
  function generate(n, rnd = Math.random) {
    for (let attempt = 0; attempt < 60; attempt++) {
      const sol = randomPlacement(n, rnd);
      const seeds = sol.map((c, r) => r * n + c);
      const seedSet = new Set(seeds);
      const regions = growRegions(n, seeds, rnd);
      for (let step = 0; step < 120; step++) {
        const sols = solve(n, regions, 2);
        if (sols.length === 1) return { n, regions, solution: sols[0] };
        const other = sols.find((s) => s.some((c, r) => c !== sol[r]));
        if (!other) break;
        // Casas da solução indesejada que não pertencem à planejada: candidatas a mudar de canteiro.
        const cands = shuffle(other.map((c, r) => r * n + c).filter((i) => !seedSet.has(i)), rnd);
        let moved = false;
        for (const cell of cands) {
          const opts = shuffle(neighbors4(n, cell).map((j) => regions[j]).filter((g) => g !== regions[cell]), rnd);
          if (!opts.length || !connectedWithout(n, regions, cell)) continue;
          regions[cell] = opts[0];
          moved = true;
          break;
        }
        if (!moved) break;
      }
    }
    throw new Error('Não foi possível gerar o tabuleiro');
  }

  const api = { generate, solve };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CanteirosEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);
