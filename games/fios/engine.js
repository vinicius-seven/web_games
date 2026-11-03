/* Motor do Fios (gênero Numberlink): gera placas e conta soluções.
   Funciona no navegador (window.FiosEngine) e no Node.

   Placa n×n. ends[i] = cor (1..K) se a casa i é um pino, 0 se é livre.
   Regras: ligar os dois pinos de cada cor com um fio que anda pelas casas (para cima, baixo, lados);
   fios não se cruzam nem dividem casa; toda casa da placa é usada. */
(function (root) {
  'use strict';

  function shuffle(arr, rnd) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /* ---------- Contagem de soluções ----------
     Programação dinâmica casa a casa (linha por linha), guardando só a "fronteira": quais arestas
     descem da linha de cima e qual vem da casa à esquerda, cada uma com o trecho de fio a que
     pertence e a cor dele (0 = trecho ainda sem pino). Conta até `limit` soluções. */
  function countSolutions(n, ends, limit = 2) {
    // estado: { f: Int16Array(n) ids das arestas que descem, left: id, col: Map id→cor, cnt }
    let states = new Map();
    const start = { f: new Array(n).fill(0), left: 0, col: {}, cnt: 1 };
    states.set(key(start), start);
    let nextId = 1;
    function key(s) {
      // renumera ids por ordem de aparição
      const map = {};
      let k = 0;
      const ids = [...s.f, s.left].map((x) => (x ? (map[x] || (map[x] = ++k)) : 0));
      const cols = Object.keys(map).sort((a, b) => map[a] - map[b]).map((x) => s.col[x] || 0);
      return ids.join(',') + '|' + cols.join(',');
    }
    const add = (next, s) => {
      const k = key(s);
      const ex = next.get(k);
      if (ex) ex.cnt = Math.min(limit, ex.cnt + s.cnt);
      else next.set(k, s);
    };
    for (let i = 0; i < n * n; i++) {
      const r = Math.floor(i / n), c = i % n;
      const canR = c < n - 1, canD = r < n - 1;
      const next = new Map();
      const e = ends[i];
      for (const s of states.values()) {
        const up = s.f[c], lf = c > 0 ? s.left : 0;
        const base = () => ({ f: s.f.slice(), left: 0, col: { ...s.col }, cnt: s.cnt });
        const emit = (t, down, right) => {
          if (down && !canD) return;
          if (right && !canR) return;
          t.f[c] = down || 0;
          t.left = right || 0;
          add(next, t);
        };
        if (e) {
          // pino: exatamente uma ligação
          if (up && lf) continue;
          const inc = up || lf;
          if (inc) {
            const ci = s.col[inc] || 0;
            if (ci && ci !== e) continue;
            const t = base();
            // trecho chega ao pino: some uma ponta solta
            if (!ci) t.col[inc] = e;
            else {
              // trecho já tinha a outra ponta da mesma cor: fio completo
              delete t.col[inc];
            }
            // se o trecho não tinha cor, ele continua com a outra ponta solta (agora com cor e)
            if (!ci) { /* mantém id inc na outra ponta */ }
            emit(t, 0, 0);
          } else {
            const id = nextId++;
            for (const [d, rr] of [[id, 0], [0, id]]) {
              const t = base();
              t.col[id] = e;
              emit(t, d, rr);
            }
          }
        } else {
          if (up && lf) {
            if (up === lf) continue; // fecharia um laço
            const cu = s.col[up] || 0, cl = s.col[lf] || 0;
            if (cu && cl && cu !== cl) continue;
            const t = base();
            if (cu && cl) {
              // duas pontas da mesma cor se encontram: fio completo
              delete t.col[up]; delete t.col[lf];
              emit(t, 0, 0);
            } else {
              // junta os trechos: troca lf por up em toda a fronteira
              const col = cu || cl;
              for (let j = 0; j < n; j++) if (t.f[j] === lf) t.f[j] = up;
              if (col) t.col[up] = col;
              delete t.col[lf];
              emit(t, 0, 0);
            }
          } else if (up || lf) {
            const id = up || lf;
            for (const [d, rr] of [[id, 0], [0, id]]) emit(base(), d, rr);
          } else {
            const id = nextId++;
            emit(base(), id, id);
          }
        }
      }
      states = next;
      if (!states.size) return 0;
    }
    let total = 0;
    for (const s of states.values()) if (!s.left && s.f.every((x) => !x)) total += s.cnt;
    return Math.min(limit, total);
  }

  /* ---------- Gerador ----------
     Divide a placa em caminhos (passeios aleatórios que preferem casas com poucas saídas),
     sem caminhos que encostem em si mesmos, e só aceita placas com solução única. */
  function partition(n, rnd, minLen, maxLen) {
    const N = n * n;
    const owner = new Int16Array(N).fill(-1);
    const paths = [];
    const nb = (i) => {
      const r = Math.floor(i / n), c = i % n, o = [];
      if (r > 0) o.push(i - n);
      if (r < n - 1) o.push(i + n);
      if (c > 0) o.push(i - 1);
      if (c < n - 1) o.push(i + 1);
      return o;
    };
    const freeNb = (i) => nb(i).filter((j) => owner[j] < 0);
    // o caminho p não pode encostar em si mesmo fora da sequência
    const touchesSelf = (p, j, last) => nb(j).some((k) => k !== last && owner[k] === p);
    let guard = 0;
    while (guard++ < N * 4) {
      const free = [];
      for (let i = 0; i < N; i++) if (owner[i] < 0) free.push(i);
      if (!free.length) break;
      // começa pela casa livre mais "apertada"
      let minF = 9, cand = [];
      for (const i of free) { const f = freeNb(i).length; if (f < minF) { minF = f; cand = [i]; } else if (f === minF) cand.push(i); }
      const s = cand[Math.floor(rnd() * cand.length)];
      const p = paths.length;
      const path = [s];
      owner[s] = p;
      const want = minLen + Math.floor(rnd() * (maxLen - minLen + 1));
      while (path.length < want) {
        const last = path[path.length - 1];
        const opts = freeNb(last).filter((j) => !touchesSelf(p, j, last));
        if (!opts.length) break;
        let best = 9, pick = [];
        for (const j of opts) { const f = freeNb(j).length; if (f < best) { best = f; pick = [j]; } else if (f === best) pick.push(j); }
        const j = rnd() < 0.75 ? pick[Math.floor(rnd() * pick.length)] : opts[Math.floor(rnd() * opts.length)];
        owner[j] = p; path.push(j);
      }
      if (path.length < 3) {
        // caminho curto demais: tenta emendar numa ponta de caminho vizinho
        let merged = false;
        for (const x of [path[0], path[path.length - 1]]) {
          for (const k of nb(x)) {
            const q = owner[k];
            if (q < 0 || q === p) continue;
            const qp = paths[q];
            const atEnd = qp[qp.length - 1] === k, atStart = qp[0] === k;
            if (!atEnd && !atStart) continue;
            const seq = x === path[0] ? path : path.slice().reverse();
            const ok = seq.every((y, idx) => nb(y).every((z) => owner[z] !== q || z === (idx ? -1 : k) || z === k));
            if (!ok) continue;
            if (atEnd) qp.push(...seq); else qp.unshift(...seq.slice().reverse());
            for (const y of seq) owner[y] = q;
            merged = true; break;
          }
          if (merged) break;
        }
        if (!merged) return null;
        continue;
      }
      paths.push(path);
    }
    if (owner.some((o) => o < 0)) return null;
    if (paths.some((p) => p.length < 3)) return null;
    return paths;
  }

  function generate(n, rnd = Math.random, opts = {}) {
    const minLen = opts.minLen || Math.max(3, Math.round(n * 0.6));
    const maxLen = opts.maxLen || Math.round(n * 2.2);
    const maxColors = opts.maxColors || 12;
    for (let t = 0; t < (opts.tries || 3000); t++) {
      const paths = partition(n, rnd, minLen, maxLen);
      if (!paths || paths.length > maxColors || paths.length < Math.max(3, n - 2)) continue;
      const ends = new Array(n * n).fill(0);
      shuffle(paths, rnd);
      paths.forEach((p, k) => { ends[p[0]] = k + 1; ends[p[p.length - 1]] = k + 1; });
      if (countSolutions(n, ends, 2) !== 1) continue;
      return { n, ends, paths, colors: paths.length };
    }
    return null;
  }

  const api = { generate, countSolutions, partition };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.FiosEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);
