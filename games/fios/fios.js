(() => {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const E = window.FiosEngine;
  const SIZES = {
    5: { label: 'Fácil' },
    7: { label: 'Médio' },
    9: { label: 'Difícil' },
    10: { label: 'Desafio' },
  };
  const DAILY_SIZE = 8;
  const COLORS = ['#ff5d5d', '#ffd23f', '#4fa3ff', '#5ee07a', '#ff9f43', '#b583ff', '#3fe0d0', '#ff6fcf', '#c4e35a', '#f2f2f2', '#b07a48', '#7a8cff'];
  const LETTERS = 'ABCDEFGHIJKL';

  /* ================= Utilidades ================= */
  const store = {
    get(k, d = null) {
      try { const v = localStorage.getItem('fios:' + k); return v == null ? d : JSON.parse(v); }
      catch { return d; }
    },
    set(k, v) { try { localStorage.setItem('fios:' + k, JSON.stringify(v)); } catch { /* sem armazenamento */ } },
    del(k) { try { localStorage.removeItem('fios:' + k); } catch { /* sem armazenamento */ } },
  };
  function mulberry32(seed) {
    return () => {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hashStr(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  const dateLabel = (key) => key.split('-').reverse().join('/');
  function fmtTime(sec) {
    sec = Math.floor(sec);
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    const mm = String(m).padStart(2, '0'), ss = String(s).padStart(2, '0');
    return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
  }
  const plural = (k, one, many) => `${k} ${k === 1 ? one : many}`;

  /* ================= Telas ================= */
  let current = 'home';
  function show(id) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === 's-' + id));
    current = id;
    $('#backLink').hidden = id !== 'home';
    $('#menuBack').hidden = id === 'home';
    window.scrollTo(0, 0);
    syncTimer();
  }
  let toastTimer;
  function toast(msg, ms = 2600) {
    const t = $('#toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), ms);
  }
  async function share(text) {
    try {
      if (navigator.share && matchMedia('(pointer: coarse)').matches) { await navigator.share({ text }); return; }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    try { await navigator.clipboard.writeText(text); toast('Resultado copiado!'); }
    catch { toast('Não deu para copiar automaticamente.'); }
  }

  /* ================= Menu ================= */
  function renderHome() {
    pauseTimer();
    $('#sizes').innerHTML = Object.entries(SIZES).map(([n, s]) => {
      const best = store.get('best:' + n), wins = store.get('wins:' + n, 0);
      return `<button class="size" data-size="${n}">
        <strong>${s.label}<small>${n}×${n}</small></strong>
        <span>${best ? `Melhor tempo ${fmtTime(best)}` : 'Sem recorde ainda'}${wins ? ` · ${plural(wins, 'placa', 'placas')}` : ''}</span>
      </button>`;
    }).join('');
    const daily = store.get('daily:' + todayKey());
    $('#dailyText').textContent = daily
      ? `Ligada hoje em ${fmtTime(daily.time)}${daily.hints ? ` com ${plural(daily.hints, 'dica', 'dicas')}` : ''}. Uma nova placa à meia-noite.`
      : `${dateLabel(todayKey())} · ${DAILY_SIZE}×${DAILY_SIZE}. A mesma placa para todo mundo hoje.`;
    $('#dailyBtn').textContent = daily ? 'Ver resultado' : 'Jogar a de hoje';
    const sv = store.get('save');
    if (sv && !sv.won) {
      $('#resumeTitle').textContent = sv.daily ? `Placa do dia (${dateLabel(sv.daily)})` : `${SIZES[sv.n].label} ${sv.n}×${sv.n}`;
      $('#resumeInfo').textContent = `${fmtTime(sv.elapsed / 1000)} · ${Math.round(coverage(sv) * 100)}% da placa`;
      $('#resumeBtn').hidden = false;
    } else $('#resumeBtn').hidden = true;
    show('home');
  }
  const coverage = (g) => new Set(g.paths.flat()).size / (g.n * g.n);

  $('#sizes').addEventListener('click', (e) => {
    const b = e.target.closest('[data-size]');
    if (b) confirmReplace(() => newGame(+b.dataset.size));
  });
  $('#dailyBtn').addEventListener('click', () => {
    const done = store.get('daily:' + todayKey());
    if (done) { showWin({ n: DAILY_SIZE, daily: todayKey(), ...done }, false); return; }
    const sv = store.get('save');
    if (sv && !sv.won && sv.daily === todayKey()) { resume(sv); return; }
    confirmReplace(() => newGame(DAILY_SIZE, todayKey()));
  });
  $('#resumeBtn').addEventListener('click', () => { const s = store.get('save'); if (s) resume(s); });
  function leaveToMenu() {
    const saved = current === 'play' && game && !game.won;
    renderHome();
    if (saved) toast('Progresso salvo. Toque em Continuar para voltar.');
  }
  $('#homeBtn').addEventListener('click', leaveToMenu);
  $('#menuBack').addEventListener('click', leaveToMenu);

  let pendingReplace = 0;
  function confirmReplace(fn) {
    const sv = store.get('save');
    const busy = sv && !sv.won && sv.paths.some((p) => p.length > 1);
    if (!busy || Date.now() - pendingReplace < 4000) { pendingReplace = 0; fn(); return; }
    pendingReplace = Date.now();
    toast('Você tem uma placa em andamento. Toque de novo para começar outra.');
  }

  /* ================= Estado ================= */
  let game = null; // { n, ends, sol, paths, daily, elapsed, hints, won }
  let history = [];

  function newGame(n, daily = null) {
    // a geração das placas grandes pode levar um instante: mostra o aviso antes
    show('play');
    $('#board').innerHTML = '';
    $('#loading').hidden = false;
    setTimeout(() => {
      const rnd = daily ? mulberry32(hashStr('jogateca-fios-' + daily)) : Math.random;
      const p = E.generate(n, rnd) || E.generate(n, Math.random);
      $('#loading').hidden = true;
      const K = p.colors;
      game = { n, ends: p.ends, sol: p.paths, paths: Array.from({ length: K }, () => []), daily, elapsed: 0, hints: 0, won: false };
      history = [];
      startPlay();
    }, 30);
  }
  function resume(sv) { game = sv; history = []; startPlay(); }
  function startPlay() {
    $('#paused').hidden = true;
    $('#loading').hidden = true;
    $('#board').style.visibility = '';
    show('play');
    render();
    save();
  }
  const save = () => { if (game && !game.won) store.set('save', game); };

  /* ================= Cronômetro ================= */
  let tick = null, lastT = 0, sinceSave = 0;
  const running = () => game && !game.won && current === 'play' && $('#paused').hidden && $('#loading').hidden && document.visibilityState === 'visible';
  function syncTimer() {
    if (running()) { if (!tick) { lastT = performance.now(); tick = setInterval(step, 500); } }
    else pauseTimer();
  }
  function step() {
    const now = performance.now();
    game.elapsed += now - lastT; sinceSave += now - lastT; lastT = now;
    $('#timer').textContent = fmtTime(game.elapsed / 1000);
    if (sinceSave > 5000) { sinceSave = 0; save(); }
  }
  function pauseTimer() { if (tick) { step(); clearInterval(tick); tick = null; save(); } }
  document.addEventListener('visibilitychange', syncTimer);
  window.addEventListener('pagehide', () => { pauseTimer(); save(); });
  function setPaused(p) {
    if (!game || game.won) return;
    $('#paused').hidden = !p;
    $('#board').style.visibility = p ? 'hidden' : '';
    syncTimer();
  }
  $('#pauseBtn').addEventListener('click', () => setPaused($('#paused').hidden));
  $('#resumePlay').addEventListener('click', () => setPaused(false));

  /* ================= Regras ================= */
  const adj = (a, b, n) => (Math.abs(a - b) === n) || (Math.abs(a - b) === 1 && Math.floor(a / n) === Math.floor(b / n));
  // fio completo: começa num pino e termina no outro pino da mesma cor
  const complete = (g, k) => {
    const p = g.paths[k];
    return p.length >= 2 && g.ends[p[0]] === k + 1 && g.ends[p[p.length - 1]] === k + 1 && p[0] !== p[p.length - 1];
  };

  /* ================= Desenho ================= */
  const cx = (i, n) => (i % n) + 0.5, cy = (i, n) => Math.floor(i / n) + 0.5;
  function boardSvg(g, active = -1) {
    const n = g.n;
    let s = `<rect class="bg" x="0" y="0" width="${n}" height="${n}"/>`;
    for (let k = 1; k < n; k++) s += `<line class="grid" x1="${k}" y1="0" x2="${k}" y2="${n}"/><line class="grid" x1="0" y1="${k}" x2="${n}" y2="${k}"/>`;
    for (let i = 0; i < n * n; i++) s += `<circle class="pad" cx="${cx(i, n)}" cy="${cy(i, n)}" r=".07"/>`;
    g.paths.forEach((p, k) => {
      for (const i of p) s += `<rect class="fill" x="${i % n}" y="${Math.floor(i / n)}" width="1" height="1" fill="${COLORS[k]}"/>`;
    });
    g.paths.forEach((p, k) => {
      if (p.length < 2) return;
      const pts = p.map((i) => `${cx(i, n)},${cy(i, n)}`).join(' ');
      s += `<g class="${k === active ? 'active' : ''}" style="--d:${k * 90}ms">` +
        `<polyline class="wire-shade" stroke-width=".46" points="${p.map((i) => `${cx(i, n) + 0.03},${cy(i, n) + 0.04}`).join(' ')}"/>` +
        `<polyline class="wire" stroke="${COLORS[k]}" stroke-width=".38" points="${pts}"/>` +
        `<polyline class="wire-hi" stroke-width=".08" points="${p.map((i) => `${cx(i, n) - 0.06},${cy(i, n) - 0.07}`).join(' ')}"/></g>`;
    });
    for (let i = 0; i < n * n; i++) {
      const k = g.ends[i] - 1;
      if (k < 0) continue;
      s += `<g class="${complete(g, k) ? 'done' : ''}"><circle class="pin" cx="${cx(i, n)}" cy="${cy(i, n)}" r=".34" fill="${COLORS[k]}"/>` +
        `<circle class="pin-ring" cx="${cx(i, n)}" cy="${cy(i, n)}" r=".25"/>` +
        `<text class="pin-label" x="${cx(i, n)}" y="${cy(i, n) + 0.01}">${LETTERS[k]}</text></g>`;
    }
    return s;
  }

  function render(active = -1) {
    if (!game) return;
    const n = game.n, K = game.paths.length;
    const board = $('#board');
    board.setAttribute('viewBox', `0 0 ${n} ${n}`);
    board.innerHTML = boardSvg(game, active);
    const done = game.paths.filter((p, k) => complete(game, k)).length;
    const cov = coverage(game);
    $('#infoTitle').textContent = game.daily ? `Do dia · ${n}×${n}` : `${SIZES[n].label} · ${n}×${n}`;
    $('#infoWires').textContent = `${done}/${K}`;
    $('#infoFill').textContent = `${Math.round(cov * 100)}%`;
    $('#timer').textContent = fmtTime(game.elapsed / 1000);
    $('#status').textContent = done === K && cov < 1 ? 'Todos ligados, mas ainda há casas vazias na placa.'
      : done ? `${plural(K - done, 'fio por ligar', 'fios por ligar')}.` : 'Arraste a partir de um pino para puxar o fio.';
    $('#undoBtn').disabled = history.length === 0;
    if (done === K && cov === 1 && active < 0) win();
  }

  /* ================= Jogadas ================= */
  const board = $('#board');
  let drag = null; // { k, orig: paths antes do gesto, moved }
  const cellAt = (ev) => {
    const r = board.getBoundingClientRect(), n = game.n;
    const x = Math.floor(((ev.clientX - r.left) / r.width) * n), y = Math.floor(((ev.clientY - r.top) / r.height) * n);
    return x < 0 || y < 0 || x >= n || y >= n ? -1 : y * n + x;
  };
  const owner = (paths, i) => paths.findIndex((p) => p.includes(i));
  // Outros fios são cortados onde o fio ativo passa (e voltam se o fio ativo recuar).
  function applyCuts() {
    const act = new Set(game.paths[drag.k]);
    drag.orig.forEach((p, k) => {
      if (k === drag.k) return;
      const cut = p.findIndex((i) => act.has(i));
      game.paths[k] = cut < 0 ? p.slice() : p.slice(0, cut);
    });
  }

  board.addEventListener('pointerdown', (ev) => {
    if (!game || game.won || ev.button > 0) return;
    const i = cellAt(ev);
    if (i < 0) return;
    ev.preventDefault();
    const orig = game.paths.map((p) => p.slice());
    let k;
    if (game.ends[i]) {
      k = game.ends[i] - 1;
      game.paths[k] = [i];
    } else {
      k = owner(game.paths, i);
      if (k < 0) return;
      const p = game.paths[k];
      game.paths[k] = p.slice(0, p.indexOf(i) + 1);
    }
    board.setPointerCapture(ev.pointerId);
    drag = { k, orig, last: i };
    render(k);
  });
  board.addEventListener('pointermove', (ev) => {
    if (!drag) return;
    const i = cellAt(ev);
    if (i < 0 || i === drag.last) return;
    drag.last = i;
    extendTo(i);
  });
  function extendTo(i) {
    const n = game.n, k = drag.k, p = game.paths[k];
    const tail = p[p.length - 1];
    if (!adj(tail, i, n)) {
      // movimento rápido: tenta passar em linha reta pelas casas do meio
      const tr = Math.floor(tail / n), tc = tail % n, r = Math.floor(i / n), c = i % n;
      if (tr === r || tc === c) {
        const step = tr === r ? Math.sign(c - tc) : Math.sign(r - tr) * n;
        for (let j = tail + step; j !== i + step; j += step) { if (!extendTo1(j)) break; }
        applyCuts(); render(k);
      }
      return;
    }
    extendTo1(i);
    applyCuts();
    render(k);
  }
  // Um passo do fio ativo para a casa vizinha i. Devolve false se não deu para seguir.
  function extendTo1(i) {
    const k = drag.k, p = game.paths[k];
    const at = p.indexOf(i);
    if (at >= 0) { p.length = at + 1; return true; } // recua
    if (complete(game, k)) return false; // já ligado: só recua
    const e = game.ends[i];
    if (e && e !== k + 1) return false; // pino de outra cor
    if (e === k + 1 && i === p[0]) return false;
    p.push(i);
    return true;
  }
  function finish() {
    if (!drag) return;
    const changed = JSON.stringify(drag.orig) !== JSON.stringify(game.paths);
    if (changed) { history.push(drag.orig); if (history.length > 300) history.shift(); }
    drag = null;
    render(); save();
  }
  board.addEventListener('pointerup', finish);
  board.addEventListener('lostpointercapture', finish);
  board.addEventListener('pointercancel', finish);
  board.addEventListener('contextmenu', (ev) => ev.preventDefault());

  function undo() {
    const h = history.pop();
    if (!h || !game || game.won) return;
    game.paths = h;
    render(); save();
  }
  $('#undoBtn').addEventListener('click', undo);
  $('#clearBtn').addEventListener('click', () => {
    if (!game || game.won || !game.paths.some((p) => p.length)) return;
    history.push(game.paths.map((p) => p.slice()));
    game.paths = game.paths.map(() => []);
    render(); save();
    toast('Placa limpa. Dá para desfazer.');
  });

  // Dica: puxa um fio inteiro como na solução (o mais curto entre os que ainda não estão certos).
  $('#hintBtn').addEventListener('click', () => {
    if (!game || game.won) return;
    const same = (a, b) => a.length === b.length && (a.every((x, j) => x === b[j]) || a.every((x, j) => x === b[b.length - 1 - j]));
    const todo = game.sol.map((p, k) => k).filter((k) => !same(game.paths[k], game.sol[k]));
    if (!todo.length) return;
    todo.sort((a, b) => game.sol[a].length - game.sol[b].length);
    const k = todo[0];
    history.push(game.paths.map((p) => p.slice()));
    const sol = new Set(game.sol[k]);
    game.paths = game.paths.map((p, j) => {
      if (j === k) return game.sol[k].slice();
      const cut = p.findIndex((i) => sol.has(i));
      return cut < 0 ? p : p.slice(0, cut);
    });
    game.hints++;
    render(); save();
    toast(`Dica: o fio ${LETTERS[k]} ficou no lugar certo.`);
  });

  document.addEventListener('keydown', (ev) => {
    if (current !== 'play' || !game || game.won) return;
    if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'z') { ev.preventDefault(); undo(); return; }
    if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
    const k = ev.key.toLowerCase();
    if (k === 'z' || k === 'u') undo();
    else if (k === 'h') $('#hintBtn').click();
    else if (k === 'p') setPaused($('#paused').hidden);
  });

  /* ================= Vitória ================= */
  function win() {
    if (game.won) return;
    pauseTimer();
    game.won = true;
    const time = Math.round(game.elapsed / 1000);
    const result = { time, hints: game.hints, ends: game.ends, paths: game.paths };
    let prevBest = null;
    if (game.daily) { if (!store.get('daily:' + game.daily)) store.set('daily:' + game.daily, result); }
    else {
      prevBest = store.get('best:' + game.n);
      if (!game.hints && (!prevBest || time < prevBest)) store.set('best:' + game.n, time);
      store.set('wins:' + game.n, store.get('wins:' + game.n, 0) + 1);
    }
    store.del('save');
    $('#frame').classList.add('celebrate');
    $('#status').textContent = 'Circuito completo!';
    setTimeout(() => { $('#frame').classList.remove('celebrate'); showWin({ n: game.n, daily: game.daily, ...result }, true, prevBest); }, 1700);
  }
  function showWin(r, fresh, prevBest = null) {
    show('win');
    $('#winEyebrow').textContent = r.daily ? `Placa do dia · ${dateLabel(r.daily)}` : `${SIZES[r.n].label} · ${r.n}×${r.n}`;
    const wb = $('#winBoard');
    wb.setAttribute('viewBox', `0 0 ${r.n} ${r.n}`);
    wb.innerHTML = r.ends && r.paths ? boardSvg({ n: r.n, ends: r.ends, paths: r.paths }) : '';
    $('#winTime').textContent = fmtTime(r.time);
    let sub;
    if (r.daily) sub = fresh ? 'A mesma placa para todo mundo hoje. Compare o tempo!' : 'Você já ligou a de hoje. Uma nova placa à meia-noite.';
    else if (r.hints) sub = `Com ${plural(r.hints, 'dica', 'dicas')}. Partidas com dica não contam para o recorde.`;
    else if (!prevBest) sub = 'Primeiro recorde neste tamanho!';
    else if (r.time < prevBest) sub = `Novo recorde! Antes: ${fmtTime(prevBest)}`;
    else sub = `Seu recorde: ${fmtTime(prevBest)}`;
    $('#winSub').textContent = sub;
    $('#winShare').onclick = () => share(`Fios${r.daily ? ` do dia ${dateLabel(r.daily)}` : ''} · ${r.n}×${r.n}\n🔌 ${fmtTime(r.time)}${r.hints ? ` · ${plural(r.hints, 'dica', 'dicas')}` : ' · sem dicas'}\n${location.origin}${location.pathname}`);
    $('#winNew').onclick = () => newGame(r.n);
  }
  $('#winHome').addEventListener('click', renderHome);

  /* ================= Início ================= */
  renderHome();
  const mode = new URLSearchParams(location.search).get('mode');
  if (mode === 'diario') $('#dailyBtn').click();
  else if (mode === 'continuar' && store.get('save')) resume(store.get('save'));
  else if (SIZES[mode]) confirmReplace(() => newGame(+mode));
})();
