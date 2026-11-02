(() => {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const E = window.KakuroEngine;
  const BANCO = window.KakuroBanco;
  const ALL_SIZES = { 6: 'Fácil', 8: 'Médio', 10: 'Difícil', 12: 'Desafio' };
  // Só os tamanhos que têm grades no banco.
  const SIZES = Object.fromEntries(Object.entries(ALL_SIZES).filter(([n]) => (BANCO[n] || []).length > 0));
  const DAILY_SIZE = 8;

  /* ================= Utilidades ================= */
  const store = {
    get(k, d = null) {
      try { const v = localStorage.getItem('kakuro:' + k); return v == null ? d : JSON.parse(v); }
      catch { return d; }
    },
    set(k, v) { try { localStorage.setItem('kakuro:' + k, JSON.stringify(v)); } catch { /* sem armazenamento */ } },
    del(k) { try { localStorage.removeItem('kakuro:' + k); } catch { /* sem armazenamento */ } },
  };
  function mulberry32(seed) {
    return () => {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  function dayNumber() {
    const d = new Date();
    return Math.round((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(2026, 0, 1)) / 86400000) + 1;
  }
  const dateLabel = (key) => key.split('-').reverse().join('/');
  function fmtTime(sec) {
    sec = Math.floor(sec);
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    const mm = String(m).padStart(2, '0'), ss = String(s).padStart(2, '0');
    return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
  }
  // Ordem fixa das grades de cada tamanho (o dia N usa a posição N).
  const ORDER = {};
  function orderOf(n) {
    if (!ORDER[n]) {
      const a = [...BANCO[n].keys()], rnd = mulberry32(4242 + n);
      for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
      ORDER[n] = a;
    }
    return ORDER[n];
  }

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
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
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
      ? `Resolvida hoje em ${fmtTime(daily.time)}${daily.hints ? ` com ${daily.hints} ${daily.hints === 1 ? 'dica' : 'dicas'}` : ''}. Uma nova lousa amanhã.`
      : `${dateLabel(todayKey())} · ${DAILY_SIZE}×${DAILY_SIZE}. A mesma lousa para todo mundo hoje.`;
    $('#dailyBtn').textContent = daily ? 'Ver resultado' : 'Jogar a de hoje';
    const save = store.get('save');
    if (save && !save.won) {
      const total = save.puzzle.split('').filter((c) => c !== '#').length;
      const filled = save.values.filter(Boolean).length;
      $('#resumeTitle').textContent = save.daily ? `Lousa do dia (${dateLabel(save.daily)})` : `${ALL_SIZES[save.n]} ${save.n}×${save.n}`;
      $('#resumeInfo').textContent = `${fmtTime(save.elapsed / 1000)} · ${Math.round((filled / total) * 100)}% preenchida`;
      $('#resumeBtn').hidden = false;
    } else $('#resumeBtn').hidden = true;
    show('home');
  }
  $('#sizes').addEventListener('click', (e) => { const b = e.target.closest('[data-size]'); if (b) confirmReplace(() => newGame(+b.dataset.size)); });
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
    const busy = save && !save.won && save.values.some(Boolean);
    if (!busy || Date.now() - pendingReplace < 4000) { pendingReplace = 0; fn(); return; }
    pendingReplace = Date.now();
    toast('Você tem uma lousa em andamento. Toque de novo para começar outra.');
  }

  /* ================= Estado ================= */
  let game = null; // { n, puzzle, values, notes, daily, elapsed, errors, hints, hinted, won }
  let runs = [], runOf = new Map(), solution = [], white = [];
  let sel = -1, notesMode = false, history = [];

  function newGame(n, daily = null) {
    const list = BANCO[n];
    const idx = daily ? orderOf(n)[(dayNumber() - 1 + list.length * 10) % list.length] : Math.floor(Math.random() * list.length);
    const puzzle = list[idx];
    game = { n, puzzle, values: new Array(n * n).fill(0), notes: new Array(n * n).fill(0), daily, elapsed: 0, errors: 0, hints: 0, hinted: [], won: false };
    history = [];
    startPlay();
  }
  function resume(s) { game = s; game.hinted = game.hinted || []; history = []; startPlay(); }
  function prepare() {
    const n = game.n, p = game.puzzle;
    white = [...p].map((c) => c !== '#');
    solution = [...p].map((c) => (c === '#' ? 0 : +c));
    runs = E.runsOf(n, white).map((r) => ({ ...r, sum: r.cells.reduce((a, i) => a + solution[i], 0) }));
    runOf = new Map();
    runs.forEach((r, k) => r.cells.forEach((i) => { if (!runOf.has(i)) runOf.set(i, []); runOf.get(i).push(k); }));
  }
  function startPlay() {
    prepare();
    notesMode = false;
    sel = white.findIndex((w, i) => w && !game.values[i]);
    $('#paused').hidden = true;
    $('#board').style.visibility = '';
    buildBoard();
    show('play');
    sizeCells(); // só agora a lousa tem largura (antes a tela estava escondida)
    render();
    save();
  }
  const save = () => { if (game) store.set('save', game); };

  /* ================= Cronômetro ================= */
  let tick = null, lastT = 0, sinceSave = 0;
  const running = () => game && !game.won && current === 'play' && $('#paused').hidden && document.visibilityState === 'visible';
  function syncTimer() { if (running()) { if (!tick) { lastT = performance.now(); tick = setInterval(step, 500); } } else pauseTimer(); }
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

  /* ================= Lousa ================= */
  let cells = [];
  function buildBoard() {
    const n = game.n, board = $('#board');
    board.style.gridTemplateColumns = `repeat(${n}, 1fr)`;
    board.style.gridTemplateRows = `repeat(${n}, 1fr)`;
    const across = {}, down = {};
    runs.forEach((r, k) => { (r.horiz ? across : down)[r.clue] = k; });
    board.innerHTML = '';
    cells = [];
    for (let i = 0; i < n * n; i++) {
      const c = document.createElement(white[i] ? 'button' : 'div');
      c.dataset.i = i;
      if (white[i]) { c.className = 'cell'; c.setAttribute('role', 'gridcell'); }
      else {
        const a = across[i], d = down[i];
        c.className = 'cell k' + (a != null || d != null ? ' clue' : '');
        c.innerHTML = (a != null ? `<b class="a" data-run="${a}">${runs[a].sum}</b>` : '') + (d != null ? `<b class="d" data-run="${d}">${runs[d].sum}</b>` : '');
        if (a != null || d != null) c.setAttribute('aria-label', `${a != null ? `soma à direita ${runs[a].sum}` : ''}${a != null && d != null ? ', ' : ''}${d != null ? `soma para baixo ${runs[d].sum}` : ''}`);
      }
      board.appendChild(c);
      cells.push(c);
    }
    sizeCells();
    $('#pad').innerHTML = Array.from({ length: 9 }, (_, k) => `<button class="key" data-n="${k + 1}" aria-label="Número ${k + 1}">${k + 1}</button>`).join('');
  }
  function sizeCells() {
    const w = $('#board').clientWidth / game.n;
    $('#board').style.setProperty('--cs', `${w}px`);
  }
  // Mede de novo sempre que a lousa muda de tamanho (girar o celular, redimensionar a janela).
  if ('ResizeObserver' in window) new ResizeObserver(() => { if (game && current === 'play') sizeCells(); }).observe($('#board'));
  else window.addEventListener('resize', () => { if (game && current === 'play') sizeCells(); });

  function render() {
    if (!game) return;
    const v = game.values;
    const selRuns = new Set(sel >= 0 ? runOf.get(sel) || [] : []);
    const selCells = new Set([...selRuns].flatMap((k) => runs[k].cells));
    const sv = sel >= 0 ? v[sel] : 0;
    // Algarismo repetido numa sequência.
    const dup = new Set();
    runs.forEach((r) => {
      const seen = {};
      r.cells.forEach((i) => { if (v[i]) (seen[v[i]] = seen[v[i]] || []).push(i); });
      Object.values(seen).forEach((l) => { if (l.length > 1) l.forEach((i) => dup.add(i)); });
    });
    for (let i = 0; i < cells.length; i++) {
      const c = cells[i];
      if (!white[i]) {
        c.querySelectorAll('b').forEach((b) => {
          const r = runs[+b.dataset.run];
          b.classList.toggle('done', r.cells.every((j) => v[j] === solution[j]));
          b.classList.toggle('hot', selRuns.has(+b.dataset.run));
        });
        continue;
      }
      const cls = ['cell'];
      if (i === sel) cls.push('sel'); else if (sv && v[i] === sv) cls.push('same'); else if (selCells.has(i)) cls.push('run');
      if (v[i] && v[i] !== solution[i]) cls.push('wrong');
      if (dup.has(i)) cls.push('dup');
      if (game.hinted.includes(i)) cls.push('hinted');
      if (c.classList.contains('flash')) cls.push('flash');
      c.className = cls.join(' ');
      c.tabIndex = i === sel ? 0 : -1;
      if (v[i]) { if (c.textContent !== String(v[i]) || c.querySelector('.notes')) c.textContent = v[i]; }
      else if (game.notes[i]) {
        let h = '<span class="notes">';
        for (let d = 1; d <= 9; d++) h += `<i>${game.notes[i] & (1 << d) ? d : ''}</i>`;
        c.innerHTML = h + '</span>';
      } else c.textContent = '';
      c.setAttribute('aria-label', `Linha ${Math.floor(i / game.n) + 1}, coluna ${(i % game.n) + 1}: ${v[i] || 'vazia'}`);
    }
    renderCombos(selRuns);
    $('#infoTitle').textContent = game.daily ? `Do dia · ${game.n}×${game.n}` : `${ALL_SIZES[game.n]} · ${game.n}×${game.n}`;
    $('#infoErrors').textContent = game.errors;
    $('#infoHints').textContent = game.hints;
    $('#timer').textContent = fmtTime(game.elapsed / 1000);
    $('#notesBtn').setAttribute('aria-pressed', String(notesMode));
    $('#notesState').textContent = notesMode ? 'lig.' : 'desl.';
    $('#pad').classList.toggle('notes-on', notesMode);
    $('#undoBtn').disabled = history.length === 0;
  }

  // Combinações possíveis das duas somas da casa selecionada (respeitando os algarismos já escritos).
  function renderCombos(selRuns) {
    const box = $('#combos');
    if (sel < 0 || !selRuns.size) { box.innerHTML = 'Toque numa casa para ver as combinações das suas somas.'; return; }
    box.innerHTML = [...selRuns].sort((a, b) => runs[b].horiz - runs[a].horiz).map((k) => {
      const r = runs[k];
      const fixed = r.cells.map((i) => game.values[i]).filter(Boolean);
      const combos = (E.COMBOS[r.cells.length][r.sum] || []).filter((m) => fixed.every((d) => m & (1 << d)));
      const txt = combos.length > 6 ? `${combos.length} combinações` : combos.map((m) => `<span class="c">${E.bits(m).join('+')}</span>`).join(' · ');
      return `<div>${r.horiz ? '→' : '↓'} <b>${r.sum}</b> em ${r.cells.length} casas: ${txt || '<span style="color:var(--chalk-pink)">nenhuma combinação com esses algarismos</span>'}</div>`;
    }).join('');
  }

  /* ================= Jogadas ================= */
  const snap = (i) => ({ i, v: game.values[i], n: game.notes[i] });
  function commit(changes) { history.push(changes); if (history.length > 400) history.shift(); }
  function place(d) {
    if (!game || game.won || sel < 0) return;
    if (notesMode) { toggleNote(d); return; }
    const i = sel;
    if (game.values[i] === d) { erase(); return; }
    const changes = [snap(i)];
    game.values[i] = d; game.notes[i] = 0;
    for (const k of runOf.get(i)) for (const j of runs[k].cells) if (j !== i && game.notes[j] & (1 << d)) { changes.push(snap(j)); game.notes[j] &= ~(1 << d); }
    if (d !== solution[i]) game.errors++;
    commit(changes);
    after(i);
  }
  function toggleNote(d) {
    const i = sel;
    if (game.values[i]) return;
    commit([snap(i)]);
    game.notes[i] ^= 1 << d;
    after(i);
  }
  function erase() {
    if (!game || game.won || sel < 0) return;
    const i = sel;
    if (!game.values[i] && !game.notes[i]) return;
    commit([snap(i)]);
    game.values[i] = 0; game.notes[i] = 0;
    game.hinted = game.hinted.filter((h) => h !== i);
    after(i);
  }
  function undo() {
    const h = history.pop();
    if (!h || !game || game.won) return;
    for (const c of h) { game.values[c.i] = c.v; game.notes[c.i] = c.n; }
    sel = h[0].i;
    render(); save();
  }
  function hint() {
    if (!game || game.won) return;
    let i = sel;
    if (i < 0 || game.values[i] === solution[i]) {
      // A casa vazia (ou errada) que dá para deduzir com menos candidatos agora.
      const correct = game.values.map((d, j) => (d && d === solution[j] ? d : 0));
      const empties = white.map((w, j) => (w && game.values[j] !== solution[j] ? j : -1)).filter((j) => j >= 0);
      if (!empties.length) return;
      const res = E.logicSolve(game.n, runs, correct);
      i = empties.find((j) => res.grid[j]) ?? empties[0];
    }
    sel = i;
    const changes = [snap(i)];
    game.values[i] = solution[i]; game.notes[i] = 0;
    game.hints++; game.hinted.push(i);
    commit(changes);
    after(i);
  }
  function after(i) {
    // Sequências fechadas piscam.
    if (game.values[i] === solution[i]) {
      for (const k of runOf.get(i)) {
        if (runs[k].cells.every((j) => game.values[j] === solution[j])) {
          runs[k].cells.forEach((j) => { const c = cells[j]; c.classList.remove('flash'); void c.offsetWidth; c.classList.add('flash'); setTimeout(() => c.classList.remove('flash'), 650); });
        }
      }
    }
    render(); save();
    if (white.every((w, j) => !w || game.values[j] === solution[j])) win();
  }

  $('#board').addEventListener('click', (e) => {
    const c = e.target.closest('.cell');
    if (!c || !white[+c.dataset.i]) return;
    sel = +c.dataset.i;
    render(); cells[sel].focus({ preventScroll: true });
  });
  $('#pad').addEventListener('click', (e) => { const k = e.target.closest('.key'); if (k && $('#paused').hidden) place(+k.dataset.n); });
  $('#pad').addEventListener('mousedown', (e) => e.preventDefault());
  $('#eraseBtn').addEventListener('click', erase);
  $('#undoBtn').addEventListener('click', undo);
  $('#hintBtn').addEventListener('click', hint);
  $('#notesBtn').addEventListener('click', () => { notesMode = !notesMode; render(); });

  document.addEventListener('keydown', (e) => {
    if (current !== 'play' || !game || game.won) return;
    if (!$('#paused').hidden) { if (['Enter', ' ', 'p', 'P'].includes(e.key)) { e.preventDefault(); setPaused(false); } return; }
    const n = game.n, k = e.key;
    const moves = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
    if (moves[k]) {
      e.preventDefault();
      let r = Math.floor(sel / n), c = sel % n;
      for (let s = 0; s < n * n; s++) {
        r = (r + moves[k][0] + n) % n; c = (c + moves[k][1] + n) % n;
        if (white[r * n + c]) { sel = r * n + c; break; }
      }
      render(); cells[sel].focus({ preventScroll: true });
      return;
    }
    const m = /^(?:Digit|Numpad)([1-9])$/.exec(e.code);
    if (m && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); if (e.shiftKey) toggleNote(+m[1]); else place(+m[1]); return; }
    if (k === 'Backspace' || k === 'Delete' || k === '0') { e.preventDefault(); erase(); return; }
    if ((e.ctrlKey || e.metaKey) && k.toLowerCase() === 'z') { e.preventDefault(); undo(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const low = k.toLowerCase();
    if (low === 'n') { notesMode = !notesMode; render(); }
    else if (low === 'z' || low === 'u') undo();
    else if (low === 'h') hint();
    else if (low === 'p') setPaused(true);
  });

  /* ================= Vitória ================= */
  function win() {
    pauseTimer();
    game.won = true;
    const time = Math.round(game.elapsed / 1000);
    const result = { time, errors: game.errors, hints: game.hints };
    let prevBest = null;
    if (game.daily) { if (!store.get('daily:' + game.daily)) store.set('daily:' + game.daily, result); }
    else {
      prevBest = store.get('best:' + game.n);
      if (!game.hints && (!prevBest || time < prevBest)) store.set('best:' + game.n, time);
    }
    store.del('save');
    setTimeout(() => showWin({ n: game.n, daily: game.daily, ...result }, true, prevBest), 800);
  }
  function showWin(r, fresh, prevBest = null) {
    show('win');
    $('#winEyebrow').textContent = r.daily ? `Lousa do dia · ${dateLabel(r.daily)}` : `${ALL_SIZES[r.n]} · ${r.n}×${r.n}`;
    $('#winTime').textContent = fmtTime(r.time);
    let sub;
    if (r.daily) sub = fresh ? 'A mesma lousa para todo mundo hoje. Compare o tempo!' : 'Você já resolveu a de hoje. Uma nova amanhã.';
    else if (r.hints) sub = 'Partidas com dica não contam para o recorde.';
    else if (!prevBest) sub = 'Primeiro recorde neste tamanho!';
    else if (r.time < prevBest) sub = `Novo recorde! Antes: ${fmtTime(prevBest)}`;
    else sub = `Seu recorde: ${fmtTime(prevBest)}`;
    $('#winSub').textContent = sub;
    $('#winStats').innerHTML = `<div>Tempo<b>${fmtTime(r.time)}</b></div><div>Erros<b>${r.errors}</b></div><div>Dicas<b>${r.hints}</b></div>`;
    $('#winNew').onclick = () => newGame(r.daily ? DAILY_SIZE : r.n);
    $('#winShare').onclick = async () => {
      const text = `Kakuro${r.daily ? ` da lousa do dia ${dateLabel(r.daily)}` : ` · ${ALL_SIZES[r.n]}`} (${r.n}×${r.n})\n➕ ${fmtTime(r.time)} · ${r.errors} ${r.errors === 1 ? 'erro' : 'erros'} · ${r.hints} ${r.hints === 1 ? 'dica' : 'dicas'}\n${location.origin}${location.pathname}`;
      try {
        if (navigator.share && matchMedia('(pointer: coarse)').matches) { await navigator.share({ text }); return; }
      } catch (e) { if (e && e.name === 'AbortError') return; }
      try { await navigator.clipboard.writeText(text); toast('Resultado copiado!'); } catch { toast('Não deu para copiar automaticamente.'); }
    };
  }
  $('#winHome').addEventListener('click', renderHome);

  renderHome();
  const mode = new URLSearchParams(location.search).get('mode');
  if (mode === 'diario') $('#dailyBtn').click();
  else if (mode === 'continuar' && store.get('save')) resume(store.get('save'));
  else if (SIZES[mode]) confirmReplace(() => newGame(+mode));
})();
