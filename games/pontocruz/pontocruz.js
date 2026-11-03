(() => {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const E = window.PontoCruzEngine;
  const { PICTURES } = window.PontoCruzPictures;
  const SIZES = { 5: 'Rápido', 10: 'Clássico', 15: 'Grande' };
  const DAILY_SIZE = 10;
  const EMPTY = 0, FILL = 1, MARK = 2;
  // Linhas para colorir os motivos quando ficam prontos (faixas a partir do centro).
  const PALETTES = [
    ['#b8243b', '#1f3f8a', '#d9962a'],
    ['#2b6e4f', '#b8243b', '#d9962a'],
    ['#1f3f8a', '#4f9ad6', '#b8243b'],
    ['#7d3f98', '#d76a95', '#2b6e4f'],
    ['#9a3412', '#d9962a', '#1f3f8a'],
  ];

  /* ================= Utilidades ================= */
  const store = {
    get(k, d = null) {
      try { const v = localStorage.getItem('pontocruz:' + k); return v == null ? d : JSON.parse(v); }
      catch { return d; }
    },
    set(k, v) { try { localStorage.setItem('pontocruz:' + k, JSON.stringify(v)); } catch { /* sem armazenamento */ } },
    del(k) { try { localStorage.removeItem('pontocruz:' + k); } catch { /* sem armazenamento */ } },
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
  const darker = (hex, f = 0.68) => {
    const n = parseInt(hex.slice(1), 16);
    const ch = (v) => Math.round(v * f).toString(16).padStart(2, '0');
    return `#${ch(n >> 16)}${ch((n >> 8) & 255)}${ch(n & 255)}`;
  };

  // Cores finais de cada casa: as do desenho (coleção) ou faixas da paleta (motivos).
  function colorsFor(g) {
    if (g.kind === 'pic') return PICTURES.find((p) => p.id === g.picId).colors;
    const pal = PALETTES[g.palette % PALETTES.length];
    const mid = (g.n - 1) / 2;
    return g.grid.map((v, i) => {
      if (!v) return null;
      const d = Math.max(Math.abs(Math.floor(i / g.n) - mid), Math.abs((i % g.n) - mid));
      return pal[Math.floor(d) % pal.length];
    });
  }
  // Mini bordado (miniaturas, herói e tela de vitória).
  function miniHtml(grid, colors, n) {
    return `<div class="g mini" style="grid-template-columns:repeat(${n},1fr);grid-template-rows:repeat(${n},1fr)">${
      grid.map((v, i) => `<i${v ? ` class="f" style="--st:${colors[i]}"` : ''}></i>`).join('')}</div>`;
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
    const heart = PICTURES.find((p) => p.id === 'coracao');
    const hero = $('#heroStitch');
    hero.style.gridTemplateColumns = 'repeat(5, 12px)';
    hero.innerHTML = heart.grid.map((v, i) => `<i${v ? ` class="f" style="--st:${heart.colors[i]}"` : ''}></i>`).join('');
    hero.classList.add('mini');

    $('#sizes').innerHTML = Object.entries(SIZES).map(([n, label]) => {
      const best = store.get('best:' + n);
      return `<button class="size" data-size="${n}"><strong>${n}×${n}</strong><span>${label}${best ? ` · melhor ${fmtTime(best)}` : ''}</span></button>`;
    }).join('');

    const daily = store.get('daily:' + todayKey());
    $('#dailyText').textContent = daily
      ? `Bordado hoje em ${fmtTime(daily.time)}${daily.hints ? ` com ${daily.hints} ${daily.hints === 1 ? 'dica' : 'dicas'}` : ''}. Um novo motivo amanhã.`
      : `${dateLabel(todayKey())} · ${DAILY_SIZE}×${DAILY_SIZE}. O mesmo motivo para todo mundo hoje.`;
    $('#dailyBtn').textContent = daily ? 'Ver bordado' : 'Bordar o de hoje';

    // Coleção: desenhos prontos aparecem bordados; os outros ficam como "?".
    let done = 0;
    const bySize = {};
    for (const p of PICTURES) (bySize[p.w] = bySize[p.w] || []).push(p);
    $('#collection').innerHTML = Object.entries(bySize).map(([n, list]) => `
      <p class="coll-size">${n}×${n}</p>
      <div class="pics">${list.map((p) => {
        const rec = store.get('done:' + p.id);
        if (rec) done++;
        return `<button class="pic${rec ? ' done' : ''}" data-pic="${p.id}" aria-label="${rec ? p.name + ', bordado' : 'Desenho surpresa ' + n + '×' + n}">
          <span class="thumb">${rec ? miniHtml(p.grid, p.colors, p.w) : '<b class="q">?</b>'}</span>
          <span>${rec ? p.name : '???'}</span>
        </button>`;
      }).join('')}</div>`).join('');
    $('#collCount').textContent = `${done} de ${PICTURES.length} bordados`;

    const save = store.get('save');
    if (save && !save.won) {
      const filled = save.cells.filter((v) => v === FILL).length;
      const total = save.grid.filter(Boolean).length;
      $('#resumeTitle').textContent = titleOf(save);
      $('#resumeInfo').textContent = `${fmtTime(save.elapsed / 1000)} · ${save.n}×${save.n} · ${Math.min(100, Math.round((filled / total) * 100))}% bordado`;
      $('#resumeBtn').hidden = false;
    } else $('#resumeBtn').hidden = true;
    show('home');
  }
  const titleOf = (g) => (g.kind === 'pic' ? 'Desenho surpresa' : g.kind === 'daily' ? `Motivo do dia (${dateLabel(g.daily)})` : `Motivo ${g.n}×${g.n}`);

  $('#sizes').addEventListener('click', (e) => {
    const b = e.target.closest('[data-size]');
    if (b) confirmReplace(() => newMotif(+b.dataset.size));
  });
  $('#collection').addEventListener('click', (e) => {
    const b = e.target.closest('[data-pic]');
    if (!b) return;
    const save = store.get('save');
    if (save && !save.won && save.kind === 'pic' && save.picId === b.dataset.pic) { resume(save); return; }
    confirmReplace(() => newPicture(b.dataset.pic));
  });
  $('#dailyBtn').addEventListener('click', () => {
    const done = store.get('daily:' + todayKey());
    if (done) { showWin({ kind: 'daily', daily: todayKey(), n: DAILY_SIZE, grid: done.grid, palette: done.palette, time: done.time, hints: done.hints }, false); return; }
    const save = store.get('save');
    if (save && !save.won && save.kind === 'daily' && save.daily === todayKey()) { resume(save); return; }
    confirmReplace(newDaily);
  });
  $('#resumeBtn').addEventListener('click', () => { const s = store.get('save'); if (s) resume(s); });

  function leaveToMenu() {
    const saved = current === 'play' && game && !game.won;
    renderHome();
    if (saved) toast('Progresso salvo. Toque em Continuar bordando para voltar.');
  }
  $('#homeBtn').addEventListener('click', leaveToMenu);
  $('#menuBack').addEventListener('click', leaveToMenu);

  let pendingReplace = 0;
  function confirmReplace(fn) {
    const save = store.get('save');
    const busy = save && !save.won && save.cells.some((v) => v !== EMPTY);
    if (!busy || Date.now() - pendingReplace < 4000) { pendingReplace = 0; fn(); return; }
    pendingReplace = Date.now();
    toast('Você tem um bordado em andamento. Toque de novo para começar outro.');
  }

  /* ================= Estado ================= */
  let game = null; // { kind, picId|daily, n, grid, palette, cells, elapsed, hints, won }
  let history = [];
  let cursor = 0;
  let markMode = false;

  function fresh(extra) {
    game = { cells: new Array(extra.n * extra.n).fill(EMPTY), elapsed: 0, hints: 0, won: false, ...extra };
    history = []; cursor = 0;
    startPlay();
  }
  function newPicture(id) {
    const p = PICTURES.find((x) => x.id === id);
    fresh({ kind: 'pic', picId: id, n: p.w, grid: p.grid.slice() });
  }
  function newMotif(n, rnd = Math.random) {
    const m = E.generateMotif(n, rnd);
    fresh({ kind: 'motif', n, grid: m.grid, palette: Math.floor(rnd() * PALETTES.length) });
  }
  function newDaily() {
    const rnd = mulberry32(hashStr('jogateca-pontocruz-' + todayKey()));
    const m = E.generateMotif(DAILY_SIZE, rnd);
    fresh({ kind: 'daily', daily: todayKey(), n: DAILY_SIZE, grid: m.grid, palette: Math.floor(rnd() * PALETTES.length) });
  }
  function resume(s) { game = s; history = []; cursor = 0; startPlay(); }

  function startPlay() {
    markMode = false;
    $('#paused').hidden = true;
    $('#nono').style.visibility = '';
    buildBoard();
    show('play');
    render();
    save();
  }
  const save = () => { if (game && !game.won) store.set('save', game); };

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
    $('#nono').style.visibility = p ? 'hidden' : '';
    syncTimer();
  }
  $('#pauseBtn').addEventListener('click', () => setPaused($('#paused').hidden));
  $('#resumePlay').addEventListener('click', () => setPaused(false));

  /* ================= Tabuleiro ================= */
  let clues = null, cellEls = [], rowClueEls = [], colClueEls = [];
  function buildBoard() {
    const n = game.n;
    clues = E.cluesOf(game.grid, n, n);
    const maxRow = Math.max(1, ...clues.rows.map((c) => c.length));
    const maxCol = Math.max(1, ...clues.cols.map((c) => c.length));
    // Tamanho da casa: cabe na largura e na altura da tela, com as pistas.
    const availW = Math.min(window.innerWidth - 32 - 20, 660);
    const availH = window.innerHeight - 330;
    const csW = availW / (n + maxRow * 0.8 + 0.5);
    const csH = availH / (n + maxCol * 0.72 + 0.5);
    const cs = Math.max(16, Math.min(46, Math.floor(Math.min(csW, Math.max(csH, 18)))));
    const rowW = Math.ceil(maxRow * cs * 0.8 + cs * 0.5);
    const colH = Math.ceil(maxCol * cs * 0.72 + cs * 0.5);
    const board = $('#nono');
    board.style.setProperty('--cs', cs + 'px');
    board.style.gridTemplateColumns = `${rowW}px repeat(${n}, ${cs}px)`;
    board.style.gridTemplateRows = `${colH}px repeat(${n}, ${cs}px)`;
    board.classList.remove('reveal');
    let html = '<div class="corner"></div>';
    for (let c = 0; c < n; c++) html += `<div class="clue col" data-col="${c}">${(clues.cols[c].length ? clues.cols[c] : [0]).map((x) => `<span>${x}</span>`).join('')}</div>`;
    for (let r = 0; r < n; r++) {
      html += `<div class="clue row" data-row="${r}">${(clues.rows[r].length ? clues.rows[r] : [0]).map((x) => `<span>${x}</span>`).join('')}</div>`;
      for (let c = 0; c < n; c++) {
        const cls = ['cell'];
        if ((c + 1) % 5 === 0 && c < n - 1) cls.push('c5');
        if ((r + 1) % 5 === 0 && r < n - 1) cls.push('r5');
        html += `<div class="${cls.join(' ')}" data-i="${r * n + c}" role="gridcell"></div>`;
      }
    }
    board.innerHTML = html;
    cellEls = [...board.querySelectorAll('.cell')];
    rowClueEls = [...board.querySelectorAll('.clue.row')];
    colClueEls = [...board.querySelectorAll('.clue.col')];
    board.tabIndex = 0;
  }

  const sameClues = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
  function render() {
    if (!game) return;
    const n = game.n;
    const cr = Math.floor(cursor / n), cc = cursor % n;
    for (let i = 0; i < n * n; i++) {
      const el = cellEls[i], v = game.cells[i];
      el.classList.toggle('f', v === FILL);
      el.classList.toggle('x', v === MARK);
      el.classList.toggle('hot', Math.floor(i / n) === cr || i % n === cc);
      el.classList.toggle('cursor', i === cursor && keyboardMode);
      el.setAttribute('aria-label', `Linha ${Math.floor(i / n) + 1}, coluna ${(i % n) + 1}: ${v === FILL ? 'bordada' : v === MARK ? 'marcada vazia' : 'em branco'}`);
    }
    for (let r = 0; r < n; r++) {
      const line = game.cells.slice(r * n, r * n + n).map((v) => (v === FILL ? 1 : 0));
      rowClueEls[r].classList.toggle('done', sameClues(E.lineClues(line), clues.rows[r]));
      rowClueEls[r].classList.toggle('hot', r === cr);
    }
    for (let c = 0; c < n; c++) {
      const line = Array.from({ length: n }, (_, r) => (game.cells[r * n + c] === FILL ? 1 : 0));
      colClueEls[c].classList.toggle('done', sameClues(E.lineClues(line), clues.cols[c]));
      colClueEls[c].classList.toggle('hot', c === cc);
    }
    $('#infoTitle').textContent = game.kind === 'pic' ? `Desenho surpresa · ${n}×${n}` : game.kind === 'daily' ? `Do dia · ${n}×${n}` : `Motivo · ${n}×${n}`;
    $('#infoHints').textContent = game.hints;
    $('#timer').textContent = fmtTime(game.elapsed / 1000);
    $('#modeFill').setAttribute('aria-checked', String(!markMode));
    $('#modeMark').setAttribute('aria-checked', String(markMode));
    $('#undoBtn').disabled = history.length === 0;
  }

  /* ================= Jogadas ================= */
  // Toque: borda/desborda (ou marca/desmarca). Arrastar aplica o mesmo na linha ou coluna.
  let press = null, keyboardMode = false;
  const board = $('#nono');
  const cellAt = (x, y) => {
    const el = document.elementFromPoint(x, y);
    const c = el && el.closest && el.closest('.cell');
    return c && board.contains(c) ? +c.dataset.i : -1;
  };
  function applySegment(to) {
    const n = game.n;
    const a = press.start, ar = Math.floor(a / n), ac = a % n, br = Math.floor(to / n), bc = to % n;
    if (!press.axis && to !== a) press.axis = Math.abs(br - ar) > Math.abs(bc - ac) ? 'col' : 'row';
    const seg = new Set([a]);
    if (press.axis === 'row') for (let c = Math.min(ac, bc); c <= Math.max(ac, bc); c++) seg.add(ar * n + c);
    if (press.axis === 'col') for (let r = Math.min(ar, br); r <= Math.max(ar, br); r++) seg.add(r * n + ac);
    for (const [i, orig] of press.changed) if (!seg.has(i)) { game.cells[i] = orig; press.changed.delete(i); }
    for (const i of seg) {
      const orig = press.changed.has(i) ? press.changed.get(i) : game.cells[i];
      if (orig !== press.from) continue;
      if (!press.changed.has(i)) press.changed.set(i, orig);
      if (game.cells[i] !== press.target) {
        game.cells[i] = press.target;
        if (press.target === FILL) { const el = cellEls[i]; el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
      }
    }
    render();
  }
  board.addEventListener('pointerdown', (e) => {
    if (!game || game.won || e.button > 2) return;
    const i = cellAt(e.clientX, e.clientY);
    if (i < 0) return;
    e.preventDefault();
    if (press) finish();
    board.setPointerCapture(e.pointerId);
    keyboardMode = false;
    cursor = i;
    const mark = markMode || e.button === 2;
    const from = game.cells[i];
    const target = mark ? (from === MARK ? EMPTY : MARK) : (from === FILL ? EMPTY : FILL);
    press = { start: i, from, target, axis: null, changed: new Map() };
    applySegment(i);
  });
  board.addEventListener('pointermove', (e) => {
    if (!press) return;
    if (e.pointerType === 'mouse' && e.buttons === 0) { finish(); return; }
    const i = cellAt(e.clientX, e.clientY);
    if (i >= 0) applySegment(i);
  });
  function finish() {
    if (!press) return;
    if (press.changed.size) {
      history.push([...press.changed]);
      if (history.length > 400) history.shift();
    }
    press = null;
    render(); save(); checkWin();
  }
  board.addEventListener('pointerup', finish);
  board.addEventListener('lostpointercapture', finish);
  board.addEventListener('pointercancel', finish);
  board.addEventListener('contextmenu', (e) => e.preventDefault());

  function setCells(list) { // [[i, novoEstado]] como uma jogada
    const changes = [];
    for (const [i, v] of list) if (game.cells[i] !== v) { changes.push([i, game.cells[i]]); game.cells[i] = v; }
    if (changes.length) history.push(changes);
    render(); save(); checkWin();
  }
  function undo() {
    const h = history.pop();
    if (!h || !game || game.won) return;
    for (const [i, v] of h) game.cells[i] = v;
    render(); save();
  }
  function restart() {
    if (!game || game.won || !game.cells.some((v) => v !== EMPTY)) return;
    setCells(game.cells.map((_, i) => [i, EMPTY]));
    toast('Tecido limpo. Dá para desfazer.');
  }
  function flash(i) {
    const el = cellEls[i];
    el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash');
    setTimeout(() => el.classList.remove('flash'), 1900);
  }

  // Dica: primeiro aponta um erro; senão, mostra uma casa que dá para deduzir agora, linha a linha.
  function hint() {
    if (!game || game.won) return;
    const n = game.n, { grid, cells } = game;
    const wrong = cells.findIndex((v, i) => (v === FILL && !grid[i]) || (v === MARK && grid[i]));
    game.hints++;
    if (wrong >= 0) {
      cursor = wrong; setCells([[wrong, EMPTY]]); flash(wrong);
      toast(cells[wrong] === EMPTY && grid[wrong] ? 'Essa casa não fica vazia.' : 'Esse ponto estava no lugar errado.');
      return;
    }
    const known = cells.map((v) => (v === FILL ? 1 : v === MARK ? 0 : -1));
    const tryLine = (idx, isRow) => {
      const ids = Array.from({ length: n }, (_, k) => (isRow ? idx * n + k : k * n + idx));
      const next = E.solveLine(ids.map((i) => known[i]), isRow ? clues.rows[idx] : clues.cols[idx]);
      if (!next) return null;
      for (let k = 0; k < n; k++) if (known[ids[k]] === -1 && next[k] !== -1) return { i: ids[k], v: next[k], isRow, idx };
      return null;
    };
    let found = null;
    for (let r = 0; r < n && !found; r++) found = tryLine(r, true);
    for (let c = 0; c < n && !found; c++) found = tryLine(c, false);
    if (!found) {
      const i = grid.findIndex((v, k) => v && cells[k] !== FILL);
      if (i < 0) return;
      found = { i, v: 1 };
    }
    cursor = found.i;
    setCells([[found.i, found.v ? FILL : MARK]]);
    flash(found.i);
    if (found.isRow != null) toast(`Dá para deduzir pela ${found.isRow ? 'linha' : 'coluna'} ${found.idx + 1}: ${found.v ? 'aqui vai um ponto' : 'esta casa fica vazia'}.`);
  }

  $('#undoBtn').addEventListener('click', undo);
  $('#hintBtn').addEventListener('click', hint);
  $('#clearBtn').addEventListener('click', restart);
  $('#modeFill').addEventListener('click', () => { markMode = false; render(); });
  $('#modeMark').addEventListener('click', () => { markMode = true; render(); });

  document.addEventListener('keydown', (e) => {
    if (current !== 'play' || !game || game.won) return;
    if (!$('#paused').hidden) { if (['Enter', ' ', 'p', 'P'].includes(e.key)) { e.preventDefault(); setPaused(false); } return; }
    if (e.target.closest && e.target.closest('button') && (e.key === 'Enter' || e.key === ' ')) return;
    const n = game.n, k = e.key, low = k.toLowerCase();
    const moves = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
    if (moves[k]) {
      e.preventDefault();
      keyboardMode = true;
      const r = (Math.floor(cursor / n) + moves[k][0] + n) % n, c = ((cursor % n) + moves[k][1] + n) % n;
      cursor = r * n + c; render();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && low === 'z') { e.preventDefault(); undo(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const v = game.cells[cursor];
    if (k === ' ' || k === 'Enter' || low === 'f') { e.preventDefault(); keyboardMode = true; setCells([[cursor, v === FILL ? EMPTY : FILL]]); }
    else if (low === 'x' || low === 'm') { keyboardMode = true; setCells([[cursor, v === MARK ? EMPTY : MARK]]); }
    else if (k === 'Backspace' || k === 'Delete') { e.preventDefault(); setCells([[cursor, EMPTY]]); }
    else if (low === 'z' || low === 'u') undo();
    else if (low === 'h') hint();
    else if (low === 'p') setPaused(true);
    else if (low === 'b') { markMode = !markMode; render(); }
  });

  /* ================= Vitória ================= */
  function checkWin() {
    if (!game || game.won) return;
    if (!game.grid.every((v, i) => (v === 1) === (game.cells[i] === FILL))) return;
    pauseTimer();
    game.won = true;
    const time = Math.round(game.elapsed / 1000);
    const r = { kind: game.kind, picId: game.picId, daily: game.daily, n: game.n, grid: game.grid, palette: game.palette, time, hints: game.hints };
    let prevBest = null;
    if (game.kind === 'pic') {
      const prev = store.get('done:' + game.picId);
      if (!prev || time < prev.time) store.set('done:' + game.picId, { time, hints: game.hints });
    } else if (game.kind === 'daily') {
      if (!store.get('daily:' + game.daily)) store.set('daily:' + game.daily, { time, hints: game.hints, grid: game.grid, palette: game.palette });
    } else {
      prevBest = store.get('best:' + game.n);
      if (!game.hints && (!prevBest || time < prevBest)) store.set('best:' + game.n, time);
    }
    store.del('save');
    // Revelação: os pontos ganham as cores do desenho, em onda a partir do canto.
    const colors = colorsFor(game);
    const n = game.n;
    $('#nono').classList.add('reveal');
    cellEls.forEach((el, i) => {
      el.classList.remove('hot', 'cursor');
      if (colors[i]) {
        el.style.setProperty('--d', `${(Math.floor(i / n) + (i % n)) * 35}ms`);
        el.style.setProperty('--st', colors[i]);
        el.style.setProperty('--st-d', darker(colors[i]));
      }
    });
    setTimeout(() => showWin(r, true, prevBest), 1700);
  }

  function nextPicture(afterId) {
    const idx = PICTURES.findIndex((p) => p.id === afterId);
    const order = [...PICTURES.slice(idx + 1), ...PICTURES.slice(0, idx + 1)];
    return order.find((p) => !store.get('done:' + p.id)) || null;
  }

  function showWin(r, fresh, prevBest = null) {
    show('win');
    const pic = r.kind === 'pic' ? PICTURES.find((p) => p.id === r.picId) : null;
    $('#winEyebrow').textContent = r.kind === 'daily' ? `Motivo do dia · ${dateLabel(r.daily)}` : `${r.n}×${r.n}`;
    $('#winTitle').textContent = pic ? `Você bordou: ${pic.name}!` : 'Motivo bordado!';
    $('#winArt').innerHTML = miniHtml(r.grid, colorsFor(r), r.n);
    $('#winTime').textContent = fmtTime(r.time);
    let sub;
    if (r.kind === 'daily') sub = fresh ? 'O mesmo motivo para todo mundo hoje. Compare o tempo!' : 'Você já bordou o de hoje. Um novo motivo amanhã.';
    else if (pic) {
      const done = PICTURES.filter((p) => store.get('done:' + p.id)).length;
      sub = `${done} de ${PICTURES.length} desenhos da coleção.`;
    } else if (r.hints) sub = `Com ${r.hints} ${r.hints === 1 ? 'dica' : 'dicas'}. Partidas com dica não contam para o recorde.`;
    else if (!prevBest) sub = 'Primeiro recorde neste tamanho!';
    else if (r.time < prevBest) sub = `Novo recorde! Antes: ${fmtTime(prevBest)}`;
    else sub = `Seu recorde: ${fmtTime(prevBest)}`;
    $('#winSub').textContent = sub;

    const next = $('#winNext');
    if (pic) {
      const nx = nextPicture(pic.id);
      next.textContent = nx ? 'Próximo desenho' : 'Bordar um motivo';
      next.onclick = () => (nx ? newPicture(nx.id) : newMotif(10));
    } else {
      const size = r.kind === 'daily' ? 10 : r.n;
      next.textContent = `Novo motivo ${size}×${size}`;
      next.onclick = () => newMotif(size);
    }
    $('#winShare').onclick = () => share(
      `Ponto-Cruz${r.kind === 'daily' ? ` · motivo do dia ${dateLabel(r.daily)}` : pic ? ` · ${pic.name}` : ''} (${r.n}×${r.n})\n🧵 ${fmtTime(r.time)}${r.hints ? ` · ${r.hints} ${r.hints === 1 ? 'dica' : 'dicas'}` : ' · sem dicas'}\n${location.origin}${location.pathname}`,
    );
  }
  $('#winHome').addEventListener('click', renderHome);

  window.addEventListener('resize', () => { if (current === 'play' && game && !game.won) { buildBoard(); render(); } });

  /* ================= Início ================= */
  renderHome();
  const mode = new URLSearchParams(location.search).get('mode');
  if (mode === 'diario') $('#dailyBtn').click();
  else if (mode === 'continuar' && store.get('save')) resume(store.get('save'));
  else if (mode === 'colecao') { const nx = nextPicture(PICTURES[PICTURES.length - 1].id); if (nx) confirmReplace(() => newPicture(nx.id)); }
  else if (SIZES[mode]) confirmReplace(() => newMotif(+mode));
})();
