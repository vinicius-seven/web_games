(() => {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const E = window.GarimpoEngine;
  const SIZES = {
    facil: { label: 'Fácil', W: 8, H: 10, B: 13 },
    medio: { label: 'Médio', W: 10, H: 13, B: 25 },
    dificil: { label: 'Difícil', W: 12, H: 16, B: 44 },
    desafio: { label: 'Desafio', W: 14, H: 20, B: 66 },
  };
  const DAILY = 'medio';
  const stakeSvg = '<svg viewBox="0 0 100 100" aria-hidden="true"><use href="#stake"/></svg>';
  const nuggetSvg = '<svg viewBox="0 0 100 100" aria-hidden="true"><use href="#nugget"/></svg>';

  /* ================= Utilidades ================= */
  const store = {
    get(k, d = null) {
      try { const v = localStorage.getItem('garimpo:' + k); return v == null ? d : JSON.parse(v); }
      catch { return d; }
    },
    set(k, v) { try { localStorage.setItem('garimpo:' + k, JSON.stringify(v)); } catch { /* sem armazenamento */ } },
    del(k) { try { localStorage.removeItem('garimpo:' + k); } catch { /* sem armazenamento */ } },
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
    $('#sizes').innerHTML = Object.entries(SIZES).map(([id, s]) => {
      const best = store.get('best:' + id), wins = store.get('wins:' + id, 0);
      return `<button class="size" data-size="${id}">
        <strong>${s.label}<small>${s.W}×${s.H} · ${s.B} buracos</small></strong>
        <span>${best ? `Melhor tempo ${fmtTime(best)}` : 'Sem recorde ainda'}${wins ? ` · ${plural(wins, 'terreno', 'terrenos')}` : ''}</span>
      </button>`;
    }).join('');
    const daily = store.get('daily:' + todayKey());
    const D = SIZES[DAILY];
    $('#dailyText').textContent = daily
      ? `Garimpado hoje em ${fmtTime(daily.time)}${daily.slips ? ` · ${plural(daily.slips, 'tropeço', 'tropeços')}` : ''}. Um novo terreno à meia-noite.`
      : `${dateLabel(todayKey())} · ${D.W}×${D.H}, ${D.B} buracos. O mesmo terreno para todo mundo hoje.`;
    $('#dailyBtn').textContent = daily ? 'Ver resultado' : 'Jogar o de hoje';
    const sv = store.get('save');
    if (sv && !sv.won && !sv.gaveUp) {
      $('#resumeTitle').textContent = sv.daily ? `Terreno do dia (${dateLabel(sv.daily)})` : `${SIZES[sv.size].label} ${sv.W}×${sv.H}`;
      const safe = sv.W * sv.H - sv.B, dug = sv.open.filter(Boolean).length;
      $('#resumeInfo').textContent = `${fmtTime(sv.elapsed / 1000)} · ${Math.round((dug / safe) * 100)}% cavado`;
      $('#resumeBtn').hidden = false;
    } else $('#resumeBtn').hidden = true;
    show('home');
  }
  $('#sizes').addEventListener('click', (e) => {
    const b = e.target.closest('[data-size]');
    if (b) confirmReplace(() => newGame(b.dataset.size));
  });
  $('#dailyBtn').addEventListener('click', () => {
    const done = store.get('daily:' + todayKey());
    if (done) { showWin({ size: DAILY, daily: todayKey(), ...done }, false); return; }
    const sv = store.get('save');
    if (sv && !sv.won && sv.daily === todayKey()) { resume(sv); return; }
    confirmReplace(() => newGame(DAILY, todayKey()));
  });
  $('#resumeBtn').addEventListener('click', () => { const s = store.get('save'); if (s) resume(s); });
  function leaveToMenu() {
    const saved = current === 'play' && game && !game.won && !game.gaveUp;
    renderHome();
    if (saved) toast('Progresso salvo. Toque em Continuar para voltar.');
  }
  $('#homeBtn').addEventListener('click', leaveToMenu);
  $('#menuBack').addEventListener('click', leaveToMenu);

  let pendingReplace = 0;
  function confirmReplace(fn) {
    const sv = store.get('save');
    const busy = sv && !sv.won && !sv.gaveUp && sv.moves > 0;
    if (!busy || Date.now() - pendingReplace < 4000) { pendingReplace = 0; fn(); return; }
    pendingReplace = Date.now();
    toast('Você tem um terreno em andamento. Toque de novo para começar outro.');
  }

  /* ================= Estado ================= */
  let game = null; // { size, W, H, B, mines, nums, start, open, flag, daily, elapsed, hints, slips, moves, boom, won, gaveUp }
  let history = [];
  let flagMode = store.get('flagMode', false);
  let hl = new Map();

  function newGame(size, daily = null) {
    const S = SIZES[size];
    show('play');
    $('#board').innerHTML = '';
    $('#loading').hidden = false;
    setTimeout(() => {
      const rnd = daily ? mulberry32(hashStr('jogateca-garimpo-' + daily)) : Math.random;
      const p = E.generate(S.W, S.H, S.B, rnd) || E.generate(S.W, S.H, S.B, Math.random);
      const nums = E.numbers(S.W, S.H, p.mines);
      const open = new Array(S.W * S.H).fill(0);
      E.dig(S.W, S.H, nums, open, p.start);
      game = { size, W: S.W, H: S.H, B: S.B, mines: p.mines, nums, start: p.start, open, flag: new Array(S.W * S.H).fill(0), daily, elapsed: 0, hints: 0, slips: 0, moves: 0, boom: -1, won: false, gaveUp: false };
      history = [];
      startPlay();
    }, 30);
  }
  function resume(sv) { game = sv; history = []; startPlay(); }
  function startPlay() {
    hl = new Map();
    $('#paused').hidden = true;
    $('#loading').hidden = true;
    $('#oops').hidden = game.boom < 0;
    $('#board').style.visibility = '';
    $('#frame').style.setProperty('--ratio', String(game.W / game.H));
    buildBoard();
    show('play');
    sizeBoard();
    render();
    save();
  }
  const save = () => { if (game && !game.won && !game.gaveUp) store.set('save', game); };

  /* ================= Cronômetro ================= */
  let tick = null, lastT = 0, sinceSave = 0;
  const running = () => game && !game.won && !game.gaveUp && game.boom < 0 && current === 'play' && $('#paused').hidden && $('#loading').hidden && document.visibilityState === 'visible';
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
    if (!game || game.won || game.gaveUp) return;
    $('#paused').hidden = !p;
    $('#board').style.visibility = p ? 'hidden' : '';
    syncTimer();
  }
  $('#pauseBtn').addEventListener('click', () => setPaused($('#paused').hidden));
  $('#resumePlay').addEventListener('click', () => setPaused(false));

  /* ================= Terreno ================= */
  let cellEls = [];
  function buildBoard() {
    const { W, H } = game;
    const board = $('#board');
    board.style.gridTemplateColumns = `repeat(${W}, minmax(0, 1fr))`;
    board.innerHTML = '';
    cellEls = [];
    for (let i = 0; i < W * H; i++) {
      const el = document.createElement('button');
      el.dataset.i = i;
      el.setAttribute('role', 'gridcell');
      board.appendChild(el); cellEls.push(el);
    }
  }
  function sizeBoard() {
    if (!game) return;
    const w = $('#board').clientWidth;
    if (w) $('#board').style.setProperty('--fs', `${Math.max(10, Math.min(24, (w / game.W) * 0.56)).toFixed(1)}px`);
  }
  if ('ResizeObserver' in window) new ResizeObserver(sizeBoard).observe($('#board'));
  else window.addEventListener('resize', sizeBoard);

  const nbOf = (i) => E.neighbors(game.W, game.H)[i];
  const flagsAround = (i) => nbOf(i).filter((j) => game.flag[j]).length;

  function render() {
    if (!game) return;
    const { W, H, open, flag, nums, mines } = game;
    const showAll = game.boom >= 0 || game.gaveUp || game.won;
    for (let i = 0; i < W * H; i++) {
      const el = cellEls[i];
      const r = Math.floor(i / W), c = i % W;
      let cls = 'cell' + ((r + c) % 2 ? ' alt' : '');
      let html = '';
      let label;
      if (open[i]) {
        cls += ' o';
        if (nums[i] > 0) { cls += ' n' + nums[i]; html = String(nums[i]); if (flagsAround(i) === nums[i] && nbOf(i).every((j) => open[j] || flag[j])) cls += ' done'; }
        label = nums[i] > 0 ? `${nums[i]} buracos em volta` : 'cavada';
      } else if (game.won && mines[i]) {
        cls += ' o gold'; html = nuggetSvg; label = 'pepita';
      } else if (showAll && mines[i] && !flag[i]) {
        cls += i === game.boom ? ' boom' : ' hole'; label = 'buraco';
      } else if (flag[i]) {
        cls += ' f'; html = stakeSvg; label = 'estaca';
        if (showAll && !mines[i]) cls += ' wrongflag';
      } else label = 'fechada';
      if (hl.has(i)) cls += ' ' + hl.get(i);
      if (el.className !== cls) el.className = cls;
      if (el.dataset.k !== html) { el.dataset.k = html; el.innerHTML = html; }
      el.setAttribute('aria-label', `Linha ${r + 1}, coluna ${c + 1}: ${label}`);
    }
    const S = SIZES[game.size];
    $('#infoTitle').textContent = game.daily ? `Do dia · ${W}×${H}` : `${S.label} · ${W}×${H}`;
    $('#infoMines').textContent = game.B - flag.filter(Boolean).length;
    $('#timer').textContent = fmtTime(game.elapsed / 1000);
    const safeLeft = W * H - game.B - open.filter(Boolean).length;
    const st = $('#status');
    st.classList.toggle('bad', game.boom >= 0);
    st.textContent = game.gaveUp ? 'Este era o terreno. Comece outro pelo menu.'
      : game.boom >= 0 ? 'Caiu num buraco.'
        : `${plural(safeLeft, 'casa segura por cavar', 'casas seguras por cavar')}.`;
    $('#modeBtn').setAttribute('aria-pressed', String(flagMode));
    $('#modeState').textContent = flagMode ? 'marcar' : 'cavar';
    $('#modeIco').textContent = flagMode ? '🚩' : '⛏️';
    $('#undoBtn').disabled = !history.length || game.gaveUp;
    $('#oops').hidden = game.boom < 0 || game.gaveUp;
    if (!game.won && !game.gaveUp && game.boom < 0 && safeLeft === 0) win();
  }

  /* ================= Jogadas ================= */
  const snap = () => ({ open: game.open.slice(), flag: game.flag.slice() });
  function remember() { history.push(snap()); if (history.length > 200) history.shift(); }

  function digAt(i) {
    if (game.open[i] || game.flag[i]) return;
    remember();
    game.moves++;
    if (game.mines[i]) { fall(i); return; }
    E.dig(game.W, game.H, game.nums, game.open, i);
  }
  // Número com todas as estacas em volta: cava o resto.
  function chord(i) {
    const n = game.nums[i];
    if (n <= 0 || flagsAround(i) !== n) return false;
    const todo = nbOf(i).filter((j) => !game.open[j] && !game.flag[j]);
    if (!todo.length) return false;
    remember();
    game.moves++;
    for (const j of todo) {
      if (game.mines[j]) { fall(j); return true; }
      E.dig(game.W, game.H, game.nums, game.open, j);
    }
    return true;
  }
  function toggleFlag(i) {
    if (game.open[i]) return;
    remember();
    game.flag[i] = game.flag[i] ? 0 : 1;
  }
  function fall(i) {
    game.boom = i;
    game.slips++;
    pauseTimer();
    if (navigator.vibrate) try { navigator.vibrate([40, 30, 60]); } catch { /* sem vibração */ }
  }
  function act(i, alt) {
    if (!game || game.won || game.gaveUp || game.boom >= 0) return;
    hl = new Map();
    if (game.open[i]) { if (chord(i)) { render(); save(); syncTimer(); } return; }
    const flagIt = alt ? !flagMode : flagMode;
    if (flagIt) toggleFlag(i); else digAt(i);
    render(); save(); syncTimer();
  }

  const board = $('#board');
  let press = null;
  board.addEventListener('pointerdown', (e) => {
    const el = e.target.closest('.cell');
    if (!el || !game) return;
    const i = +el.dataset.i;
    if (e.button === 2) { e.preventDefault(); act(i, true); return; }
    if (e.button > 0) return;
    press = { i, long: false, x: e.clientX, y: e.clientY, timer: setTimeout(() => {
      if (!press) return;
      press.long = true;
      act(i, true);
      if (navigator.vibrate) try { navigator.vibrate(12); } catch { /* sem vibração */ }
    }, 380) };
  });
  board.addEventListener('pointermove', (e) => {
    if (press && Math.hypot(e.clientX - press.x, e.clientY - press.y) > 14) { clearTimeout(press.timer); press = null; }
  });
  board.addEventListener('pointerup', () => {
    if (!press) return;
    clearTimeout(press.timer);
    if (!press.long) act(press.i, false);
    press = null;
  });
  board.addEventListener('pointercancel', () => { if (press) { clearTimeout(press.timer); press = null; } });
  board.addEventListener('contextmenu', (e) => e.preventDefault());

  function undo() {
    const h = history.pop();
    if (!h || !game || game.won || game.gaveUp) return;
    game.open = h.open; game.flag = h.flag;
    game.boom = -1;
    hl = new Map();
    render(); save(); syncTimer();
  }
  $('#undoBtn').addEventListener('click', undo);
  $('#oopsUndo').addEventListener('click', undo);
  $('#oopsGive').addEventListener('click', () => {
    game.gaveUp = true;
    store.del('save');
    render();
  });
  $('#modeBtn').addEventListener('click', () => { flagMode = !flagMode; store.set('flagMode', flagMode); render(); });
  $('#clearBtn').addEventListener('click', () => {
    if (!game || game.won || game.gaveUp) return;
    if (!history.length) return;
    remember();
    game.open = new Array(game.W * game.H).fill(0);
    game.flag = new Array(game.W * game.H).fill(0);
    game.boom = -1;
    E.dig(game.W, game.H, game.nums, game.open, game.start);
    render(); save(); syncTimer();
    toast('Terreno de volta ao começo. Dá para desfazer.');
  });

  /* ================= Dica ================= */
  const WHY = {
    full: (n) => `Esse ${n} já tem todas as estacas em volta: as outras casas vizinhas são seguras.`,
    need: (n) => `Esse ${n} só tem ${n === 1 ? 'uma casa fechada' : `${n} casas fechadas`} sobrando em volta: ${n === 1 ? 'é' : 'são todas'} buraco.`,
    pair: () => 'Comparando esses dois números vizinhos e as casas que eles dividem, esta casa fica decidida.',
    count0: () => 'Todos os buracos já estão marcados: o resto é seguro.',
    countAll: () => 'Sobraram exatamente tantas casas fechadas quanto buracos: todas são buraco.',
  };
  function hint() {
    if (!game || game.won || game.gaveUp) return;
    if (game.boom >= 0) { toast('Primeiro volte a jogada.'); return; }
    const wrong = game.flag.findIndex((f, i) => f && !game.mines[i]);
    if (wrong >= 0) {
      remember();
      game.flag[wrong] = 0;
      game.hints++;
      hl = new Map([[wrong, 'hl']]);
      render(); save();
      toast('Essa estaca estava no lugar errado: aqui não tem buraco.');
      return;
    }
    const s = E.step(game.W, game.H, game.nums, Uint8Array.from(game.open), Uint8Array.from(game.flag), game.B);
    if (!s) return;
    hl = new Map();
    if (s.why.cell != null) hl.set(s.why.cell, 'hl2');
    if (s.why.other != null) hl.set(s.why.other, 'hl2');
    remember();
    game.hints++;
    if (s.safe) {
      const i = s.safe[0];
      E.dig(game.W, game.H, game.nums, game.open, i);
      hl.set(i, 'hl');
    } else {
      const i = s.mines[0];
      game.flag[i] = 1;
      hl.set(i, 'hl');
    }
    render(); save();
    toast(WHY[s.why.rule](s.why.cell != null ? game.nums[s.why.cell] : 0), 4200);
  }
  $('#hintBtn').addEventListener('click', hint);

  document.addEventListener('keydown', (e) => {
    if (current !== 'play' || !game) return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (k === 'z' || k === 'u') undo();
    else if (k === 'h') hint();
    else if (k === 'm' || k === 'f') $('#modeBtn').click();
    else if (k === 'p') setPaused($('#paused').hidden);
    else if (e.key === 'Enter' || e.key === ' ') {
      const el = document.activeElement && document.activeElement.closest && document.activeElement.closest('.cell');
      if (el) { e.preventDefault(); act(+el.dataset.i, e.shiftKey); }
    }
  });

  /* ================= Vitória ================= */
  function win() {
    if (game.won) return;
    pauseTimer();
    game.won = true;
    game.flag = game.mines.slice();
    const time = Math.round(game.elapsed / 1000);
    const clean = !game.hints && !game.slips;
    const result = { time, hints: game.hints, slips: game.slips, W: game.W, H: game.H, mines: game.mines };
    let prevBest = null;
    if (game.daily) { if (!store.get('daily:' + game.daily)) store.set('daily:' + game.daily, result); }
    else {
      prevBest = store.get('best:' + game.size);
      if (clean && (!prevBest || time < prevBest)) store.set('best:' + game.size, time);
      store.set('wins:' + game.size, store.get('wins:' + game.size, 0) + 1);
    }
    store.del('save');
    render();
    $('#status').textContent = 'Terreno garimpado! Achou ouro.';
    setTimeout(() => showWin({ size: game.size, daily: game.daily, ...result }, true, prevBest), 1600);
  }
  function showWin(r, fresh, prevBest = null) {
    show('win');
    const S = SIZES[r.size] || SIZES[DAILY];
    $('#winEyebrow').textContent = r.daily ? `Terreno do dia · ${dateLabel(r.daily)}` : `${S.label} · ${r.W}×${r.H}`;
    const wb = $('#winBoard');
    wb.style.gridTemplateColumns = `repeat(${r.W}, 1fr)`;
    wb.style.width = `min(${Math.round(220 * Math.min(1, r.W / r.H))}px, 64%)`;
    wb.innerHTML = (r.mines || []).map((m) => `<i>${m ? nuggetSvg : ''}</i>`).join('');
    $('#winTime').textContent = fmtTime(r.time);
    const extra = [r.hints ? plural(r.hints, 'dica', 'dicas') : '', r.slips ? plural(r.slips, 'tropeço', 'tropeços') : ''].filter(Boolean).join(' e ');
    let sub;
    if (r.daily) sub = fresh ? `O mesmo terreno para todo mundo hoje${extra ? ` (com ${extra})` : ''}. Compare o tempo!` : 'Você já garimpou o de hoje. Um novo terreno à meia-noite.';
    else if (extra) sub = `Com ${extra}. Partidas com dica ou tropeço não contam para o recorde.`;
    else if (!prevBest) sub = 'Primeiro recorde neste tamanho!';
    else if (r.time < prevBest) sub = `Novo recorde! Antes: ${fmtTime(prevBest)}`;
    else sub = `Seu recorde: ${fmtTime(prevBest)}`;
    $('#winSub').textContent = sub;
    $('#winShare').onclick = () => share(`Garimpo${r.daily ? ` do dia ${dateLabel(r.daily)}` : ` · ${S.label}`} · ${r.W}×${r.H}\n⛏️ ${fmtTime(r.time)}${extra ? ` · ${extra}` : ' · sem dicas nem tropeços'}\n${location.origin}${location.pathname}`);
    $('#winNew').onclick = () => newGame(r.daily ? DAILY : r.size);
  }
  $('#winHome').addEventListener('click', renderHome);

  /* ================= Início ================= */
  renderHome();
  const mode = new URLSearchParams(location.search).get('mode');
  if (mode === 'diario') $('#dailyBtn').click();
  else if (mode === 'continuar' && store.get('save')) resume(store.get('save'));
  else if (SIZES[mode]) confirmReplace(() => newGame(mode));
})();
