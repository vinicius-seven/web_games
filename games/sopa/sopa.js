(() => {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const E = window.SopaEngine;
  const LIST = window.SopaPalavras;
  const SIZES = { 4: { label: '4×4', min: 45 }, 5: { label: '5×5', min: 110 } };
  const TIMES = [90, 120, 180];

  const store = {
    get(k, d = null) { try { const v = localStorage.getItem('sopa:' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem('sopa:' + k, JSON.stringify(v)); } catch { /* sem armazenamento */ } },
  };
  function mulberry32(seed) {
    return () => {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const plural = (k, one, many) => `${k} ${k === 1 ? one : many}`;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
  }

  /* ================= Telas e opções ================= */
  let current = 'home';
  function show(id) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === 's-' + id));
    current = id;
    $('#backLink').hidden = id !== 'home';
    $('#menuBack').hidden = id === 'home';
    window.scrollTo(0, 0);
  }
  let size = store.get('size', 4), time = store.get('time', 120);
  const cfgKey = () => `${size}-${time}`;
  function renderHome() {
    stopClock();
    $('#optSize').innerHTML = Object.entries(SIZES).map(([n, s]) => `<button class="chip${+n === size ? ' on' : ''}" data-size="${n}">${s.label}</button>`).join('');
    $('#optTime').innerHTML = TIMES.map((t) => `<button class="chip${t === time ? ' on' : ''}" data-time="${t}">${fmt(t)}</button>`).join('');
    const best = store.get('best:' + cfgKey());
    $('#soloInfo').textContent = best ? `Recorde nesta tigela e tempo: ${best} pontos.` : 'Bata o seu próprio recorde.';
    show('home');
  }
  $('#optSize').addEventListener('click', (e) => { const b = e.target.closest('[data-size]'); if (b) { size = +b.dataset.size; store.set('size', size); renderHome(); } });
  $('#optTime').addEventListener('click', (e) => { const b = e.target.closest('[data-time]'); if (b) { time = +b.dataset.time; store.set('time', time); renderHome(); } });
  const toMenu = () => { if (round && !round.over && !confirmLeave()) return; round = null; renderHome(); };
  let leaveArm = 0;
  function confirmLeave() {
    if (Date.now() - leaveArm < 3000) return true;
    leaveArm = Date.now();
    toast('A rodada está valendo. Toque de novo para sair.');
    return false;
  }
  $('#homeBtn').addEventListener('click', toMenu);
  $('#menuBack').addEventListener('click', toMenu);
  $('#endMenu').addEventListener('click', renderHome);

  /* ================= Rodada ================= */
  // round: { n, grid, all (Map), found [palavras], score, ends (ms), over, onEnd }
  let round = null;
  function newBoard(seed) {
    const rnd = mulberry32(seed);
    const g = E.generate(size, rnd, LIST, SIZES[size].min);
    const rot = g.grid.map(() => Math.round((rnd() - 0.5) * 12));
    return { n: size, grid: g.grid, all: g.words, rot, seed };
  }
  function play(board, who, onEnd) {
    round = { ...board, found: [], score: 0, ends: performance.now() + time * 1000, over: false, onEnd, who };
    show('play');
    $('#who').textContent = who || 'Sozinho';
    buildTiles();
    renderFound();
    setWord('');
    startClock();
  }

  let cellEls = [];
  function buildTiles() {
    const { n, grid, rot } = round;
    const t = $('#tiles');
    t.style.gridTemplateColumns = `repeat(${n}, 1fr)`;
    t.innerHTML = grid.map((l, i) => `<button class="tile${l === 'qu' ? ' qu' : ''}" data-i="${i}" style="--rot:${rot[i]}deg" aria-label="${l.toUpperCase()}">${l === 'qu' ? 'Qu' : l.toUpperCase()}</button>`).join('');
    cellEls = [...t.children];
    $('#trail').setAttribute('viewBox', `0 0 ${n} ${n}`);
    $('#trail').setAttribute('preserveAspectRatio', 'none');
    sizeTiles();
  }
  function sizeTiles() {
    const w = $('#tiles').clientWidth;
    if (w && round) $('#bowl').style.setProperty('--fs', `${Math.round((w / round.n) * 0.5)}px`);
  }
  if ('ResizeObserver' in window) new ResizeObserver(sizeTiles).observe($('#tiles'));

  let tickId = null;
  function startClock() {
    stopClock();
    const step = () => {
      if (!round || round.over) return;
      const left = Math.max(0, (round.ends - performance.now()) / 1000);
      const el = $('#clock');
      el.textContent = fmt(Math.ceil(left));
      el.classList.toggle('low', left <= 10);
      if (left <= 0) endRound();
    };
    step();
    tickId = setInterval(step, 200);
  }
  function stopClock() { if (tickId) clearInterval(tickId); tickId = null; }

  /* ================= Seleção ================= */
  let path = [], typed = '';
  const wordOf = (p) => p.map((i) => round.grid[i]).join('');
  function setWord(text, cls = '') {
    const w = $('#word');
    w.textContent = text || ' ';
    w.className = 'word' + (cls ? ' ' + cls : '');
  }
  function drawPath() {
    cellEls.forEach((el, i) => el.classList.toggle('on', path.includes(i)));
    const n = round.n;
    const pts = path.map((i) => `${(i % n) + 0.5},${Math.floor(i / n) + 0.5}`).join(' ');
    $('#trail').innerHTML = path.length > 1 ? `<polyline points="${pts}" stroke-width="${0.16}"/>` : '';
    setWord(wordOf(path).toUpperCase());
  }
  const adjacent = (a, b) => { const n = round.n; return a !== b && Math.abs(Math.floor(a / n) - Math.floor(b / n)) <= 1 && Math.abs((a % n) - (b % n)) <= 1; };
  // Casa sob o dedo, só se o dedo estiver perto do centro (facilita andar na diagonal).
  function tileAt(x, y) {
    const r = $('#tiles').getBoundingClientRect(), n = round.n;
    const fx = ((x - r.left) / r.width) * n, fy = ((y - r.top) / r.height) * n;
    const c = Math.floor(fx), rr = Math.floor(fy);
    if (c < 0 || rr < 0 || c >= n || rr >= n) return -1;
    return Math.hypot(fx - (c + 0.5), fy - (rr + 0.5)) < 0.42 ? rr * n + c : -1;
  }
  const bowl = $('#bowl');
  let dragging = false;
  bowl.addEventListener('pointerdown', (e) => {
    if (!round || round.over) return;
    const i = tileAt(e.clientX, e.clientY);
    if (i < 0) return;
    e.preventDefault();
    bowl.setPointerCapture(e.pointerId);
    dragging = true; typed = '';
    path = [i];
    drawPath();
  });
  bowl.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const i = tileAt(e.clientX, e.clientY);
    if (i < 0) return;
    const last = path[path.length - 1];
    if (i === last) return;
    if (path.length > 1 && i === path[path.length - 2]) { path.pop(); drawPath(); return; }
    if (path.includes(i) || !adjacent(last, i)) return;
    path.push(i);
    drawPath();
  });
  const release = () => {
    if (!dragging) return;
    dragging = false;
    submit(wordOf(path));
    path = [];
    setTimeout(() => { if (!dragging && round && !round.over) { drawPathKeepWord(); } }, 0);
  };
  function drawPathKeepWord() { cellEls.forEach((el) => el.classList.remove('on')); $('#trail').innerHTML = ''; }
  bowl.addEventListener('pointerup', release);
  bowl.addEventListener('pointercancel', release);
  bowl.addEventListener('lostpointercapture', release);
  bowl.addEventListener('contextmenu', (e) => e.preventDefault());

  // Teclado (computador): digita e aperta Enter.
  document.addEventListener('keydown', (e) => {
    if (current !== 'play' || !round || round.over || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      const w = typed; typed = '';
      const p = E.findPath(round.grid, round.n, w);
      if (w.length >= 3 && !p) { setWord(w.toUpperCase(), 'bad'); toast('Essa não dá para formar na tigela.'); return; }
      path = p || []; drawPath(); path = [];
      submit(w);
      setTimeout(drawPathKeepWord, 350);
      return;
    }
    if (e.key === 'Backspace') { typed = typed.slice(0, -1); setWord(typed.toUpperCase()); return; }
    const ch = e.key.length === 1 ? E.norm(e.key) : '';
    if (/^[a-z]$/.test(ch) && typed.length < 16) { typed += ch; setWord(typed.toUpperCase()); }
  });

  function submit(w) {
    if (!round || round.over) return;
    if (w.length < 3) { if (w.length) setWord(w.toUpperCase(), 'bad'); return; }
    if (round.found.includes(w)) { setWord(w.toUpperCase(), 'dup'); toast('Essa você já achou.'); return; }
    if (!round.all.has(w)) { setWord(w.toUpperCase(), 'bad'); return; }
    round.found.push(w);
    const pts = E.points(w.length);
    round.score += pts;
    setWord(`${w.toUpperCase()} +${pts}`, 'ok');
    renderFound(w);
  }
  function renderFound(fresh) {
    $('#score').textContent = round.score;
    $('#count').textContent = plural(round.found.length, 'palavra', 'palavras');
    const words = round.found.slice().reverse();
    $('#found').innerHTML = words.map((w) => `<span class="${w === fresh ? 'new' : ''}">${esc(display(w))}<small>+${E.points(w.length)}</small></span>`).join('');
  }
  const display = (w) => (E.dict(LIST).words.get(w) || w);

  function endRound() {
    if (!round || round.over) return;
    round.over = true;
    stopClock();
    dragging = false; path = [];
    const r = round;
    setTimeout(() => r.onEnd(r), 300);
  }

  /* ================= Sozinho ================= */
  function solo() {
    const board = newBoard((Math.random() * 2 ** 31) | 0);
    play(board, '', (r) => {
      const key = 'best:' + cfgKey();
      const best = store.get(key, 0);
      if (r.score > best) store.set(key, r.score);
      show('end');
      $('#endScore').textContent = r.score;
      const total = [...r.all.keys()].reduce((s, w) => s + E.points(w.length), 0);
      $('#endSub').textContent = `${plural(r.found.length, 'palavra', 'palavras')} de ${r.all.size} possíveis. ${r.score > best ? (best ? `Novo recorde! Antes: ${best}.` : 'Primeiro recorde!') : `Recorde: ${best}.`}`;
      $('#endWords').innerHTML = r.found.slice().sort((a, b) => b.length - a.length).map((w) => `<span>${esc(display(w))}</span>`).join('');
      const missed = [...r.all.keys()].filter((w) => !r.found.includes(w)).sort((a, b) => b.length - a.length).slice(0, 10);
      $('#endMissed').textContent = missed.length ? `Dava para achar também: ${missed.map(display).join(', ')}… (a tigela valia ${total} pontos)` : 'Você achou tudo!';
      $('#againBtn').onclick = solo;
    });
  }
  $('#soloBtn').addEventListener('click', solo);

  /* ================= Duelo ================= */
  const D = window.Duelo;
  let duel = null; // { names, board, i, results }
  function duelSetup() {
    show('duel');
    D.setup({
      el: $('#duel'), game: 'sopa', title: 'Duelo na Sopa',
      text: `Todo mundo recebe a mesma tigela (${SIZES[size].label}, ${fmt(time)} cada um). O placar só aparece no fim.`,
      onStart: (names) => startDuel(names),
      onBack: renderHome,
    });
  }
  function startDuel(names) {
    duel = { names, board: newBoard((Math.random() * 2 ** 31) | 0), i: 0, results: [] };
    nextTurn();
  }
  function nextTurn() {
    show('duel');
    D.handoff({
      el: $('#duel'), name: duel.names[duel.i], index: duel.i, total: duel.names.length,
      info: `Tigela ${SIZES[size].label} · ${fmt(time)} para achar palavras.`,
      onGo: () => play(duel.board, duel.names[duel.i], (r) => {
        const longest = r.found.slice().sort((a, b) => b.length - a.length)[0];
        duel.results.push({ name: duel.names[duel.i], score: r.score, detail: `${plural(r.found.length, 'palavra', 'palavras')}${longest ? ` · maior: ${esc(display(longest).toUpperCase())}` : ''}`, found: r.found });
        duel.i++;
        if (duel.i < duel.names.length) nextTurn();
        else finishDuel();
      }),
    });
  }
  function finishDuel() {
    show('duel');
    // palavras que só uma pessoa achou ganham destaque no detalhe
    const counts = {};
    duel.results.forEach((p) => p.found.forEach((w) => { counts[w] = (counts[w] || 0) + 1; }));
    duel.results.forEach((p) => {
      const only = p.found.filter((w) => counts[w] === 1).length;
      if (duel.results.length > 1) p.detail += ` · ${only} que ninguém mais achou`;
    });
    D.results({
      el: $('#duel'), game: 'sopa', players: duel.results, unit: 'pontos',
      onRematch: () => startDuel(duel.names),
      onNew: duelSetup,
      onMenu: renderHome,
    });
  }
  $('#duelBtn').addEventListener('click', duelSetup);

  /* ================= Início ================= */
  renderHome();
  const mode = new URLSearchParams(location.search).get('mode');
  if (mode === 'solo') solo();
  else if (mode === 'duelo') duelSetup();
})();
