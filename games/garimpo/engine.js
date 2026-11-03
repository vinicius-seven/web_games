/* Motor do Garimpo (campo minado sem chute): gera terrenos que fecham só com lógica.
   Funciona no navegador (window.GarimpoEngine) e no Node.

   Terreno W×H com B buracos. A partida começa com uma área já cavada (em volta de `start`),
   e o gerador só aceita terrenos que o resolvedor abre por inteiro a partir dali, sem chutar. */
(function (root) {
  'use strict';

  function shuffle(arr, rnd) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  const NB = new Map();
  function neighbors(W, H) {
    const key = W + 'x' + H;
    if (NB.has(key)) return NB.get(key);
    const out = [];
    for (let i = 0; i < W * H; i++) {
      const r = Math.floor(i / W), c = i % W, a = [];
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue;
        const rr = r + dr, cc = c + dc;
        if (rr >= 0 && cc >= 0 && rr < H && cc < W) a.push(rr * W + cc);
      }
      out.push(a);
    }
    NB.set(key, out);
    return out;
  }
  function numbers(W, H, mines) {
    const nb = neighbors(W, H);
    return mines.map((m, i) => (m ? -1 : nb[i].reduce((s, j) => s + mines[j], 0)));
  }
  // Cava a casa i (e, se for 0, a região em volta). Altera `open`.
  function dig(W, H, nums, open, i) {
    const nb = neighbors(W, H);
    const stack = [i];
    const opened = [];
    while (stack.length) {
      const k = stack.pop();
      if (open[k]) continue;
      open[k] = 1; opened.push(k);
      if (nums[k] === 0) for (const j of nb[k]) if (!open[j]) stack.push(j);
    }
    return opened;
  }

  /* ---------- Resolvedor ----------
     Só olha os números já à vista:
       - número com todos os buracos marcados → o resto em volta é seguro;
       - número com exatamente tantas casas fechadas quanto buracos faltando → todas são buraco;
       - dois números vizinhos: comparando as casas em comum, sobra certeza para as outras;
       - no fim, a conta total de buracos.
     Devolve o primeiro passo (para dicas) ou resolve tudo. */
  function step(W, H, nums, open, flag, total) {
    const nb = neighbors(W, H);
    const N = W * H;
    const cons = [];
    for (let i = 0; i < N; i++) {
      if (!open[i] || nums[i] <= 0) continue;
      const U = [];
      let f = 0;
      for (const j of nb[i]) { if (flag[j]) f++; else if (!open[j]) U.push(j); }
      if (!U.length) continue;
      const r = nums[i] - f;
      if (r === 0) return { safe: U, why: { rule: 'full', cell: i } };
      if (r === U.length) return { mines: U, why: { rule: 'need', cell: i } };
      cons.push({ i, U, r, set: new Set(U) });
    }
    // pares de números
    for (let a = 0; a < cons.length; a++) {
      const A = cons[a];
      for (let b = 0; b < cons.length; b++) {
        if (a === b) continue;
        const B = cons[b];
        if (Math.abs(Math.floor(A.i / W) - Math.floor(B.i / W)) > 2 || Math.abs((A.i % W) - (B.i % W)) > 2) continue;
        const I = A.U.filter((x) => B.set.has(x));
        if (!I.length) continue;
        const onlyA = A.U.filter((x) => !B.set.has(x)), onlyB = B.U.filter((x) => !A.set.has(x));
        const minI = Math.max(0, A.r - onlyA.length, B.r - onlyB.length);
        const maxI = Math.min(I.length, A.r, B.r);
        if (onlyB.length) {
          if (B.r - minI === 0) return { safe: onlyB, why: { rule: 'pair', cell: B.i, other: A.i } };
          if (B.r - maxI === onlyB.length) return { mines: onlyB, why: { rule: 'pair', cell: B.i, other: A.i } };
        }
      }
    }
    // conta total
    let unknown = 0, flagged = 0;
    for (let i = 0; i < N; i++) { if (flag[i]) flagged++; else if (!open[i]) unknown++; }
    const left = total - flagged;
    if (unknown && left === 0) return { safe: [...Array(N).keys()].filter((i) => !open[i] && !flag[i]), why: { rule: 'count0' } };
    if (unknown && left === unknown) return { mines: [...Array(N).keys()].filter((i) => !open[i] && !flag[i]), why: { rule: 'countAll' } };
    return null;
  }

  function solve(W, H, mines, start) {
    const nums = numbers(W, H, mines);
    const open = new Uint8Array(W * H), flag = new Uint8Array(W * H);
    const total = mines.reduce((s, m) => s + m, 0);
    dig(W, H, nums, open, start);
    let s, guard = 0;
    while ((s = step(W, H, nums, open, flag, total)) && guard++ < W * H * 4) {
      if (s.safe) for (const i of s.safe) { if (mines[i]) return false; dig(W, H, nums, open, i); }
      if (s.mines) for (const i of s.mines) { if (!mines[i]) return false; flag[i] = 1; }
    }
    for (let i = 0; i < W * H; i++) if (!mines[i] && !open[i]) return false;
    return true;
  }

  function generate(W, H, B, rnd = Math.random, opts = {}) {
    const N = W * H;
    const nb = neighbors(W, H);
    for (let t = 0; t < (opts.tries || 4000); t++) {
      // começo perto do meio, para o terreno abrir para os dois lados
      const sr = Math.floor(H / 2 + (rnd() - 0.5) * H * 0.4), sc = Math.floor(W / 2 + (rnd() - 0.5) * W * 0.4);
      const start = sr * W + sc;
      const banned = new Set([start, ...nb[start]]);
      const cand = [...Array(N).keys()].filter((i) => !banned.has(i));
      const mines = new Array(N).fill(0);
      for (const i of shuffle(cand, rnd).slice(0, B)) mines[i] = 1;
      if (solve(W, H, mines, start)) return { W, H, B, mines, start, tries: t + 1 };
    }
    return null;
  }

  const api = { generate, solve, step, numbers, dig, neighbors };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.GarimpoEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);
