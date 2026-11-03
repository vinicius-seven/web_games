(() => {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const E = window.PontesEngine;
  const SIZES = { 7: 'Enseada', 9: 'Baía', 11: 'Arquipélago', 13: 'Oceano' };
  const DAILY_SIZE = 9;
  const SVGNS = 'http://www.w3.org/2000/svg';
  const PAD = 0.22; // margem de mar em volta, para as ilhas da borda não encostarem no canto

  /* ================= Utilidades ================= */
  const store = {
    get(k, d = null) {
      try { const v = localStorage.getItem('pontes:' + k); return v == null ? d : JSON.parse(v); }
      catch { return d; }
    },
    set(k, v) { try { localStorage.setItem('pontes:' + k, JSON.stringify(v)); } catch { /* sem armazenamento */ } },
    del(k) { try { localStorage.removeItem('pontes:' + k); } catch { /* sem armazenamento */ } },
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

  /* ================= Telas ================= */
  let current = 'home';
  function show(id) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === 's-' + id));
    current = id;
    document.getElementById('backLink').hidden = id !== 'home';
    document.getElementById('menuBack').hidden = id === 'home';
    window.scrollTo(0, 0);
    syncTimer();
  }
  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
  }
  async function share(text) {
    try {
      if (navigator.share && matchMedia('(pointer: coarse)').matches) { await navigator.share({ text }); return; }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    try { await navigator.clipboard.writeText(text); toast('Resultado copiado!'); }
    catch {
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); toast('Resultado copiado!'); } catch { toast('Não deu para copiar automaticamente.'); }
      ta.remove();
    }
  }

  /* ================= Menu ================= */
  function renderHome() {
    pauseTimer();
    $('#barRight').textContent = '';
    $('#sizes').innerHTML = Object.entries(SIZES).map(([n, label]) => {
      const best = store.get('best:' + n);
      return `<button class="size" data-size="${n}"><strong>${label}<small>${n}×${n}</small></strong>
        <span>${best ? `Melhor tempo ${fmtTime(best)}` : 'Sem recorde ainda'}</span></button>`;
    }).join('');
    const daily = store.get('daily:' + todayKey());
    $('#dailyText').textContent = daily
      ? `Ligado hoje em ${fmtTime(daily.time)}${daily.hints ? ` com ${daily.hints} ${daily.hints === 1 ? 'dica' : 'dicas'}` : ''}. Um novo mapa amanhã.`
      : `${dateLabel(todayKey())} · ${DAILY_SIZE}×${DAILY_SIZE}. O mesmo mapa para todo mundo hoje.`;
    $('#dailyBtn').textContent = daily ? 'Ver resultado' : 'Jogar o de hoje';
    const save = store.get('save');
    if (save && !save.won) {
      const done = save.islands.filter((_, i) => degree(save, i) === save.islands[i].v).length;
      $('#resumeTitle').textContent = save.daily ? `Mapa do dia (${dateLabel(save.daily)})` : `${SIZES[save.n]} ${save.n}×${save.n}`;
      $('#resumeInfo').textContent = `${fmtTime(save.elapsed / 1000)} · ${done} de ${save.islands.length} ilhas completas`;
      $('#resumeBtn').hidden = false;
    } else $('#resumeBtn').hidden = true;
    show('home');
  }

  $('#sizes').addEventListener('click', (e) => {
    const b = e.target.closest('[data-size]');
    if (b) confirmReplace(() => newGame(+b.dataset.size));
  });
  $('#dailyBtn').addEventListener('click', () => {
    const done = store.get('daily:' + todayKey());
    if (done) { showWin({ n: DAILY_SIZE, daily: todayKey(), ...done }, false); return; }
    const save = store.get('save');
    if (save && !save.won && save.daily === todayKey()) { resume(save); return; }
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
    const save = store.get('save');
    const busy = save && !save.won && save.counts.some((v) => v > 0);
    if (!busy || Date.now() - pendingReplace < 4000) { pendingReplace = 0; fn(); return; }
    pendingReplace = Date.now();
    toast('Você tem um mapa em andamento. Toque de novo para começar outro.');
  }

  /* ================= Estado ================= */
  let game = null; // { n, islands, edges, solution, counts, daily, elapsed, hints, won }
  let history = [];
  let cross = [], nb = [], selected = -1, focusIsl = -1;

  function newGame(n, daily = null) {
    const rnd = daily ? mulberry32(hashStr('jogateca-pontes-' + daily)) : Math.random;
    const g = E.generate(n, rnd);
    game = { n, islands: g.islands, edges: g.edges, solution: g.solution, counts: g.edges.map(() => 0), daily, elapsed: 0, hints: 0, won: false };
    history = [];
    startPlay();
  }
  function resume(s) { game = s; history = []; startPlay(); }
  function startPlay() {
    selected = -1; focusIsl = -1;
    $('#paused').hidden = true;
    $('#map').style.visibility = '';
    prepare();
    show('play');
    render();
    save();
  }
  const save = () => { if (game && !game.won) store.set('save', game); };
  const degree = (g, i) => g.edges.reduce((s, e, k) => s + (e.a === i || e.b === i ? g.counts[k] : 0), 0);

  // Cruzamentos e vizinhos de cada ilha por direção (0 dir., 1 baixo, 2 esq., 3 cima).
  function prepare() {
    const { crosses } = E.buildEdges(game.n, game.islands);
    cross = crosses;
    nb = game.islands.map(() => [-1, -1, -1, -1]);
    game.edges.forEach((e, k) => {
      const A = game.islands[e.a], B = game.islands[e.b];
      if (A.r === B.r) { nb[e.a][0] = k; nb[e.b][2] = k; } else { nb[e.a][1] = k; nb[e.b][3] = k; }
    });
    buildMap();
  }

  /* ================= Cronômetro ================= */
  let tick = null, lastT = 0, sinceSave = 0;
  const running = () => game && !game.won && current === 'play' && $('#paused').hidden && document.visibilityState === 'visible';
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
    $('#map').style.visibility = p ? 'hidden' : '';
    syncTimer();
  }
  $('#pauseBtn').addEventListener('click', () => setPaused($('#paused').hidden));
  $('#resumePlay').addEventListener('click', () => setPaused(false));

  /* ================= Desenho ================= */
  const el = (tag, attrs = {}, parent = null) => {
    const x = document.createElementNS(SVGNS, tag);
    for (const [k, v] of Object.entries(attrs)) x.setAttribute(k, v);
    if (parent) parent.appendChild(x);
    return x;
  };
  const center = (s) => [s.c + 0.5, s.r + 0.5];
  // Pontes de tábuas: uma ou duas, encurtadas para não entrar nas ilhas.
  function bridgeSvg(g, k, count, parent, cls = 'bridge') {
    const e = g.edges[k], A = g.islands[e.a], B = g.islands[e.b];
    const [ax, ay] = center(A), [bx, by] = center(B);
    const horiz = A.r === B.r;
    const ux = horiz ? 1 : 0, uy = horiz ? 0 : 1;
    const x1 = ax + ux * 0.4, y1 = ay + uy * 0.4, x2 = bx - ux * 0.4, y2 = by - uy * 0.4;
    const grp = el('g', { class: cls, 'data-k': k }, parent);
    const offs = count === 2 ? [-0.11, 0.11] : [0];
    for (const o of offs) {
      const dx = horiz ? 0 : o, dy = horiz ? o : 0;
      const w = count === 2 ? 0.12 : 0.17;
      el('line', { class: 'plank', x1: x1 + dx, y1: y1 + dy, x2: x2 + dx, y2: y2 + dy, 'stroke-width': w }, grp);
      el('line', { class: 'seam', x1: x1 + dx, y1: y1 + dy, x2: x2 + dx, y2: y2 + dy, 'stroke-width': w * 0.62 }, grp);
    }
    return grp;
  }

  let layers = {};
  function buildMap() {
    const svg = $('#map'), n = game.n;
    svg.setAttribute('viewBox', `${-PAD} ${-PAD} ${n + 2 * PAD} ${n + 2 * PAD}`);
    svg.innerHTML = '';
    svg.classList.remove('celebrate');
    layers.dots = el('g', {}, svg);
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) el('circle', { class: 'dot', cx: c + 0.5, cy: r + 0.5, r: 0.035 }, layers.dots);
    layers.bridges = el('g', {}, svg);
    layers.hits = el('g', {}, svg);
    game.edges.forEach((e, k) => {
      const A = game.islands[e.a], B = game.islands[e.b];
      const horiz = A.r === B.r;
      const x = horiz ? A.c + 0.95 : A.c + 0.18, y = horiz ? A.r + 0.18 : A.r + 0.95;
      const w = horiz ? B.c - A.c - 0.9 : 0.64, h = horiz ? 0.64 : B.r - A.r - 0.9;
      el('rect', { class: 'hit', x, y, width: Math.max(0.1, w), height: Math.max(0.1, h), 'data-k': k }, layers.hits);
    });
    layers.ghost = el('g', {}, svg);
    layers.islands = el('g', {}, svg);
    game.islands.forEach((s, i) => {
      const g = el('g', { class: 'isl', 'data-i': i }, layers.islands);
      const [cx, cy] = center(s);
      el('circle', { class: 'ring', cx, cy, r: 0.47, 'stroke-width': 0.05 }, g);
      el('circle', { class: 'body', cx, cy, r: 0.38, 'stroke-width': 0.07 }, g);
      const t = el('text', { x: cx, y: cy + 0.02, 'font-size': 0.44 }, g);
      t.textContent = s.v;
      g.style.setProperty('--d', `${(s.r + s.c) * 40}ms`);
    });
  }

  function render() {
    if (!game) return;
    layers.bridges.innerHTML = '';
    game.counts.forEach((c, k) => { if (c) bridgeSvg(game, k, c, layers.bridges); });
    let done = 0;
    game.islands.forEach((s, i) => {
      const d = degree(game, i);
      const g = layers.islands.children[i];
      g.classList.toggle('done', d === s.v);
      g.classList.toggle('over', d > s.v);
      g.classList.toggle('sel', i === selected);
      g.classList.toggle('focus', i === focusIsl);
      g.setAttribute('aria-label', `Ilha ${s.v}, ${d} ${d === 1 ? 'ponte' : 'pontes'}`);
      if (d === s.v) done++;
    });
    const total = game.islands.length;
    $('#infoTitle').textContent = game.daily ? `Do dia · ${game.n}×${game.n}` : `${SIZES[game.n]} · ${game.n}×${game.n}`;
    $('#infoDone').textContent = `${done}/${total}`;
    $('#timer').textContent = fmtTime(game.elapsed / 1000);
    const st = $('#status');
    const over = game.islands.some((s, i) => degree(game, i) > s.v);
    let msg = '', bad = false;
    if (over) { msg = 'Uma ilha está com pontes demais.'; bad = true; }
    else if (done === total && !E.isConnected(total, game.edges, game.counts)) { msg = 'Todas as ilhas precisam formar um só caminho.'; bad = true; }
    else if (!game.counts.some(Boolean)) msg = 'Arraste de uma ilha na direção da vizinha para pôr uma ponte.';
    else msg = `Faltam ${total - done} ${total - done === 1 ? 'ilha' : 'ilhas'}.`;
    st.textContent = msg;
    st.classList.toggle('bad', bad);
    $('#undoBtn').disabled = history.length === 0;
  }

  /* ================= Jogadas ================= */
  // Ciclo de cada par: nenhuma → uma → duas → nenhuma. Pontes não podem cruzar outras.
  function cycle(k) {
    if (!game || game.won || k < 0) return;
    const prev = game.counts[k];
    const next = (prev + 1) % 3;
    if (prev === 0) {
      const blocking = cross[k].filter((x) => game.counts[x] > 0);
      if (blocking.length) {
        toast('Pontes não podem se cruzar.');
        render();
        blocking.forEach((x) => {
          const g = layers.bridges.querySelector(`[data-k="${x}"]`);
          if (g) { g.classList.add('flash'); setTimeout(() => g.classList.remove('flash'), 700); }
        });
        return;
      }
    }
    game.counts[k] = next;
    history.push([k, prev]);
    if (history.length > 400) history.shift();
    render(); save(); checkWin();
  }
  function undo() {
    const h = history.pop();
    if (!h || !game || game.won) return;
    game.counts[h[0]] = h[1];
    render(); save();
  }
  function restart() {
    if (!game || game.won || !game.counts.some(Boolean)) return;
    game.counts.forEach((v, k) => { if (v) { history.push([k, v]); game.counts[k] = 0; } });
    render(); save();
    toast('Mapa limpo. Dá para desfazer, ponte por ponte.');
  }

  const svg = $('#map');
  const point = (e) => {
    const r = svg.getBoundingClientRect();
    const span = game.n + 2 * PAD;
    return [((e.clientX - r.left) / r.width) * span - PAD, ((e.clientY - r.top) / r.height) * span - PAD];
  };
  const islandAt = (x, y) => game.islands.findIndex((s) => Math.hypot(s.c + 0.5 - x, s.r + 0.5 - y) < 0.5);
  // Toque no mar: escolhe o par mais próximo. Num cruzamento, prefere a ponte que já existe,
  // depois a que pode ser construída (sem cruzar outra) e, por fim, a mais curta.
  const edgeAt = (x, y) => {
    let best = -1, bestScore = Infinity;
    game.edges.forEach((e, k) => {
      const A = game.islands[e.a], B = game.islands[e.b];
      const horiz = A.r === B.r;
      const dist = horiz ? Math.abs(y - (A.r + 0.5)) : Math.abs(x - (A.c + 0.5));
      const inside = horiz ? x > A.c + 0.9 && x < B.c + 0.1 : y > A.r + 0.9 && y < B.r + 0.1;
      if (!inside || dist >= 0.36) return;
      const blocked = game.counts[k] === 0 && cross[k].some((j) => game.counts[j] > 0);
      const len = Math.abs(B.r - A.r) + Math.abs(B.c - A.c);
      const score = dist * 100 + (game.counts[k] > 0 ? 0 : blocked ? 20 : 10) + len * 0.01;
      if (score < bestScore) { bestScore = score; best = k; }
    });
    return best;
  };
  const dirOf = (dx, dy) => (Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 0 : 2) : (dy > 0 ? 1 : 3));
  const otherEnd = (k, i) => (game.edges[k].a === i ? game.edges[k].b : game.edges[k].a);

  let press = null;
  function showGhost(k) {
    layers.ghost.innerHTML = '';
    layers.islands.querySelectorAll('.target').forEach((g) => g.classList.remove('target'));
    if (k < 0 || !press) return;
    const e = game.edges[k];
    const A = game.islands[e.a], B = game.islands[e.b];
    el('line', { class: 'ghost', x1: A.c + 0.5, y1: A.r + 0.5, x2: B.c + 0.5, y2: B.r + 0.5, 'stroke-width': 0.08 }, layers.ghost);
    layers.islands.children[otherEnd(k, press.i)].classList.add('target');
  }
  svg.addEventListener('pointerdown', (e) => {
    if (!game || game.won || e.button > 0) return;
    const [x, y] = point(e);
    const i = islandAt(x, y);
    e.preventDefault();
    svg.setPointerCapture(e.pointerId);
    focusIsl = -1;
    if (i >= 0) press = { kind: 'island', i, x0: x, y0: y, k: -1 };
    else press = { kind: 'edge', k: edgeAt(x, y) };
  });
  svg.addEventListener('pointermove', (e) => {
    if (!press || press.kind !== 'island') return;
    if (e.pointerType === 'mouse' && e.buttons === 0) { endPress(e); return; }
    const [x, y] = point(e);
    const dx = x - press.x0, dy = y - press.y0;
    const k = Math.hypot(dx, dy) > 0.42 ? nb[press.i][dirOf(dx, dy)] : -1;
    if (k !== press.k) { press.k = k; press.moved = true; showGhost(k); }
    if (Math.hypot(dx, dy) > 0.42) press.moved = true;
  });
  function endPress() {
    if (!press) return;
    const p = press;
    press = null;
    showGhost(-1);
    if (p.kind === 'edge') { selected = -1; cycle(p.k); render(); return; }
    if (p.k >= 0) { selected = -1; cycle(p.k); return; }
    if (p.moved) { render(); return; }
    // Toque simples: escolhe a ilha; tocar numa vizinha em seguida liga as duas.
    if (selected >= 0 && selected !== p.i) {
      const k = nb[selected].find((x) => x >= 0 && otherEnd(x, selected) === p.i);
      selected = -1;
      if (k !== undefined) { cycle(k); return; }
      selected = p.i;
    } else selected = selected === p.i ? -1 : p.i;
    render();
  }
  svg.addEventListener('pointerup', endPress);
  svg.addEventListener('pointercancel', () => { press = null; showGhost(-1); });
  svg.addEventListener('contextmenu', (e) => e.preventDefault());

  // Dica: corrige uma ponte a mais; senão, mostra uma ponte que já dá para deduzir.
  function hint() {
    if (!game || game.won) return;
    const { counts, solution } = game;
    const extra = counts.findIndex((v, k) => v > solution[k]);
    game.hints++;
    if (extra >= 0) {
      history.push([extra, counts[extra]]);
      counts[extra] = solution[extra];
      toast(solution[extra] ? 'Aqui vai só uma ponte.' : 'Essa ponte não faz parte do mapa.');
      render(); save();
      flashBridge(extra);
      return;
    }
    const res = E.logicSolve(game.n, game.islands, counts);
    let k = res.bridges.findIndex((v, x) => v > counts[x]);
    if (k < 0) k = solution.findIndex((v, x) => v > counts[x]);
    if (k < 0) return;
    history.push([k, counts[k]]);
    counts[k] += 1;
    toast('Esta ponte é certa.');
    render(); save(); flashBridge(k); checkWin();
  }
  function flashBridge(k) {
    const g = layers.bridges.querySelector(`[data-k="${k}"]`);
    if (!g) return;
    g.querySelectorAll('.plank').forEach((l) => l.animate([{ stroke: '#ffd166' }, { stroke: '#8b5a2b' }], { duration: 1200 }));
  }

  $('#undoBtn').addEventListener('click', undo);
  $('#hintBtn').addEventListener('click', hint);
  $('#clearBtn').addEventListener('click', restart);

  // Teclado: setas escolhem a ilha; Shift + seta põe/tira ponte naquela direção.
  document.addEventListener('keydown', (e) => {
    if (current !== 'play' || !game || game.won) return;
    if (!$('#paused').hidden) { if (['Enter', ' ', 'p', 'P'].includes(e.key)) { e.preventDefault(); setPaused(false); } return; }
    const dirs = { ArrowRight: 0, ArrowDown: 1, ArrowLeft: 2, ArrowUp: 3 };
    if (e.key in dirs) {
      e.preventDefault();
      const d = dirs[e.key];
      if (focusIsl < 0) { focusIsl = 0; render(); return; }
      if (e.shiftKey) { cycle(nb[focusIsl][d]); return; }
      let to = nb[focusIsl][d] >= 0 ? otherEnd(nb[focusIsl][d], focusIsl) : -1;
      if (to < 0) { // ilha mais próxima naquela direção
        const s = game.islands[focusIsl];
        let best = Infinity;
        game.islands.forEach((t, j) => {
          const dx = t.c - s.c, dy = t.r - s.r;
          const ok = [dx > 0, dy > 0, dx < 0, dy < 0][d] && Math.abs(d % 2 ? dx : dy) <= Math.abs(d % 2 ? dy : dx);
          const dist = Math.abs(dx) + Math.abs(dy);
          if (ok && dist < best) { best = dist; to = j; }
        });
      }
      if (to >= 0) focusIsl = to;
      render();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const low = e.key.toLowerCase();
    if (low === 'z' || low === 'u') undo();
    else if (low === 'h') hint();
    else if (low === 'p') setPaused(true);
  });

  /* ================= Vitória ================= */
  function checkWin() {
    if (!game || game.won) return;
    const ok = game.islands.every((s, i) => degree(game, i) === s.v) && E.isConnected(game.islands.length, game.edges, game.counts);
    if (!ok) return;
    pauseTimer();
    game.won = true;
    const time = Math.round(game.elapsed / 1000);
    let prevBest = null;
    const snapshot = { islands: game.islands, edges: game.edges, counts: game.counts };
    if (game.daily) {
      if (!store.get('daily:' + game.daily)) store.set('daily:' + game.daily, { time, hints: game.hints, ...snapshot });
    } else {
      prevBest = store.get('best:' + game.n);
      if (!game.hints && (!prevBest || time < prevBest)) store.set('best:' + game.n, time);
    }
    store.del('save');
    $('#map').classList.add('celebrate');
    const r = { n: game.n, daily: game.daily, time, hints: game.hints, ...snapshot };
    setTimeout(() => showWin(r, true, prevBest), 1500);
  }

  function showWin(r, fresh, prevBest = null) {
    show('win');
    $('#winEyebrow').textContent = r.daily ? `Mapa do dia · ${dateLabel(r.daily)}` : `${SIZES[r.n]} · ${r.n}×${r.n}`;
    const box = $('#winMap');
    box.innerHTML = '';
    if (r.islands) {
      const s = el('svg', { viewBox: `${-PAD} ${-PAD} ${r.n + 2 * PAD} ${r.n + 2 * PAD}` }, box);
      const g = { islands: r.islands, edges: r.edges };
      r.counts.forEach((c, k) => { if (c) bridgeSvg(g, k, c, s).querySelectorAll('line').forEach((l) => l.setAttribute('stroke', l.classList.contains('plank') ? '#8b5a2b' : '#c08a52')); });
      r.islands.forEach((isl) => {
        el('circle', { cx: isl.c + 0.5, cy: isl.r + 0.5, r: 0.38, fill: '#cfe8a8', stroke: '#4e9a3c', 'stroke-width': 0.07 }, s);
      });
      s.querySelectorAll('.seam').forEach((l) => l.setAttribute('stroke-dasharray', '.07 .09'));
    }
    $('#winTime').textContent = fmtTime(r.time);
    let sub;
    if (r.daily) sub = fresh ? 'O mesmo mapa para todo mundo hoje. Compare o tempo!' : 'Você já ligou o mapa de hoje. Um novo amanhã.';
    else if (r.hints) sub = `Com ${r.hints} ${r.hints === 1 ? 'dica' : 'dicas'}. Partidas com dica não contam para o recorde.`;
    else if (!prevBest) sub = 'Primeiro recorde neste mar!';
    else if (r.time < prevBest) sub = `Novo recorde! Antes: ${fmtTime(prevBest)}`;
    else sub = `Seu recorde: ${fmtTime(prevBest)}`;
    $('#winSub').textContent = sub;
    const nextSize = r.daily ? DAILY_SIZE : r.n;
    $('#winNext').textContent = `Novo mapa ${nextSize}×${nextSize}`;
    $('#winNext').onclick = () => newGame(nextSize);
    $('#winShare').onclick = () => share(
      `Pontes${r.daily ? ` · mapa do dia ${dateLabel(r.daily)}` : ` · ${SIZES[r.n]}`} (${r.n}×${r.n})\n🌉 ${fmtTime(r.time)}${r.hints ? ` · ${r.hints} ${r.hints === 1 ? 'dica' : 'dicas'}` : ' · sem dicas'}\n${location.origin}${location.pathname}`,
    );
  }
  $('#winHome').addEventListener('click', renderHome);

  /* ================= Início ================= */
  renderHome();
  const mode = new URLSearchParams(location.search).get('mode');
  if (mode === 'diario') $('#dailyBtn').click();
  else if (mode === 'continuar' && store.get('save')) resume(store.get('save'));
  else if (SIZES[mode]) confirmReplace(() => newGame(+mode));
})();
