/* Motor do Enigma de Einstein: gera enigmas de "quem mora onde" e resolve só por dedução.
   Funciona no navegador (window.EinsteinEngine) e no Node.

   Um enigma tem N casas em fila (0 = mais à esquerda) e K categorias (cor, morador, bicho...).
   Solução: sol[c][h] = índice do valor da categoria c na casa h.
   Grade de candidatos (o que o jogador vê): cand[c][h] = máscara de valores possíveis.
   Pistas (a e b são [categoria, valor]):
     { t: 'same', a, b }     mesmo morador/casa
     { t: 'not', a, b }      casas diferentes
     { t: 'pos', a, k }      a está na casa k
     { t: 'next', a, b }     casas vizinhas
     { t: 'left', a, b }     a logo à esquerda de b
     { t: 'before', a, b }   a em algum lugar à esquerda de b */
(function (root) {
  'use strict';

  const bits = (m) => { let k = 0; while (m) { m &= m - 1; k++; } return k; };
  const low = (m) => 31 - Math.clz32(m & -m);
  const high = (m) => 31 - Math.clz32(m);
  function shuffle(arr, rnd) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Máscara de casas possíveis para o valor v da categoria c.
  function posMask(cand, n, c, v) {
    let m = 0;
    for (let h = 0; h < n; h++) if (cand[c][h] & (1 << v)) m |= 1 << h;
    return m;
  }
  // Restringe o valor (c, v) às casas de `keep`. Devolve a lista de mudanças [c, h, valorRemovido].
  function restrict(cand, n, [c, v], keep, out) {
    for (let h = 0; h < n; h++) {
      if (!(keep & (1 << h)) && (cand[c][h] & (1 << v))) { cand[c][h] &= ~(1 << v); out.push([c, h, v]); }
    }
  }

  // Um passo de dedução. Devolve { kind, clue, changes } ou null se nada muda.
  // kind: 'cell' (casa com um valor só), 'place' (valor com uma casa só), 'clue' (aplicou uma pista).
  function step(cand, n, clues) {
    const K = cand.length, full = (1 << n) - 1;
    const changes = [];
    // Casa resolvida: o valor sai das outras casas da mesma categoria.
    for (let c = 0; c < K; c++) {
      for (let h = 0; h < n; h++) {
        if (bits(cand[c][h]) !== 1) continue;
        const v = low(cand[c][h]);
        restrict(cand, n, [c, v], 1 << h, changes);
        if (changes.length) return { kind: 'cell', c, h, v, changes };
      }
    }
    // Valor com um só lugar possível: a casa fica com ele.
    for (let c = 0; c < K; c++) {
      for (let v = 0; v < n; v++) {
        const pm = posMask(cand, n, c, v);
        if (bits(pm) !== 1) continue;
        const h = low(pm);
        if (cand[c][h] !== 1 << v) {
          for (let w = 0; w < n; w++) if (w !== v && cand[c][h] & (1 << w)) changes.push([c, h, w]);
          cand[c][h] = 1 << v;
          return { kind: 'place', c, h, v, changes };
        }
      }
    }
    // Pistas
    for (let i = 0; i < clues.length; i++) {
      const q = clues[i];
      const pa = posMask(cand, n, q.a[0], q.a[1]);
      const pb = q.b ? posMask(cand, n, q.b[0], q.b[1]) : 0;
      let ka = pa, kb = pb;
      if (q.t === 'pos') ka = pa & (1 << q.k);
      else if (q.t === 'same') { ka = pa & pb; kb = pa & pb; }
      else if (q.t === 'not') {
        if (bits(pa) === 1) kb = pb & ~pa;
        if (bits(pb) === 1) ka = pa & ~pb;
      } else if (q.t === 'next') {
        ka = pa & ((pb << 1) | (pb >> 1)) & full;
        kb = pb & ((pa << 1) | (pa >> 1)) & full;
      } else if (q.t === 'left') {
        ka = pa & (pb >> 1);
        kb = pb & ((pa << 1) & full);
      } else if (q.t === 'before') {
        ka = pb ? pa & ((1 << high(pb)) - 1) : pa;
        kb = pa ? pb & (full & ~((2 << low(pa)) - 1)) : pb;
      }
      if (ka !== pa) restrict(cand, n, q.a, ka, changes);
      if (q.b && kb !== pb) restrict(cand, n, q.b, kb, changes);
      if (changes.length) return { kind: 'clue', clue: i, changes };
    }
    return null;
  }

  function fresh(n, K) {
    const full = (1 << n) - 1;
    return Array.from({ length: K }, () => new Array(n).fill(full));
  }
  const clone = (cand) => cand.map((r) => r.slice());
  const solvedGrid = (cand) => cand.every((r) => r.every((m) => bits(m) === 1));
  const broken = (cand) => cand.some((r) => r.some((m) => m === 0));

  // Resolve só por dedução. Devolve { solved, cand, steps }.
  function logicSolve(n, K, clues, start = null) {
    const cand = start ? clone(start) : fresh(n, K);
    let steps = 0, s;
    while ((s = step(cand, n, clues))) {
      steps++;
      if (broken(cand)) return { solved: false, cand, steps, contradiction: true };
    }
    return { solved: solvedGrid(cand), cand, steps };
  }

  /* ---------- Gerador ---------- */
  // Pesos dos tipos de pista por nível (os relacionais deixam o enigma mais difícil).
  const WEIGHTS = {
    facil: { same: 5, pos: 3, not: 2, next: 2, left: 2, before: 1 },
    medio: { same: 4, pos: 1.5, not: 2, next: 3, left: 3, before: 2 },
    dificil: { same: 3, pos: 0.6, not: 2.5, next: 3, left: 3, before: 3 },
  };

  function allClues(sol, n, K) {
    const where = sol.map((row) => { const w = []; row.forEach((v, h) => { w[v] = h; }); return w; });
    const items = [];
    for (let c = 0; c < K; c++) for (let v = 0; v < n; v++) items.push([c, v]);
    const H = (it) => where[it[0]][it[1]];
    const out = [];
    for (const a of items) out.push({ t: 'pos', a, k: H(a) });
    for (let i = 0; i < items.length; i++) {
      for (let j = 0; j < items.length; j++) {
        if (i === j) continue;
        const a = items[i], b = items[j], ha = H(a), hb = H(b);
        if (i < j && a[0] !== b[0] && ha === hb) out.push({ t: 'same', a, b });
        if (i < j && a[0] !== b[0] && ha !== hb) out.push({ t: 'not', a, b });
        if (i < j && Math.abs(ha - hb) === 1) out.push({ t: 'next', a, b });
        if (hb - ha === 1) out.push({ t: 'left', a, b });
        if (hb - ha > 1) out.push({ t: 'before', a, b });
      }
    }
    return out;
  }

  // Embaralha com peso: tipos com peso maior tendem a vir antes.
  function weightedOrder(clues, w, rnd) {
    return clues.map((q) => ({ q, key: Math.pow(rnd(), 1 / (w[q.t] || 1)) }))
      .sort((x, y) => y.key - x.key).map((x) => x.q);
  }

  function generate(n, K, rnd = Math.random, level = 'medio') {
    const w = WEIGHTS[level] || WEIGHTS.medio;
    for (let attempt = 0; attempt < 60; attempt++) {
      const sol = Array.from({ length: K }, () => shuffle([...Array(n).keys()], rnd));
      const pool = weightedOrder(allClues(sol, n, K), w, rnd);
      // 1) junta pistas até dar para resolver
      const chosen = [];
      let ok = false;
      for (const q of pool) {
        chosen.push(q);
        if (chosen.length < n) continue;
        if (logicSolve(n, K, chosen).solved) { ok = true; break; }
      }
      if (!ok) continue;
      // 2) tira as que sobram, em ordem aleatória (no Fácil, só uma parte)
      const order = shuffle(chosen.slice(), rnd);
      let clues = chosen.slice();
      for (const q of order) {
        if (level === 'facil' && clues.length <= Math.round(chosen.length * 0.75)) break;
        const without = clues.filter((x) => x !== q);
        if (logicSolve(n, K, without).solved) clues = without;
      }
      // mistura a ordem de apresentação
      clues = shuffle(clues, rnd);
      const steps = logicSolve(n, K, clues).steps;
      return { n, K, sol, clues, steps };
    }
    throw new Error('não foi possível gerar');
  }

  const api = { generate, logicSolve, step, fresh, clone, bits, low, posMask, allClues };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.EinsteinEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);
