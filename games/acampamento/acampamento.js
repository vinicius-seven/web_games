(() => {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const E = window.AcampamentoEngine;
  const { TENT, GRASS } = E;
  const EMPTY = 0;
  const SIZES = {
    6: { label: 'Fácil', level: 'facil' },
    8: { label: 'Médio', level: 'medio' },
    10: { label: 'Difícil', level: 'dificil' },
    12: { label: 'Desafio', level: 'dificil' },
  };
  const DAILY_SIZE = 8;
  const DAILY_LEVEL = 'dificil';
  // Lonas das barracas: cor clara (--tc) e lado na sombra (--td).
  const CANVAS = [['#f08a3c', '#c9622a'], ['#f2c14e', '#d39a24'], ['#4fb3bf', '#2f8a96'], ['#e45b6b', '#b83a4b'], ['#9b86ec', '#7058c8']];
  const tentSvg = (i, cls = 'tentg') => {
    const [tc, td] = CANVAS[(i * 7 + (i >> 3)) % CANVAS.length];
    return `<svg class="${cls}" viewBox="0 0 100 100" style="--tc:${tc};--td:${td}" aria-hidden="true"><use href="#tent"/></svg>`;
  };
  const treeSvg = (i, cls = 'tree') => `<svg class="${cls}" viewBox="0 0 100 100" aria-hidden="true"><use href="#${(i * 13 + (i >> 2)) % 3 === 0 ? 'oak' : 'pine'}"/></svg>`;
  const tuftSvg = (auto) => `<svg class="tuftg${auto ? ' auto' : ''}" viewBox="0 0 100 100" aria-hidden="true"><use href="#tuft"/></svg>`;

  /* ================= Utilidades ================= */
  const store = {
    get(k, d = null) {
      try { const v = localStorage.getItem('acampamento:' + k); return v == null ? d : JSON.parse(v); }
      catch { return d; }
    },
    set(k, v) { try { localStorage.setItem('acampamento:' + k, JSON.stringify(v)); } catch { /* sem armazenamento */ } },
    del(k) { try { localStorage.removeItem('acampamento:' + k); } catch { /* sem armazenamento */ } },
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
    $('#sizes').innerHTML = Object.entries(SIZES).map(([n, s]) => {
      const best = store.get('best:' + n);
      const wins = store.get('wins:' + n, 0);
      return `<button class="size" data-size="${n}">
        <strong>${s.label}<small>${n}×${n}</small></strong>
        <span>${best ? `Melhor tempo ${fmtTime(best)}` : 'Sem recorde ainda'}${wins ? ` · ${plural(wins, 'campo', 'campos')}` : ''}</span>
      </button>`;
    }).join('');

    const daily = store.get('daily:' + todayKey());
    $('#dailyText').textContent = daily
      ? `Armado hoje em ${fmtTime(daily.time)}${daily.hints ? ` com ${plural(daily.hints, 'dica', 'dicas')}` : ''}. Um novo camping abre à meia-noite.`
      : `${dateLabel(todayKey())} · ${DAILY_SIZE}×${DAILY_SIZE}. O mesmo campo para todo mundo hoje.`;
    $('#dailyBtn').textContent = daily ? 'Ver resultado' : 'Jogar o de hoje';

    const sv = store.get('save');
    if (sv && !sv.won) {
      const tents = sv.cells.filter((v) => v === TENT).length;
      $('#resumeTitle').textContent = sv.daily ? `Camping do dia (${dateLabel(sv.daily)})` : `${SIZES[sv.n].label} ${sv.n}×${sv.n}`;
      $('#resumeInfo').textContent = `${fmtTime(sv.elapsed / 1000)} · ${tents} de ${sv.trees.length} barracas`;
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
    const busy = sv && !sv.won && sv.cells.some((v) => v !== EMPTY);
    if (!busy || Date.now() - pendingReplace < 4000) { pendingReplace = 0; fn(); return; }
    pendingReplace = Date.now();
    toast('Você tem um campo em andamento. Toque de novo para começar outro.');
  }

  /* ================= Estado ================= */
  let game = null; // { n, trees, tents, rows, cols, cells, daily, elapsed, hints, won }
  let isTree = new Set();
  let history = [];
  let focus = 0;
  let autoGrass = store.get('autoGrass', false);

  function newGame(n, daily = null) {
    const rnd = daily ? mulberry32(hashStr('jogateca-acampamento-' + daily)) : Math.random;
    const level = daily ? DAILY_LEVEL : SIZES[n].level;
    const p = E.generate(n, rnd, level);
    game = { n, trees: p.trees, tents: p.tents, rows: p.rows, cols: p.cols, cells: new Array(n * n).fill(EMPTY), daily, elapsed: 0, hints: 0, won: false };
    history = [];
    focus = p.trees[0] || 0;
    startPlay();
  }
  function resume(sv) { game = sv; history = []; focus = sv.trees[0] || 0; startPlay(); }

  function startPlay() {
    isTree = new Set(game.trees);
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
  let cellEls = [], rowEls = [], colEls = [];
  const CLUE_FR = 0.72;
  function buildBoard() {
    const { n } = game;
    const board = $('#board');
    const tracks = `minmax(0, ${CLUE_FR}fr) repeat(${n}, minmax(0, 1fr))`;
    board.style.gridTemplateColumns = tracks;
    board.style.gridTemplateRows = tracks;
    board.innerHTML = '';
    cellEls = []; rowEls = []; colEls = [];
    const corner = document.createElement('span');
    corner.className = 'corner';
    board.appendChild(corner);
    for (let c = 0; c < n; c++) {
      const b = document.createElement('button');
      b.className = 'clue col'; b.dataset.col = c; b.textContent = game.cols[c]; b.tabIndex = -1;
      board.appendChild(b); colEls.push(b);
    }
    for (let r = 0; r < n; r++) {
      const b = document.createElement('button');
      b.className = 'clue row'; b.dataset.row = r; b.textContent = game.rows[r]; b.tabIndex = -1;
      board.appendChild(b); rowEls.push(b);
      for (let c = 0; c < n; c++) {
        const i = r * n + c;
        const el = document.createElement('button');
        el.className = 'cell' + ((r + c) % 2 ? ' alt' : '');
        if (r === 0 && c === 0) el.classList.add('tl');
        if (r === 0 && c === n - 1) el.classList.add('tr');
        if (r === n - 1 && c === 0) el.classList.add('bl');
        if (r === n - 1 && c === n - 1) el.classList.add('br');
        el.dataset.i = i;
        el.setAttribute('role', 'gridcell');
        if (isTree.has(i)) { el.classList.add('tree-cell'); el.innerHTML = treeSvg(i); el.dataset.kind = 'tree'; }
        board.appendChild(el); cellEls.push(el);
      }
    }
  }
  function sizeBoard() {
    if (!game) return;
    const w = $('#board').clientWidth;
    if (!w) return;
    const cell = w / (game.n + CLUE_FR);
    $('#board').style.setProperty('--fs', `${Math.max(11, Math.min(26, cell * 0.5)).toFixed(1)}px`);
  }
  if ('ResizeObserver' in window) new ResizeObserver(sizeBoard).observe($('#board'));
  else window.addEventListener('resize', sizeBoard);

  // Situação atual: conflitos, contas das linhas e onde não cabe barraca (para a grama automática).
  function analyze() {
    const { n, cells, rows, cols } = game;
    const tents = [];
    cells.forEach((v, i) => { if (v === TENT) tents.push(i); });
    const bad = new Set(), lonely = new Set();
    let reason = '';
    const rowCount = new Array(n).fill(0), colCount = new Array(n).fill(0);
    for (const t of tents) {
      rowCount[Math.floor(t / n)]++; colCount[t % n]++;
      for (const j of E.around(n, t)) if (cells[j] === TENT && !isTree.has(j)) { bad.add(t); bad.add(j); reason = reason || 'Duas barracas estão encostadas.'; }
      if (!E.orth(n, t).some((j) => isTree.has(j))) { bad.add(t); reason = reason || 'Toda barraca precisa ficar ao lado de uma árvore.'; }
    }
    for (const t of game.trees) {
      const nb = E.orth(n, t);
      if (!nb.some((j) => cells[j] === TENT) && nb.every((j) => isTree.has(j) || cells[j] === GRASS)) {
        lonely.add(t); reason = reason || 'Uma árvore ficou sem lugar para a barraca.';
      }
    }
    for (let k = 0; k < n; k++) {
      if (rowCount[k] > rows[k]) reason = reason || `A linha ${k + 1} tem barracas demais.`;
      if (colCount[k] > cols[k]) reason = reason || `A coluna ${k + 1} tem barracas demais.`;
    }
    const blocked = new Set();
    if (autoGrass) {
      for (let i = 0; i < n * n; i++) {
        if (isTree.has(i) || cells[i] !== EMPTY) continue;
        const r = Math.floor(i / n), c = i % n;
        if (!E.orth(n, i).some((j) => isTree.has(j)) || E.around(n, i).some((j) => cells[j] === TENT)
          || rowCount[r] >= rows[r] || colCount[c] >= cols[c]) blocked.add(i);
      }
    }
    return { tents, bad, lonely, reason, rowCount, colCount, blocked };
  }

  function render() {
    if (!game) return;
    const { n, cells } = game;
    const { tents, bad, lonely, reason, rowCount, colCount, blocked } = analyze();
    for (let i = 0; i < n * n; i++) {
      const el = cellEls[i];
      el.tabIndex = i === focus ? 0 : -1;
      const r = Math.floor(i / n) + 1, c = (i % n) + 1;
      if (isTree.has(i)) {
        el.classList.toggle('lonely', lonely.has(i));
        el.setAttribute('aria-label', `Linha ${r}, coluna ${c}: árvore${lonely.has(i) ? ', sem lugar para barraca' : ''}`);
        continue;
      }
      const v = cells[i];
      const kind = v === TENT ? 'tent' : v === GRASS ? 'grass' : blocked.has(i) ? 'auto' : 'empty';
      if (el.dataset.kind !== kind) {
        el.dataset.kind = kind;
        el.innerHTML = kind === 'tent' ? tentSvg(i) : kind === 'grass' ? tuftSvg(false) : kind === 'auto' ? tuftSvg(true) : '';
      }
      el.classList.toggle('bad', bad.has(i));
      el.setAttribute('aria-label', `Linha ${r}, coluna ${c}: ${v === TENT ? 'barraca' : v === GRASS ? 'grama' : 'vazia'}${bad.has(i) ? ', em conflito' : ''}`);
    }
    for (let k = 0; k < n; k++) {
      rowEls[k].classList.toggle('done', rowCount[k] === game.rows[k]);
      rowEls[k].classList.toggle('over', rowCount[k] > game.rows[k]);
      rowEls[k].setAttribute('aria-label', `Linha ${k + 1}: ${game.rows[k]} barracas, ${rowCount[k]} armadas`);
      colEls[k].classList.toggle('done', colCount[k] === game.cols[k]);
      colEls[k].classList.toggle('over', colCount[k] > game.cols[k]);
      colEls[k].setAttribute('aria-label', `Coluna ${k + 1}: ${game.cols[k]} barracas, ${colCount[k]} armadas`);
    }
    const total = game.trees.length;
    $('#infoTitle').textContent = game.daily ? `Do dia · ${n}×${n}` : `${SIZES[n].label} · ${n}×${n}`;
    $('#infoTents').textContent = `${tents.length}/${total}`;
    $('#timer').textContent = fmtTime(game.elapsed / 1000);
    const st = $('#status');
    st.classList.toggle('bad', !!reason);
    st.textContent = reason || (tents.length === total ? 'Todas as barracas armadas… confira as contas.'
      : tents.length ? `Faltam ${plural(total - tents.length, 'barraca', 'barracas')}.` : 'Toque numa casa ao lado de uma árvore para armar uma barraca.');
    $('#autoBtn').setAttribute('aria-pressed', String(autoGrass));
    $('#autoState').textContent = autoGrass ? 'lig.' : 'desl.';
    $('#undoBtn').disabled = history.length === 0;
    if (tents.length === total && !reason && tents.join() === game.tents.join()) win();
  }

  /* ================= Jogadas ================= */
  let gesture = null;
  function setCell(i, v) {
    if (isTree.has(i) || game.cells[i] === v) return;
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
  const cycle = (v) => (v === EMPTY ? TENT : v === TENT ? GRASS : EMPTY);

  // Toque: vazio → barraca → grama → vazio. Arrastar: marca (ou tira) grama em várias casas.
  // Botão direito do mouse: liga/desliga grama.
  const board = $('#board');
  let press = null;
  const cellAt = (x, y) => {
    const el = document.elementFromPoint(x, y);
    const c = el && el.closest && el.closest('.cell');
    return c && board.contains(c) ? +c.dataset.i : -1;
  };
  board.addEventListener('pointerdown', (e) => {
    if (!game || game.won) return;
    const clue = e.target.closest('.clue');
    if (clue) { e.preventDefault(); fillLine(clue); return; }
    const i = cellAt(e.clientX, e.clientY);
    if (i < 0 || isTree.has(i)) return;
    e.preventDefault();
    if (e.button === 2) { begin(); setCell(i, game.cells[i] === GRASS ? EMPTY : GRASS); end(); focus = i; return; }
    if (e.button > 0) return;
    if (press) finish();
    board.setPointerCapture(e.pointerId);
    focus = i;
    const start = game.cells[i];
    press = { start: i, last: i, dragged: false, action: start === EMPTY ? GRASS : start === GRASS ? EMPTY : null };
    cellEls[i].classList.add('peek');
  });
  board.addEventListener('pointermove', (e) => {
    if (!press) return;
    if (e.pointerType === 'mouse' && e.buttons === 0) { finish(); return; }
    const i = cellAt(e.clientX, e.clientY);
    if (i < 0 || i === press.last) return;
    press.last = i;
    if (press.action === null || isTree.has(i)) return;
    if (!press.dragged) { press.dragged = true; begin(); setCell(press.start, press.action); }
    const v = game.cells[i];
    if (press.action === GRASS && v === EMPTY) setCell(i, GRASS);
    if (press.action === EMPTY && v === GRASS) setCell(i, EMPTY);
    render();
  });
  const finish = () => {
    if (!press) return;
    if (cellEls[press.start]) cellEls[press.start].classList.remove('peek');
    if (press.dragged) end();
    else { begin(); setCell(press.start, cycle(game.cells[press.start])); end(); }
    press = null;
  };
  board.addEventListener('pointerup', finish);
  board.addEventListener('lostpointercapture', finish);
  board.addEventListener('pointercancel', () => { if (press && press.dragged) end(); if (press) cellEls[press.start].classList.remove('peek'); press = null; });
  board.addEventListener('contextmenu', (e) => e.preventDefault());

  // Toque num número: com a conta fechada, o resto da linha vira grama.
  function fillLine(clue) {
    const n = game.n;
    const isRow = clue.dataset.row != null;
    const k = +(isRow ? clue.dataset.row : clue.dataset.col);
    const cells = Array.from({ length: n }, (_, j) => (isRow ? k * n + j : j * n + k)).filter((i) => !isTree.has(i));
    const want = isRow ? game.rows[k] : game.cols[k];
    const have = cells.filter((i) => game.cells[i] === TENT).length;
    const name = isRow ? 'linha' : 'coluna';
    if (have > want) { toast(`Essa ${name} tem barracas demais.`); return; }
    if (have < want) { toast(`Ainda ${want - have === 1 ? 'falta 1 barraca' : `faltam ${want - have} barracas`} nesta ${name}.`); return; }
    const empties = cells.filter((i) => game.cells[i] === EMPTY);
    if (!empties.length) return;
    begin(); empties.forEach((i) => setCell(i, GRASS)); end();
  }

  function undo() {
    const h = history.pop();
    if (!h || !game || game.won) return;
    for (const [i, v] of h) game.cells[i] = v;
    render(); save();
  }

  // Dica: primeiro desfaz um engano; senão, arma a barraca que o raciocínio encontraria primeiro.
  function hint() {
    if (!game || game.won) return;
    const { n, cells } = game;
    const sol = new Set(game.tents);
    begin();
    const wrongTent = cells.findIndex((v, i) => v === TENT && !sol.has(i));
    const wrongGrass = cells.findIndex((v, i) => v === GRASS && sol.has(i));
    if (wrongTent >= 0 || wrongGrass >= 0) {
      const i = wrongTent >= 0 ? wrongTent : wrongGrass;
      setCell(i, EMPTY);
      focus = i;
      toast(wrongTent >= 0 ? 'Essa barraca estava no lugar errado.' : 'Essa casa marcada como grama leva uma barraca.');
    } else {
      const res = E.logicSolve(n, game.trees, game.rows, game.cols, { start: cells });
      let i = res.order.find((j) => sol.has(j) && cells[j] !== TENT);
      if (i == null) i = game.tents.find((j) => cells[j] !== TENT);
      if (i == null) { gesture = null; return; }
      setCell(i, TENT);
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
    toast('Campo limpo. Dá para desfazer.');
  }

  $('#undoBtn').addEventListener('click', undo);
  $('#hintBtn').addEventListener('click', hint);
  $('#clearBtn').addEventListener('click', restart);
  $('#autoBtn').addEventListener('click', () => { autoGrass = !autoGrass; store.set('autoGrass', autoGrass); render(); });

  document.addEventListener('keydown', (e) => {
    if (current !== 'play' || !game || game.won) return;
    if (!$('#paused').hidden) { if (['Enter', ' ', 'p', 'P'].includes(e.key)) { e.preventDefault(); setPaused(false); } return; }
    const n = game.n, k = e.key;
    const onBoard = e.target.closest && e.target.closest('.cell');
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(k)) {
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
    else if (low === 't' || low === 'b') { begin(); setCell(focus, game.cells[focus] === TENT ? EMPTY : TENT); end(); }
    else if (low === 'g' || low === 'x') { begin(); setCell(focus, game.cells[focus] === GRASS ? EMPTY : GRASS); end(); }
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
    const map = { trees: game.trees, tents: game.tents };
    if (game.daily) {
      if (!store.get('daily:' + game.daily)) store.set('daily:' + game.daily, { ...result, ...map });
    } else {
      prevBest = store.get('best:' + game.n);
      if (!game.hints && (!prevBest || time < prevBest)) store.set('best:' + game.n, time);
      store.set('wins:' + game.n, store.get('wins:' + game.n, 0) + 1);
    }
    store.del('save');
    const r = { n: game.n, daily: game.daily, ...map, ...result };
    celebrate();
    setTimeout(() => showWin(r, true, prevBest), 1900);
  }

  function celebrate() {
    const n = game.n;
    cellEls.forEach((el, i) => el.style.setProperty('--d', `${(Math.floor(i / n) + (i % n)) * 45}ms`));
    $('#frame').classList.add('celebrate');
    setTimeout(() => $('#frame').classList.remove('celebrate'), 1900);
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const box = $('#fireflies');
    box.innerHTML = Array.from({ length: 30 }, () =>
      `<i style="left:${Math.random() * 100}%;animation-delay:${Math.random() * 1.4}s;animation-duration:${3 + Math.random() * 2.2}s;--x:${(Math.random() - 0.5) * 120}px"></i>`).join('');
    setTimeout(() => { box.innerHTML = ''; }, 6000);
  }

  function showWin(r, fresh, prevBest = null) {
    show('win');
    $('#winEyebrow').textContent = r.daily ? `Camping do dia · ${dateLabel(r.daily)}` : `${SIZES[r.n].label} · ${r.n}×${r.n}`;
    const wb = $('#winBoard');
    wb.style.gridTemplateColumns = `repeat(${r.n}, 1fr)`;
    wb.style.gridTemplateRows = `repeat(${r.n}, 1fr)`;
    if (r.trees && r.tents) {
      const trees = new Set(r.trees), tents = new Set(r.tents);
      wb.innerHTML = Array.from({ length: r.n * r.n }, (_, i) =>
        `<i>${trees.has(i) ? treeSvg(i, '') : tents.has(i) ? tentSvg(i, '') : ''}</i>`).join('');
    } else wb.innerHTML = '';
    $('#winTime').textContent = fmtTime(r.time);
    let sub;
    if (r.daily) sub = fresh ? 'O mesmo campo para todo mundo hoje. Compare o tempo!' : 'Você já armou o de hoje. Um novo camping abre à meia-noite.';
    else if (r.hints) sub = `Com ${plural(r.hints, 'dica', 'dicas')}. Partidas com dica não contam para o recorde.`;
    else if (!prevBest) sub = 'Primeiro recorde neste tamanho!';
    else if (r.time < prevBest) sub = `Novo recorde! Antes: ${fmtTime(prevBest)}`;
    else sub = `Seu recorde: ${fmtTime(prevBest)}`;
    $('#winSub').textContent = sub;
    $('#winShare').onclick = () => share(
      `Acampamento${r.daily ? ` do dia ${dateLabel(r.daily)}` : ''} · ${r.n}×${r.n}\n⛺ ${fmtTime(r.time)}${r.hints ? ` · ${plural(r.hints, 'dica', 'dicas')}` : ' · sem dicas'}\n${location.origin}${location.pathname}`,
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
