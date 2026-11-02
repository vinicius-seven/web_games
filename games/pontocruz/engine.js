/* Motor do Ponto-Cruz (nonograma): pistas, resolvedor linha a linha e gerador de motivos.
   Funciona no navegador (window.PontoCruzEngine) e no Node. Casas: 1 = bordada, 0 = vazia, -1 = desconhecida. */
(function (root) {
  'use strict';

  // Pistas de uma linha: tamanhos dos blocos seguidos de casas bordadas.
  function lineClues(cells) {
    const out = [];
    let run = 0;
    for (const v of cells) {
      if (v === 1) run++;
      else if (run) { out.push(run); run = 0; }
    }
    if (run) out.push(run);
    return out;
  }

  function cluesOf(grid, w, h) {
    const rows = [], cols = [];
    for (let r = 0; r < h; r++) rows.push(lineClues(grid.slice(r * w, r * w + w)));
    for (let c = 0; c < w; c++) cols.push(lineClues(Array.from({ length: h }, (_, r) => grid[r * w + c])));
    return { rows, cols };
  }

  /* Resolve uma linha: considera todas as formas de encaixar os blocos que respeitam o que já se sabe
     e devolve o que é certo em todas elas. Devolve null se não houver encaixe possível. */
  function solveLine(line, clues) {
    const n = line.length, k = clues.length;
    // ok[i][j]: as casas i..n-1 aceitam os blocos j..k-1
    const ok = Array.from({ length: n + 2 }, () => new Int8Array(k + 1).fill(-1));
    const noEmptyIn = (a, b) => { for (let x = a; x < b; x++) if (line[x] === 0) return false; return true; };
    const can = (i, j) => {
      if (i >= n) return j === k;
      if (ok[i][j] !== -1) return ok[i][j] === 1;
      let res = false;
      if (line[i] !== 1 && can(i + 1, j)) res = true;
      if (!res && j < k) {
        const e = i + clues[j];
        if (e <= n && noEmptyIn(i, e) && (e === n || line[e] !== 1) && can(e + 1, j + 1)) res = true;
      }
      ok[i][j] = res ? 1 : 0;
      return res;
    };
    if (!can(0, 0)) return null;
    const mayFill = new Uint8Array(n), mayEmpty = new Uint8Array(n);
    const seen = Array.from({ length: n + 2 }, () => new Uint8Array(k + 1));
    const stack = [[0, 0]];
    while (stack.length) {
      const [i, j] = stack.pop();
      if (i >= n || seen[i][j]) continue;
      seen[i][j] = 1;
      if (line[i] !== 1 && can(i + 1, j)) { mayEmpty[i] = 1; stack.push([i + 1, j]); }
      if (j < k) {
        const e = i + clues[j];
        if (e <= n && noEmptyIn(i, e) && (e === n || line[e] !== 1) && can(e + 1, j + 1)) {
          for (let x = i; x < e; x++) mayFill[x] = 1;
          if (e < n) mayEmpty[e] = 1;
          stack.push([e + 1, j + 1]);
        }
      }
    }
    const out = line.slice();
    for (let x = 0; x < n; x++) {
      if (mayFill[x] && !mayEmpty[x]) out[x] = 1;
      else if (!mayFill[x] && mayEmpty[x]) out[x] = 0;
      else if (!mayFill[x] && !mayEmpty[x]) return null;
    }
    return out;
  }

  /* Resolve o quebra-cabeça só com raciocínio linha a linha (como uma pessoa faz).
     Se termina sem casas desconhecidas, a solução é única e não exige chute. */
  function logicSolve(clues, w, h, start = null) {
    const g = start ? start.slice() : new Array(w * h).fill(-1);
    const dirtyR = new Array(h).fill(true), dirtyC = new Array(w).fill(true);
    let changed = true, passes = 0;
    while (changed) {
      changed = false;
      passes++;
      for (let r = 0; r < h; r++) {
        if (!dirtyR[r]) continue;
        dirtyR[r] = false;
        const cur = g.slice(r * w, r * w + w);
        const next = solveLine(cur, clues.rows[r]);
        if (!next) return { solved: false, broken: true, grid: g, passes };
        for (let c = 0; c < w; c++) if (next[c] !== cur[c]) { g[r * w + c] = next[c]; dirtyC[c] = true; changed = true; }
      }
      for (let c = 0; c < w; c++) {
        if (!dirtyC[c]) continue;
        dirtyC[c] = false;
        const cur = Array.from({ length: h }, (_, r) => g[r * w + c]);
        const next = solveLine(cur, clues.cols[c]);
        if (!next) return { solved: false, broken: true, grid: g, passes };
        for (let r = 0; r < h; r++) if (next[r] !== cur[r]) { g[r * w + c] = next[r]; dirtyR[r] = true; changed = true; }
      }
    }
    return { solved: g.every((v) => v !== -1), broken: false, grid: g, passes };
  }

  /* Motivos de bordado: ruído aleatório suavizado e espelhado (simetria de 2 ou 4 eixos),
     como os padrões tradicionais de ponto-cruz. Repete até sair um que feche só com lógica. */
  function generateMotif(n, rnd = Math.random) {
    for (let attempt = 0; attempt < 400; attempt++) {
      const four = rnd() < 0.6;
      const half = Math.ceil(n / 2);
      let g = new Array(n * n).fill(0);
      const dens = 0.46 + rnd() * 0.12;
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) g[r * n + c] = rnd() < dens ? 1 : 0;
      // Suaviza: cada casa segue a maioria da vizinhança (forma manchas e linhas, não chuvisco).
      for (let it = 0; it < 1; it++) {
        const ng = g.slice();
        for (let r = 0; r < n; r++) {
          for (let c = 0; c < n; c++) {
            let s = 0, t = 0;
            for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
              const rr = r + dr, cc = c + dc;
              if (rr < 0 || cc < 0 || rr >= n || cc >= n) continue;
              t++; s += g[rr * n + cc];
            }
            ng[r * n + c] = s * 2 > t ? 1 : s * 2 < t ? 0 : g[r * n + c];
          }
        }
        g = ng;
      }
      // Espelha: esquerda→direita e (às vezes) cima→baixo.
      for (let r = 0; r < n; r++) for (let c = half; c < n; c++) g[r * n + c] = g[r * n + (n - 1 - c)];
      if (four) for (let r = half; r < n; r++) for (let c = 0; c < n; c++) g[r * n + c] = g[(n - 1 - r) * n + c];
      const filled = g.reduce((a, b) => a + b, 0);
      if (filled < n * n * 0.35 || filled > n * n * 0.72) continue;
      // Nenhuma linha ou coluna totalmente vazia (fica mais bonito e mais justo).
      let emptyLine = false;
      for (let i = 0; i < n && !emptyLine; i++) {
        if (g.slice(i * n, i * n + n).every((v) => !v)) emptyLine = true;
        if (Array.from({ length: n }, (_, r) => g[r * n + i]).every((v) => !v)) emptyLine = true;
      }
      if (emptyLine) continue;
      const clues = cluesOf(g, n, n);
      if (logicSolve(clues, n, n).solved) return { w: n, h: n, grid: g, clues, symmetry: four ? 4 : 2 };
    }
    throw new Error('Não foi possível gerar o motivo');
  }

  const api = { lineClues, cluesOf, solveLine, logicSolve, generateMotif };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PontoCruzEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);
