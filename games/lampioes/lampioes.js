(() => {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const E = window.LampioesEngine;
  const { FREE, UNK, LAMP, DOT } = E;
  const SIZES = {
    7: { label: 'Fácil', level: 0 },
    9: { label: 'Médio', level: 1 },
    10: { label: 'Difícil', level: 2 },
    12: { label: 'Desafio', level: 2 },
  };
  const DAILY_SIZE = 10, DAILY_LEVEL = 1;
  const lampSvg = '<svg viewBox="0 0 100 100" aria-hidden="true"><use href="#lamp"/></svg>';

  /* ================= Utilidades ================= */
  const store = {
    get(k, d = null) {
      try { const v = localStorage.getItem('lampioes:' + k); return v == null ? d : JSON.parse(v); }
      catch { return d; }
    },
    set(k, v) { try { localStorage.setItem('lampioes:' + k, JSON.stringify(v)); } catch { /* sem armazenamento */ } },
    del(k) { try { localStorage.removeItem('lampioes:' + k); } catch { /* sem armazenamento */ } },
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
        <span>${best ? `Melhor tempo ${fmtTime(best)}` : 'Sem recorde ainda'}${wins ? ` · ${plural(wins, 'praça', 'praças')}` : ''}</span>
      </button>`;
    }).join('');
    const daily = store.get('daily:' + todayKey());
    $('#dailyText').textContent = daily
      ? `Acesa hoje em ${fmtTime(daily.time)}${daily.hints ? ` com ${plural(daily.hints, 'dica', 'dicas')}` : ''}. Uma nova praça à meia-noite.`
      : `${dateLabel(todayKey())} · ${DAILY_SIZE}×${DAILY_SIZE}. A mesma praça para todo mundo hoje.`;
    $('#dailyBtn').textContent = daily ? 'Ver resultado' : 'Jogar a de hoje';
    const sv = store.get('save');
    if (sv && !sv.won) {
      $('#resumeTitle').textContent = sv.daily ? `Praça do dia (${dateLabel(sv.daily)})` : `${SIZES[sv.n].label} ${sv.n}×${sv.n}`;
      $('#resumeInfo').textContent = `${fmtTime(sv.elapsed / 1000)} · ${plural(sv.cells.filter((v) => v === LAMP).length, 'lampião', 'lampiões')}`;
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
    const busy = sv && !sv.won && sv.cells.some((v) => v !== UNK);
    if (!busy || Date.now() - pendingReplace < 4000) { pendingReplace = 0; fn(); return; }
    pendingReplace = Date.now();
    toast('Você tem uma praça em andamento. Toque de novo para começar outra.');
  }

  /* ================= Estado ================= */
  let game = null; // { n, walls, lamps, cells, daily, elapsed, hints, won }
  let G = null;
  let history = [];
  let autoDots = store.get('autoDots', false);
  let focus = 0;
  let hl = new Set();

  function newGame(n, daily = null) {
    const rnd = daily ? mulberry32(hashStr('jogateca-lampioes-' + daily)) : Math.random;
    const p = E.generate(n, rnd, daily ? DAILY_LEVEL : SIZES[n].level);
    game = { n, walls: p.walls, lamps: p.lamps, cells: new Array(n * n).fill(UNK), daily, elapsed: 0, hints: 0, won: false };
    history = [];
    startPlay();
  }
  function resume(sv) { game = sv; history = []; startPlay(); }
  function startPlay() {
    G = E.geom(game.n, game.walls);
    focus = G.free[0];
    hl = new Set();
    $('#paused').hidden = true;
    $('#board').style.visibility = '';
    buildBoard();
    show('play');
    sizeBoard();
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
    $('#board').style.visibility = p ? 'hidden' : '';
    syncTimer();
  }
  $('#pauseBtn').addEventListener('click', () => setPaused($('#paused').hidden));
  $('#resumePlay').addEventListener('click', () => setPaused(false));

  /* ================= Tabuleiro ================= */
  let cellEls = [];
  function buildBoard() {
    const { n, walls } = game;
    const board = $('#board');
    board.style.gridTemplateColumns = `repeat(${n}, minmax(0, 1fr))`;
    board.style.gridTemplateRows = `repeat(${n}, minmax(0, 1fr))`;
    board.innerHTML = '';
    cellEls = [];
    for (let i = 0; i < n * n; i++) {
      const el = document.createElement('button');
      const r = Math.floor(i / n), c = i % n;
      el.className = 'cell' + (walls[i] === FREE ? ((r + c) % 2 ? ' alt' : '') : ' wall');
      el.dataset.i = i;
      el.setAttribute('role', 'gridcell');
      if (walls[i] !== FREE) { el.tabIndex = -1; if (walls[i] >= 0) el.innerHTML = `<b>${walls[i]}</b>`; el.setAttribute('aria-label', walls[i] >= 0 ? `Muro ${walls[i]}` : 'Muro'); }
      board.appendChild(el); cellEls.push(el);
    }
  }
  function sizeBoard() {
    if (!game) return;
    const w = $('#board').clientWidth;
    if (w) $('#board').style.setProperty('--fs', `${Math.max(10, Math.min(24, (w / game.n) * 0.42)).toFixed(1)}px`);
  }
  if ('ResizeObserver' in window) new ResizeObserver(sizeBoard).observe($('#board'));
  else window.addEventListener('resize', sizeBoard);

  function analyze() {
    const { n, cells, walls } = game;
    const lit = E.litMap(n, walls, Int8Array.from(cells));
    const bad = new Set();
    let reason = '';
    for (const i of G.free) {
      if (cells[i] !== LAMP) continue;
      for (const j of G.sees[i]) if (cells[j] === LAMP) { bad.add(i); bad.add(j); reason = reason || 'Dois lampiões estão se iluminando.'; }
    }
    const numState = {};
    for (const w of G.numbered) {
      let L = 0, U = 0;
      for (const j of G.nb[w]) { if (walls[j] !== FREE) continue; if (cells[j] === LAMP) L++; else if (cells[j] === UNK && !lit[j]) U++; }
      // um 0 só apaga quando as casas em volta estiverem resolvidas
      numState[w] = L > walls[w] ? 'over' : L === walls[w] && (walls[w] > 0 || U === 0) ? 'done' : '';
      if (L > walls[w]) reason = reason || 'Um muro está com lampiões demais.';
    }
    const autoSet = new Set();
    if (autoDots) {
      for (const w of G.numbered) {
        if (numState[w] === 'over') continue;
        const L = G.nb[w].filter((j) => walls[j] === FREE && cells[j] === LAMP).length;
        if (L === walls[w]) for (const j of G.nb[w]) if (walls[j] === FREE && cells[j] === UNK && !lit[j]) autoSet.add(j);
      }
    }
    const dark = G.free.filter((i) => !lit[i]).length;
    return { lit, bad, reason, numState, autoSet, dark };
  }

  function render() {
    if (!game) return;
    const { n, cells } = game;
    const a = analyze();
    for (const i of G.free) {
      const el = cellEls[i], v = cells[i];
      const kind = v === LAMP ? 'lamp' : v === DOT ? 'dot' : a.autoSet.has(i) ? 'auto' : 'empty';
      if (el.dataset.kind !== kind) {
        el.dataset.kind = kind;
        el.innerHTML = kind === 'lamp' ? lampSvg : kind === 'dot' ? '<span class="dot"></span>' : kind === 'auto' ? '<span class="dot auto"></span>' : '';
      }
      el.classList.toggle('lamp', v === LAMP);
      el.classList.toggle('lit', !!a.lit[i] && v !== LAMP);
      el.classList.toggle('bad', a.bad.has(i));
      el.classList.toggle('hl', hl.has(i));
      el.tabIndex = i === focus ? 0 : -1;
      const r = Math.floor(i / n) + 1, c = (i % n) + 1;
      el.setAttribute('aria-label', `Linha ${r}, coluna ${c}: ${v === LAMP ? 'lampião' : v === DOT ? 'sem lampião' : 'vazia'}, ${a.lit[i] ? 'iluminada' : 'no escuro'}`);
    }
    for (const w of G.numbered) {
      const b = cellEls[w].querySelector('b');
      b.classList.toggle('done', a.numState[w] === 'done');
      b.classList.toggle('over', a.numState[w] === 'over');
      cellEls[w].classList.toggle('hl', hl.has(w));
    }
    const lamps = cells.filter((v) => v === LAMP).length;
    $('#infoTitle').textContent = game.daily ? `Do dia · ${n}×${n}` : `${SIZES[n].label} · ${n}×${n}`;
    $('#infoDark').textContent = a.dark;
    $('#timer').textContent = fmtTime(game.elapsed / 1000);
    const st = $('#status');
    st.classList.toggle('bad', !!a.reason);
    st.textContent = a.reason || (!lamps ? 'Toque numa casa para acender um lampião.'
      : a.dark ? `${plural(a.dark, 'casa ainda no escuro', 'casas ainda no escuro')}.` : 'Tudo iluminado… confira os números.');
    $('#autoBtn').setAttribute('aria-pressed', String(autoDots));
    $('#autoState').textContent = autoDots ? 'lig.' : 'desl.';
    $('#undoBtn').disabled = history.length === 0;
    if (!a.reason && !a.dark && E.isSolved(G, Int8Array.from(cells, (v) => (v === LAMP ? LAMP : DOT)))) win();
  }

  /* ================= Jogadas ================= */
  let gesture = null;
  function setCell(i, v) {
    if (game.walls[i] !== FREE || game.cells[i] === v) return;
    if (gesture && !gesture.has(i)) gesture.set(i, game.cells[i]);
    game.cells[i] = v;
  }
  function begin() { gesture = new Map(); }
  function end() {
    if (gesture && gesture.size) { history.push([...gesture]); if (history.length > 500) history.shift(); }
    gesture = null; hl = new Set();
    render(); save();
  }
  const cycle = (v) => (v === UNK ? LAMP : v === LAMP ? DOT : UNK);

  const board = $('#board');
  let press = null;
  const cellAt = (x, y) => {
    const el = document.elementFromPoint(x, y);
    const c = el && el.closest && el.closest('.cell');
    return c && board.contains(c) ? +c.dataset.i : -1;
  };
  board.addEventListener('pointerdown', (e) => {
    if (!game || game.won) return;
    const i = cellAt(e.clientX, e.clientY);
    if (i < 0 || game.walls[i] !== FREE) return;
    e.preventDefault();
    if (e.button === 2) { begin(); setCell(i, game.cells[i] === DOT ? UNK : DOT); end(); return; }
    if (e.button > 0) return;
    board.setPointerCapture(e.pointerId);
    focus = i;
    const start = game.cells[i];
    press = { start: i, last: i, dragged: false, action: start === UNK ? DOT : start === DOT ? UNK : null };
    cellEls[i].classList.add('peek');
  });
  board.addEventListener('pointermove', (e) => {
    if (!press) return;
    if (e.pointerType === 'mouse' && e.buttons === 0) { finish(); return; }
    const i = cellAt(e.clientX, e.clientY);
    if (i < 0 || i === press.last) return;
    press.last = i;
    if (press.action === null || game.walls[i] !== FREE) return;
    if (!press.dragged) { press.dragged = true; begin(); setCell(press.start, press.action); }
    const v = game.cells[i];
    if (press.action === DOT && v === UNK) setCell(i, DOT);
    if (press.action === UNK && v === DOT) setCell(i, UNK);
    render();
  });
  function finish() {
    if (!press) return;
    if (cellEls[press.start]) cellEls[press.start].classList.remove('peek');
    if (press.dragged) end();
    else { begin(); setCell(press.start, cycle(game.cells[press.start])); end(); }
    press = null;
  }
  board.addEventListener('pointerup', finish);
  board.addEventListener('lostpointercapture', finish);
  board.addEventListener('pointercancel', () => { if (press && press.dragged) end(); if (press) cellEls[press.start].classList.remove('peek'); press = null; });
  board.addEventListener('contextmenu', (e) => e.preventDefault());

  function undo() {
    const h = history.pop();
    if (!h || !game || game.won) return;
    for (const [i, v] of h) game.cells[i] = v;
    hl = new Set(); render(); save();
  }
  $('#undoBtn').addEventListener('click', undo);
  $('#autoBtn').addEventListener('click', () => { autoDots = !autoDots; store.set('autoDots', autoDots); render(); });
  $('#clearBtn').addEventListener('click', () => {
    if (!game || game.won || !game.cells.some((v) => v !== UNK)) return;
    begin(); game.cells.forEach((v, i) => setCell(i, UNK)); end();
    toast('Praça apagada. Dá para desfazer.');
  });

  /* ================= Dica ================= */
  const WHY = {
    lit: () => 'Essa casa já está iluminada: um lampião aqui iluminaria o outro.',
    numFull: (k) => (k === 0 ? 'Nenhum lampião encosta num 0.' : `Esse ${k} já tem os seus lampiões; as outras casas encostadas ficam sem.`),
    numNeed: (k) => `Esse ${k} só tem essas casas livres em volta: todas levam lampião.`,
    onlyLight: () => 'Essa casa escura só pode ser iluminada a partir daqui.',
    shadow: () => 'Um lampião aqui deixaria uma casa no escuro, sem nenhum outro jeito de iluminá-la.',
    numCombo: (k) => `Pelas combinações possíveis em volta desse ${k}, esta casa fica decidida.`,
    numLight: (k) => `Qualquer que seja a combinação em volta desse ${k}, esta casa acaba iluminada: não cabe lampião.`,
    trial: (k, why) => `Se aqui ${why.tried === LAMP ? 'tivesse' : 'não tivesse'} lampião, logo daria contradição.`,
  };
  function hint() {
    if (!game || game.won) return;
    const sol = new Set(game.lamps);
    const wrong = game.cells.findIndex((v, i) => (v === LAMP && !sol.has(i)) || (v === DOT && sol.has(i)));
    begin();
    if (wrong >= 0) {
      const was = game.cells[wrong];
      setCell(wrong, UNK);
      game.hints++;
      end();
      hl = new Set([wrong]); render();
      toast(was === LAMP ? 'Esse lampião estava no lugar errado.' : 'Esse ponto estava errado: aqui vai um lampião.');
      return;
    }
    const got = E.hintStep(game.n, game.walls, Int8Array.from(game.cells));
    let i, val, why = null;
    if (got) ({ i, val, why } = got);
    else { i = game.lamps.find((j) => game.cells[j] !== LAMP); val = LAMP; }
    if (i == null) { gesture = null; return; }
    setCell(i, val);
    game.hints++;
    focus = i;
    end();
    hl = new Set([i]);
    if (why && why.wall != null) hl.add(why.wall);
    if (why && why.dark != null) hl.add(why.dark);
    if (why && why.cell != null && why.rule === 'onlyLight') hl.add(why.cell);
    render();
    if (why && WHY[why.rule]) toast(WHY[why.rule](why.wall != null ? game.walls[why.wall] : 0, why), 4200);
  }
  $('#hintBtn').addEventListener('click', hint);

  document.addEventListener('keydown', (e) => {
    if (current !== 'play' || !game || game.won) return;
    if (!$('#paused').hidden) { if (['Enter', ' ', 'p', 'P'].includes(e.key)) { e.preventDefault(); setPaused(false); } return; }
    const n = game.n, k = e.key;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(k)) {
      e.preventDefault();
      let r = Math.floor(focus / n), c = focus % n;
      for (let t = 0; t < n * n; t++) {
        if (k === 'ArrowUp') r = (r + n - 1) % n;
        if (k === 'ArrowDown') r = (r + 1) % n;
        if (k === 'ArrowLeft') c = (c + n - 1) % n;
        if (k === 'ArrowRight') c = (c + 1) % n;
        if (game.walls[r * n + c] === FREE) break;
      }
      focus = r * n + c;
      render(); cellEls[focus].focus();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && k.toLowerCase() === 'z') { e.preventDefault(); undo(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const low = k.toLowerCase();
    const onBoard = e.target.closest && e.target.closest('.cell');
    if (onBoard && (k === 'Enter' || k === ' ')) { e.preventDefault(); begin(); setCell(focus, cycle(game.cells[focus])); end(); }
    else if (low === 'l') { begin(); setCell(focus, game.cells[focus] === LAMP ? UNK : LAMP); end(); }
    else if (low === '.' || low === 'x') { begin(); setCell(focus, game.cells[focus] === DOT ? UNK : DOT); end(); }
    else if (k === 'Backspace' || k === 'Delete') { e.preventDefault(); begin(); setCell(focus, UNK); end(); }
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
    const result = { time, hints: game.hints, walls: game.walls, lamps: game.lamps };
    let prevBest = null;
    if (game.daily) { if (!store.get('daily:' + game.daily)) store.set('daily:' + game.daily, result); }
    else {
      prevBest = store.get('best:' + game.n);
      if (!game.hints && (!prevBest || time < prevBest)) store.set('best:' + game.n, time);
      store.set('wins:' + game.n, store.get('wins:' + game.n, 0) + 1);
    }
    store.del('save');
    const n = game.n;
    cellEls.forEach((el, i) => el.style.setProperty('--d', `${(Math.floor(i / n) + (i % n)) * 40}ms`));
    $('#frame').classList.add('celebrate');
    $('#status').textContent = 'A praça acendeu!';
    setTimeout(() => { $('#frame').classList.remove('celebrate'); showWin({ n, daily: game.daily, ...result }, true, prevBest); }, 1700);
  }
  function showWin(r, fresh, prevBest = null) {
    show('win');
    $('#winEyebrow').textContent = r.daily ? `Praça do dia · ${dateLabel(r.daily)}` : `${SIZES[r.n].label} · ${r.n}×${r.n}`;
    const wb = $('#winBoard');
    wb.style.gridTemplateColumns = `repeat(${r.n}, 1fr)`;
    const lamps = new Set(r.lamps || []);
    wb.innerHTML = (r.walls || []).map((w, i) => (w !== FREE ? '<i class="w"></i>' : `<i>${lamps.has(i) ? lampSvg : ''}</i>`)).join('');
    $('#winTime').textContent = fmtTime(r.time);
    let sub;
    if (r.daily) sub = fresh ? 'A mesma praça para todo mundo hoje. Compare o tempo!' : 'Você já acendeu a de hoje. Uma nova praça à meia-noite.';
    else if (r.hints) sub = `Com ${plural(r.hints, 'dica', 'dicas')}. Partidas com dica não contam para o recorde.`;
    else if (!prevBest) sub = 'Primeiro recorde neste tamanho!';
    else if (r.time < prevBest) sub = `Novo recorde! Antes: ${fmtTime(prevBest)}`;
    else sub = `Seu recorde: ${fmtTime(prevBest)}`;
    $('#winSub').textContent = sub;
    $('#winShare').onclick = () => share(`Lampiões${r.daily ? ` do dia ${dateLabel(r.daily)}` : ''} · ${r.n}×${r.n}\n🏮 ${fmtTime(r.time)}${r.hints ? ` · ${plural(r.hints, 'dica', 'dicas')}` : ' · sem dicas'}\n${location.origin}${location.pathname}`);
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
