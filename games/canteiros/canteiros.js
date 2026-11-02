(() => {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const { generate } = window.CanteirosEngine;
  const SIZES = {
    6: { label: 'Broto' },
    7: { label: 'Muda' },
    8: { label: 'Canteiro' },
    9: { label: 'Estufa' },
  };
  const DAILY_SIZE = 8;
  // Tons de flor e terra, distintos entre si e claros o bastante para a flor escura aparecer.
  const COLORS = ['#f2c14e', '#f4978e', '#9bd4a4', '#a9b7f0', '#d8b4e2', '#8ecae6', '#e5b89a', '#c5d86d', '#cfc6b8'];
  const EMPTY = 0, SEED = 1, FLOWER = 2;

  /* ================= Utilidades ================= */
  const store = {
    get(k, d = null) {
      try { const v = localStorage.getItem('canteiros:' + k); return v == null ? d : JSON.parse(v); }
      catch { return d; }
    },
    set(k, v) { try { localStorage.setItem('canteiros:' + k, JSON.stringify(v)); } catch { /* sem armazenamento */ } },
    del(k) { try { localStorage.removeItem('canteiros:' + k); } catch { /* sem armazenamento */ } },
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
  const FLOWER_SVG = '<svg aria-hidden="true"><use href="#flor"/></svg>';

  /* ================= Telas ================= */
  let current = 'home';
  function show(id) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === 's-' + id));
    current = id;
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
    $('#sizes').innerHTML = Object.entries(SIZES).map(([n, s]) => {
      const best = store.get('best:' + n);
      const wins = store.get('wins:' + n, 0);
      return `<button class="size" data-size="${n}">
        <strong>${s.label}<small>${n}×${n}</small></strong>
        <span>${best ? `Melhor tempo ${fmtTime(best)}` : 'Sem recorde ainda'}${wins ? ` · ${wins} ${wins === 1 ? 'jardim' : 'jardins'}` : ''}</span>
      </button>`;
    }).join('');

    const daily = store.get('daily:' + todayKey());
    $('#dailyText').textContent = daily
      ? `Plantado hoje em ${fmtTime(daily.time)}${daily.hints ? ` com ${daily.hints} ${daily.hints === 1 ? 'dica' : 'dicas'}` : ''}. Um novo jardim nasce à meia-noite.`
      : `${dateLabel(todayKey())} · ${DAILY_SIZE}×${DAILY_SIZE}. O mesmo jardim para todo mundo hoje.`;
    $('#dailyBtn').textContent = daily ? 'Ver resultado' : 'Jogar o de hoje';

    const save = store.get('save');
    if (save && !save.won) {
      const flowers = save.cells.filter((v) => v === FLOWER).length;
      $('#resumeTitle').textContent = save.daily ? `Jardim do dia (${dateLabel(save.daily)})` : `${SIZES[save.n].label} ${save.n}×${save.n}`;
      $('#resumeInfo').textContent = `${fmtTime(save.elapsed / 1000)} · ${flowers} de ${save.n} flores`;
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
  $('#homeBtn').addEventListener('click', renderHome);

  let pendingReplace = 0;
  function confirmReplace(fn) {
    const save = store.get('save');
    const busy = save && !save.won && save.cells.some((v) => v !== EMPTY);
    if (!busy || Date.now() - pendingReplace < 4000) { pendingReplace = 0; fn(); return; }
    pendingReplace = Date.now();
    toast('Você tem um jardim em andamento. Toque de novo para começar outro.');
  }

  /* ================= Estado ================= */
  let game = null; // { n, regions, solution, cells, daily, elapsed, hints, won }
  let history = [];
  let focus = 0;
  let autoMark = store.get('autoMark', false);

  function newGame(n, daily = null) {
    const rnd = daily ? mulberry32(hashStr('jogateca-canteiros-' + daily)) : Math.random;
    const { regions, solution } = generate(n, rnd);
    game = { n, regions, solution, cells: new Array(n * n).fill(EMPTY), daily, elapsed: 0, hints: 0, won: false };
    history = [];
    focus = 0;
    startPlay();
  }
  function resume(save) { game = save; history = []; focus = 0; startPlay(); }

  function startPlay() {
    $('#paused').hidden = true;
    $('#board').style.visibility = '';
    buildBoard();
    show('play');
    render();
    save();
  }
  const save = () => { if (game) store.set('save', game); };

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
    $('#board').style.visibility = p ? 'hidden' : '';
    $('#walls').style.visibility = p ? 'hidden' : '';
    syncTimer();
  }
  $('#pauseBtn').addEventListener('click', () => setPaused($('#paused').hidden));
  $('#resumePlay').addEventListener('click', () => setPaused(false));

  /* ================= Tabuleiro ================= */
  let cellEls = [];
  function buildBoard() {
    const { n, regions } = game;
    const board = $('#board');
    board.style.gridTemplateColumns = `repeat(${n}, 1fr)`;
    board.style.gridTemplateRows = `repeat(${n}, 1fr)`;
    board.innerHTML = '';
    cellEls = [];
    for (let i = 0; i < n * n; i++) {
      const c = document.createElement('button');
      c.className = 'cell';
      c.dataset.i = i;
      c.setAttribute('role', 'gridcell');
      c.style.setProperty('--rc', COLORS[regions[i]]);
      c.tabIndex = i === focus ? 0 : -1;
      board.appendChild(c);
      cellEls.push(c);
    }
    // Divisas entre canteiros, desenhadas por cima da grade.
    let lines = '';
    for (let r = 0; r < n; r++) {
      for (let col = 0; col < n; col++) {
        const i = r * n + col;
        if (col < n - 1 && regions[i] !== regions[i + 1]) lines += `<line x1="${col + 1}" y1="${r}" x2="${col + 1}" y2="${r + 1}"/>`;
        if (r < n - 1 && regions[i] !== regions[i + n]) lines += `<line x1="${col}" y1="${r + 1}" x2="${col + 1}" y2="${r + 1}"/>`;
      }
    }
    const walls = $('#walls');
    walls.setAttribute('viewBox', `0 0 ${n} ${n}`);
    walls.setAttribute('preserveAspectRatio', 'none');
    walls.innerHTML = `<g stroke-width="${n >= 9 ? 3 : 3.5}" vector-effect="non-scaling-stroke">${lines.replace(/<line /g, '<line vector-effect="non-scaling-stroke" ')}</g>`;
    walls.style.visibility = '';
  }

  // Conflitos: flores na mesma linha, coluna ou canteiro, ou encostadas (inclusive na diagonal).
  function analyze() {
    const { n, regions, cells } = game;
    const flowers = [];
    cells.forEach((v, i) => { if (v === FLOWER) flowers.push(i); });
    const bad = new Set();
    let reason = '';
    for (let a = 0; a < flowers.length; a++) {
      for (let b = a + 1; b < flowers.length; b++) {
        const i = flowers[a], j = flowers[b];
        const ri = Math.floor(i / n), ci = i % n, rj = Math.floor(j / n), cj = j % n;
        let why = '';
        if (Math.abs(ri - rj) <= 1 && Math.abs(ci - cj) <= 1) why = 'Duas flores estão encostadas.';
        else if (ri === rj) why = 'Duas flores na mesma linha.';
        else if (ci === cj) why = 'Duas flores na mesma coluna.';
        else if (regions[i] === regions[j]) why = 'Duas flores no mesmo canteiro.';
        if (why) { bad.add(i); bad.add(j); reason = reason || why; }
      }
    }
    // Casas onde uma flor já não cabe (para a marcação automática).
    const blocked = new Set();
    for (const f of flowers) {
      const rf = Math.floor(f / n), cf = f % n;
      for (let k = 0; k < n * n; k++) {
        if (k === f) continue;
        const r = Math.floor(k / n), c = k % n;
        if (r === rf || c === cf || regions[k] === regions[f] || (Math.abs(r - rf) <= 1 && Math.abs(c - cf) <= 1)) blocked.add(k);
      }
    }
    return { flowers, bad, reason, blocked };
  }

  function render() {
    if (!game) return;
    const { n, cells } = game;
    const { flowers, bad, reason, blocked } = analyze();
    for (let i = 0; i < n * n; i++) {
      const el = cellEls[i], v = cells[i];
      const wasFlower = el.classList.contains('flower');
      const autoSeed = autoMark && v === EMPTY && blocked.has(i);
      const kind = v === FLOWER ? 'flower' : v === SEED ? 'seed' : autoSeed ? 'auto' : 'empty';
      if (el.dataset.kind !== kind) {
        el.dataset.kind = kind;
        el.innerHTML = kind === 'flower' ? FLOWER_SVG : kind === 'seed' ? '<span class="seed"></span>' : kind === 'auto' ? '<span class="seed auto"></span>' : '';
      }
      el.classList.toggle('flower', v === FLOWER);
      if (v === FLOWER && !wasFlower) { el.classList.remove('flower'); void el.offsetWidth; el.classList.add('flower'); }
      el.classList.toggle('bad', bad.has(i));
      el.tabIndex = i === focus ? 0 : -1;
      const r = Math.floor(i / n) + 1, c = (i % n) + 1;
      el.setAttribute('aria-label', `Linha ${r}, coluna ${c}, canteiro ${game.regions[i] + 1}: ${v === FLOWER ? 'flor' : v === SEED ? 'marcada sem flor' : 'vazia'}${bad.has(i) ? ', em conflito' : ''}`);
    }
    $('#infoTitle').textContent = game.daily ? `Do dia · ${n}×${n}` : `${SIZES[n].label} · ${n}×${n}`;
    $('#infoFlowers').textContent = `${flowers.length}/${n}`;
    $('#timer').textContent = fmtTime(game.elapsed / 1000);
    const st = $('#status');
    st.classList.toggle('bad', !!reason);
    st.textContent = reason || (flowers.length ? `Faltam ${n - flowers.length} ${n - flowers.length === 1 ? 'flor' : 'flores'}.` : 'Toque para marcar, toque de novo para plantar.');
    $('#autoBtn').setAttribute('aria-pressed', String(autoMark));
    $('#autoState').textContent = autoMark ? 'lig.' : 'desl.';
    $('#undoBtn').disabled = history.length === 0;
    if (flowers.length === n && !bad.size) win();
  }

  /* ================= Jogadas ================= */
  let gesture = null; // { changes: Map(i -> estado anterior) }
  function setCell(i, v) {
    if (game.cells[i] === v) return;
    if (gesture && !gesture.changes.has(i)) gesture.changes.set(i, game.cells[i]);
    game.cells[i] = v;
  }
  function begin() { gesture = { changes: new Map() }; }
  function end() {
    if (gesture && gesture.changes.size) {
      history.push([...gesture.changes]);
      if (history.length > 400) history.shift();
    }
    gesture = null;
    render();
    save();
  }
  const cycle = (v) => (v === EMPTY ? SEED : v === SEED ? FLOWER : EMPTY);

  // Toque: alterna vazio → semente → flor → vazio. Arrastar: marca (ou desmarca) várias casas.
  const board = $('#board');
  let press = null;
  const cellAt = (x, y) => {
    const el = document.elementFromPoint(x, y);
    const c = el && el.closest && el.closest('.cell');
    return c && board.contains(c) ? +c.dataset.i : -1;
  };
  board.addEventListener('pointerdown', (e) => {
    if (!game || game.won || e.button > 0) return;
    if (press) finish();
    const i = cellAt(e.clientX, e.clientY);
    if (i < 0) return;
    e.preventDefault();
    board.setPointerCapture(e.pointerId);
    focus = i;
    const start = game.cells[i];
    press = { start: i, last: i, dragged: false, action: start === EMPTY ? SEED : start === SEED ? EMPTY : null };
    cellEls[i].classList.add('peek');
  });
  board.addEventListener('pointermove', (e) => {
    if (!press) return;
    if (e.pointerType === 'mouse' && e.buttons === 0) { finish(); return; } // soltou fora do tabuleiro
    const i = cellAt(e.clientX, e.clientY);
    if (i < 0 || i === press.last) return;
    press.last = i;
    if (press.action === null) return;
    if (!press.dragged) { press.dragged = true; begin(); setCell(press.start, press.action); }
    const v = game.cells[i];
    if (press.action === SEED && v === EMPTY) setCell(i, SEED);
    if (press.action === EMPTY && v === SEED) setCell(i, EMPTY);
    render();
  });
  const finish = () => {
    if (!press) return;
    cellEls[press.start] && cellEls[press.start].classList.remove('peek');
    if (press.dragged) end();
    else { begin(); setCell(press.start, cycle(game.cells[press.start])); end(); }
    press = null;
  };
  board.addEventListener('pointerup', finish);
  board.addEventListener('lostpointercapture', finish);
  board.addEventListener('pointercancel', () => { if (press && press.dragged) end(); if (press) cellEls[press.start].classList.remove('peek'); press = null; });
  board.addEventListener('contextmenu', (e) => e.preventDefault());

  function undo() {
    const h = history.pop();
    if (!h || !game || game.won) return;
    for (const [i, v] of h) game.cells[i] = v;
    render(); save();
  }

  function hint() {
    if (!game || game.won) return;
    const { n, solution, cells } = game;
    begin();
    // Primeiro tira uma flor plantada no lugar errado; senão, planta uma flor certa.
    const wrong = cells.findIndex((v, i) => v === FLOWER && solution[Math.floor(i / n)] !== i % n);
    if (wrong >= 0) {
      setCell(wrong, SEED);
      toast('Essa flor estava no lugar errado.');
      focus = wrong;
    } else {
      const rows = [...Array(n).keys()].filter((r) => cells[r * n + solution[r]] !== FLOWER);
      if (!rows.length) { gesture = null; return; }
      const r = rows[Math.floor(Math.random() * rows.length)];
      const i = r * n + solution[r];
      setCell(i, FLOWER);
      focus = i;
    }
    game.hints++;
    end();
    if (cellEls[focus]) cellEls[focus].focus({ preventScroll: true });
  }

  function restart() {
    if (!game || game.won || !game.cells.some((v) => v !== EMPTY)) return;
    begin();
    game.cells.forEach((v, i) => setCell(i, EMPTY));
    end();
    toast('Jardim limpo. Dá para desfazer.');
  }

  $('#undoBtn').addEventListener('click', undo);
  $('#hintBtn').addEventListener('click', hint);
  $('#clearBtn').addEventListener('click', restart);
  $('#autoBtn').addEventListener('click', () => { autoMark = !autoMark; store.set('autoMark', autoMark); render(); });

  document.addEventListener('keydown', (e) => {
    if (current !== 'play' || !game || game.won) return;
    if (!$('#paused').hidden) { if (['Enter', ' ', 'p', 'P'].includes(e.key)) { e.preventDefault(); setPaused(false); } return; }
    const n = game.n, k = e.key;
    const onBoard = e.target.closest && e.target.closest('.cell');
    const moves = { ArrowUp: -n, ArrowDown: n, ArrowLeft: -1, ArrowRight: 1 };
    if (moves[k]) {
      e.preventDefault();
      const r = Math.floor(focus / n), c = focus % n;
      if (k === 'ArrowUp') focus = ((r + n - 1) % n) * n + c;
      if (k === 'ArrowDown') focus = ((r + 1) % n) * n + c;
      if (k === 'ArrowLeft') focus = r * n + ((c + n - 1) % n);
      if (k === 'ArrowRight') focus = r * n + ((c + 1) % n);
      render(); cellEls[focus].focus();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && k.toLowerCase() === 'z') { e.preventDefault(); undo(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const low = k.toLowerCase();
    if (onBoard && (k === 'Enter' || k === ' ')) { e.preventDefault(); begin(); setCell(focus, cycle(game.cells[focus])); end(); }
    else if (low === 'x' || low === 'm') { begin(); setCell(focus, game.cells[focus] === SEED ? EMPTY : SEED); end(); }
    else if (low === 'f') { begin(); setCell(focus, game.cells[focus] === FLOWER ? EMPTY : FLOWER); end(); }
    else if (k === 'Backspace' || k === 'Delete') { e.preventDefault(); begin(); setCell(focus, EMPTY); end(); }
    else if (low === 'z' || low === 'u') undo();
    else if (low === 'h') hint();
    else if (low === 'p') setPaused(true);
  });

  /* ================= Vitória ================= */
  function win() {
    if (game.won) return;
    pauseTimer();
    game.won = true;
    const time = Math.round(game.elapsed / 1000);
    const result = { time, hints: game.hints };
    let prevBest = null;
    if (game.daily) {
      if (!store.get('daily:' + game.daily)) store.set('daily:' + game.daily, { ...result, regions: game.regions, solution: game.solution });
    } else {
      prevBest = store.get('best:' + game.n);
      if (!game.hints && (!prevBest || time < prevBest)) store.set('best:' + game.n, time);
      store.set('wins:' + game.n, store.get('wins:' + game.n, 0) + 1);
    }
    store.del('save');
    const r = { n: game.n, daily: game.daily, regions: game.regions, solution: game.solution, ...result };
    setTimeout(() => showWin(r, true, prevBest), 900);
  }

  function showWin(r, fresh, prevBest = null) {
    show('win');
    $('#winEyebrow').textContent = r.daily ? `Jardim do dia · ${dateLabel(r.daily)}` : `${SIZES[r.n].label} · ${r.n}×${r.n}`;
    const wb = $('#winBoard');
    wb.style.gridTemplateColumns = `repeat(${r.n}, 1fr)`;
    wb.style.gridTemplateRows = `repeat(${r.n}, 1fr)`;
    wb.innerHTML = r.regions && r.solution
      ? r.regions.map((g, i) => `<i style="--rc:${COLORS[g]}">${r.solution[Math.floor(i / r.n)] === i % r.n ? FLOWER_SVG : ''}</i>`).join('')
      : '';
    $('#winTime').textContent = fmtTime(r.time);
    let sub;
    if (r.daily) sub = fresh ? 'O mesmo jardim para todo mundo hoje. Compare o tempo!' : 'Você já plantou o de hoje. Um novo nasce à meia-noite.';
    else if (r.hints) sub = `Com ${r.hints} ${r.hints === 1 ? 'dica' : 'dicas'}. Partidas com dica não contam para o recorde.`;
    else if (!prevBest) sub = 'Primeiro recorde neste tamanho!';
    else if (r.time < prevBest) sub = `Novo recorde! Antes: ${fmtTime(prevBest)}`;
    else sub = `Seu recorde: ${fmtTime(prevBest)}`;
    $('#winSub').textContent = sub;
    $('#winShare').onclick = () => share(
      `Canteiros${r.daily ? ` do dia ${dateLabel(r.daily)}` : ''} · ${r.n}×${r.n}\n🌸 ${fmtTime(r.time)}${r.hints ? ` · ${r.hints} ${r.hints === 1 ? 'dica' : 'dicas'}` : ' · sem dicas'}\n${location.origin}${location.pathname}`,
    );
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
