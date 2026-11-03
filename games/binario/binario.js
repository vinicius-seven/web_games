(() => {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const E = window.BinarioEngine;
  const SIZES = {
    6: { label: 'Fácil', level: 0 },
    8: { label: 'Médio', level: 1 },
    10: { label: 'Difícil', level: 2 },
    12: { label: 'Desafio', level: 2 },
  };
  const DAILY_SIZE = 10, DAILY_LEVEL = 1;
  const NAME = ['branco', 'azul'];
  const NAMES = ['brancos', 'azuis'];
  const FEM = ['branca', 'azul'], FEMS = ['brancas', 'azuis'];

  /* ================= Utilidades ================= */
  const store = {
    get(k, d = null) {
      try { const v = localStorage.getItem('binario:' + k); return v == null ? d : JSON.parse(v); }
      catch { return d; }
    },
    set(k, v) { try { localStorage.setItem('binario:' + k, JSON.stringify(v)); } catch { /* sem armazenamento */ } },
    del(k) { try { localStorage.removeItem('binario:' + k); } catch { /* sem armazenamento */ } },
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
        <span>${best ? `Melhor tempo ${fmtTime(best)}` : 'Sem recorde ainda'}${wins ? ` · ${plural(wins, 'painel', 'painéis')}` : ''}</span>
      </button>`;
    }).join('');
    const daily = store.get('daily:' + todayKey());
    $('#dailyText').textContent = daily
      ? `Assentado hoje em ${fmtTime(daily.time)}${daily.hints ? ` com ${plural(daily.hints, 'dica', 'dicas')}` : ''}. Um novo painel à meia-noite.`
      : `${dateLabel(todayKey())} · ${DAILY_SIZE}×${DAILY_SIZE}. O mesmo painel para todo mundo hoje.`;
    $('#dailyBtn').textContent = daily ? 'Ver resultado' : 'Jogar o de hoje';
    const sv = store.get('save');
    if (sv && !sv.won) {
      $('#resumeTitle').textContent = sv.daily ? `Painel do dia (${dateLabel(sv.daily)})` : `${SIZES[sv.n].label} ${sv.n}×${sv.n}`;
      $('#resumeInfo').textContent = `${fmtTime(sv.elapsed / 1000)} · ${plural(sv.cells.filter((v) => v < 0).length, 'casa vazia', 'casas vazias')}`;
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
    const busy = sv && !sv.won && sv.cells.some((v, i) => v >= 0 && sv.givens[i] < 0);
    if (!busy || Date.now() - pendingReplace < 4000) { pendingReplace = 0; fn(); return; }
    pendingReplace = Date.now();
    toast('Você tem um painel em andamento. Toque de novo para começar outro.');
  }

  /* ================= Estado ================= */
  let game = null; // { n, givens, sol, cells, daily, elapsed, hints, won }
  let history = [];
  let digits = store.get('digits', true);
  let focus = 0;
  let hl = new Map(); // casa → 'hl' | 'hl2'

  function newGame(n, daily = null) {
    show('play');
    $('#board').innerHTML = '';
    $('#loading').hidden = false;
    setTimeout(() => {
      const rnd = daily ? mulberry32(hashStr('jogateca-binario-' + daily)) : Math.random;
      const p = E.generate(n, rnd, daily ? DAILY_LEVEL : SIZES[n].level);
      game = { n, givens: p.givens, sol: p.sol, cells: p.givens.slice(), daily, elapsed: 0, hints: 0, won: false };
      history = [];
      startPlay();
    }, 30);
  }
  function resume(sv) { game = sv; history = []; startPlay(); }
  function startPlay() {
    focus = game.cells.findIndex((v, i) => game.givens[i] < 0);
    hl = new Map();
    $('#paused').hidden = true;
    $('#loading').hidden = true;
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

  /* ================= Tabuleiro ================= */
  let cellEls = [];
  function buildBoard() {
    const { n } = game;
    const board = $('#board');
    board.style.gridTemplateColumns = `repeat(${n}, minmax(0, 1fr))`;
    board.style.gridTemplateRows = `repeat(${n}, minmax(0, 1fr))`;
    board.innerHTML = '';
    cellEls = [];
    for (let i = 0; i < n * n; i++) {
      const el = document.createElement('button');
      el.className = 'cell';
      el.dataset.i = i;
      el.setAttribute('role', 'gridcell');
      board.appendChild(el); cellEls.push(el);
    }
  }
  function sizeBoard() {
    if (!game) return;
    const w = $('#board').clientWidth;
    if (w) $('#board').style.setProperty('--fs', `${Math.max(11, Math.min(30, (w / game.n) * 0.5)).toFixed(1)}px`);
  }
  if ('ResizeObserver' in window) new ResizeObserver(sizeBoard).observe($('#board'));
  else window.addEventListener('resize', sizeBoard);

  // Erros pelas regras: três iguais seguidos, mais da metade de um algarismo, linhas/colunas repetidas.
  function analyze() {
    const { n, cells } = game, half = n / 2;
    const bad = new Set();
    let reason = '';
    for (const { cells: ln, row } of E.lines(n)) {
      for (let j = 2; j < n; j++) {
        const v = cells[ln[j]];
        if (v >= 0 && v === cells[ln[j - 1]] && v === cells[ln[j - 2]]) {
          [ln[j], ln[j - 1], ln[j - 2]].forEach((i) => bad.add(i));
          reason = reason || `Três ${NAMES[v]} seguidos.`;
        }
      }
      for (const v of [0, 1]) {
        if (ln.filter((i) => cells[i] === v).length > half) {
          ln.forEach((i) => { if (cells[i] === v) bad.add(i); });
          reason = reason || `${row ? 'Uma linha' : 'Uma coluna'} tem mais de ${half} ${NAMES[v]}.`;
        }
      }
    }
    for (const row of [true, false]) {
      const seen = new Map();
      for (const { cells: ln, row: r } of E.lines(n)) {
        if (r !== row) continue;
        const vals = ln.map((i) => cells[i]);
        if (vals.some((v) => v < 0)) continue;
        const k = vals.join('');
        if (seen.has(k)) { [...seen.get(k), ...ln].forEach((i) => bad.add(i)); reason = reason || `Duas ${row ? 'linhas' : 'colunas'} iguais.`; }
        else seen.set(k, ln);
      }
    }
    return { bad, reason, empty: cells.filter((v) => v < 0).length };
  }

  function render() {
    if (!game) return;
    const { n, cells, givens } = game;
    const a = analyze();
    $('#board').classList.toggle('nodigits', !digits);
    for (let i = 0; i < n * n; i++) {
      const el = cellEls[i], v = cells[i];
      const cls = `cell${v === 0 ? ' t0' : v === 1 ? ' t1' : ''}${givens[i] >= 0 ? ' given' : ''}${a.bad.has(i) ? ' bad' : ''}${hl.has(i) ? ' ' + hl.get(i) : ''}`;
      if (el.className !== cls) el.className = cls;
      const txt = v >= 0 ? String(v) : '';
      if (el.textContent !== txt) el.textContent = txt;
      el.tabIndex = i === focus ? 0 : -1;
      el.setAttribute('aria-label', `Linha ${Math.floor(i / n) + 1}, coluna ${(i % n) + 1}: ${v < 0 ? 'vazia' : `${v} (${NAME[v]})`}${givens[i] >= 0 ? ', fixa' : ''}`);
    }
    $('#infoTitle').textContent = game.daily ? `Do dia · ${n}×${n}` : `${SIZES[n].label} · ${n}×${n}`;
    $('#infoEmpty').textContent = a.empty;
    $('#timer').textContent = fmtTime(game.elapsed / 1000);
    const st = $('#status');
    st.classList.toggle('bad', !!a.reason);
    st.textContent = a.reason || (a.empty ? 'Toque: vazio → 0 → 1. Segure para o caminho inverso.' : 'Painel completo!');
    $('#digitsBtn').setAttribute('aria-pressed', String(digits));
    $('#digitsState').textContent = digits ? 'lig.' : 'desl.';
    $('#undoBtn').disabled = history.length === 0;
    if (!a.empty && !a.reason) win();
  }

  /* ================= Jogadas ================= */
  function setCell(i, v, mark = true) {
    if (game.givens[i] >= 0 || game.cells[i] === v) return;
    if (mark) history.push([[i, game.cells[i]]]);
    if (history.length > 500) history.shift();
    game.cells[i] = v;
    hl = new Map();
  }
  const fwd = (v) => (v < 0 ? 0 : v === 0 ? 1 : -1);
  const back = (v) => (v < 0 ? 1 : v === 1 ? 0 : -1);

  const board = $('#board');
  let press = null;
  board.addEventListener('pointerdown', (e) => {
    const el = e.target.closest('.cell');
    if (!el || !game || game.won) return;
    const i = +el.dataset.i;
    if (game.givens[i] >= 0) return;
    if (e.button === 2) { e.preventDefault(); setCell(i, back(game.cells[i])); render(); save(); return; }
    if (e.button > 0) return;
    focus = i;
    press = { i, long: false, timer: setTimeout(() => {
      if (!press) return;
      press.long = true;
      setCell(i, back(game.cells[i])); render(); save();
      if (navigator.vibrate) try { navigator.vibrate(12); } catch { /* sem vibração */ }
    }, 430) };
  });
  const release = () => {
    if (!press) return;
    clearTimeout(press.timer);
    if (!press.long) { setCell(press.i, fwd(game.cells[press.i])); render(); save(); }
    press = null;
  };
  board.addEventListener('pointerup', release);
  board.addEventListener('pointerleave', () => { if (press) { clearTimeout(press.timer); press = null; } });
  board.addEventListener('pointercancel', () => { if (press) { clearTimeout(press.timer); press = null; } });
  board.addEventListener('contextmenu', (e) => e.preventDefault());

  function undo() {
    const h = history.pop();
    if (!h || !game || game.won) return;
    for (const [i, v] of h) game.cells[i] = v;
    hl = new Map(); render(); save();
  }
  $('#undoBtn').addEventListener('click', undo);
  $('#digitsBtn').addEventListener('click', () => { digits = !digits; store.set('digits', digits); render(); });
  $('#clearBtn').addEventListener('click', () => {
    if (!game || game.won) return;
    const changes = [];
    game.cells.forEach((v, i) => { if (game.givens[i] < 0 && v >= 0) changes.push([i, v]); });
    if (!changes.length) return;
    history.push(changes);
    for (const [i] of changes) game.cells[i] = -1;
    render(); save();
    toast('Painel limpo. Dá para desfazer.');
  });

  /* ================= Dica ================= */
  function explain(why, v) {
    const where = why.line ? (why.line.row ? 'linha' : 'coluna') : '';
    switch (why.rule) {
      case 'pair': return `Dois ${NAMES[1 - v]} lado a lado: as casas das pontas precisam ser ${FEMS[v]}.`;
      case 'sandwich': return `Entre dois ${NAMES[1 - v]}, a casa do meio precisa ser ${FEM[v]}.`;
      case 'count': return `Essa ${where} já tem metade de ${NAMES[why.digit]}: o resto é ${NAME[v]}.`;
      case 'enum': return `Testando todas as formas de completar essa ${where} (sem três iguais e sem repetir outra ${where}), esta casa é sempre ${FEM[v]}.`;
      case 'trial': return `Se esta casa fosse ${FEM[1 - v]}, logo daria contradição. Então é ${FEM[v]}.`;
      default: return '';
    }
  }
  function hint() {
    if (!game || game.won) return;
    const wrong = game.cells.findIndex((v, i) => v >= 0 && game.givens[i] < 0 && v !== game.sol[i]);
    if (wrong >= 0) {
      setCell(wrong, -1);
      game.hints++;
      hl = new Map([[wrong, 'hl']]);
      render(); save();
      toast('Esse azulejo estava errado.');
      return;
    }
    const got = E.hintStep(game.n, Int8Array.from(game.cells));
    let i, v, why = null;
    if (got) ({ i, v, why } = got);
    else { i = game.cells.findIndex((x) => x < 0); v = i >= 0 ? game.sol[i] : 0; }
    if (i == null || i < 0) return;
    setCell(i, v);
    game.hints++;
    focus = i;
    hl = new Map();
    if (why && why.line) why.line.cells.forEach((j) => hl.set(j, 'hl2'));
    if (why && why.at) why.at.forEach((j) => hl.set(j, 'hl2'));
    hl.set(i, 'hl');
    render(); save();
    if (why) toast(explain(why, v), 4200);
  }
  $('#hintBtn').addEventListener('click', hint);

  document.addEventListener('keydown', (e) => {
    if (current !== 'play' || !game || game.won) return;
    if (!$('#paused').hidden) { if (['Enter', ' ', 'p', 'P'].includes(e.key)) { e.preventDefault(); setPaused(false); } return; }
    const n = game.n, k = e.key;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(k)) {
      e.preventDefault();
      let r = Math.floor(focus / n), c = focus % n;
      if (k === 'ArrowUp') r = (r + n - 1) % n;
      if (k === 'ArrowDown') r = (r + 1) % n;
      if (k === 'ArrowLeft') c = (c + n - 1) % n;
      if (k === 'ArrowRight') c = (c + 1) % n;
      focus = r * n + c;
      render(); cellEls[focus].focus();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && k.toLowerCase() === 'z') { e.preventDefault(); undo(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const low = k.toLowerCase();
    const onBoard = e.target.closest && e.target.closest('.cell');
    if (k === '0' || k === '1') { setCell(focus, +k); render(); save(); }
    else if (onBoard && (k === 'Enter' || k === ' ')) { e.preventDefault(); setCell(focus, fwd(game.cells[focus])); render(); save(); }
    else if (k === 'Backspace' || k === 'Delete') { e.preventDefault(); setCell(focus, -1); render(); save(); }
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
    const result = { time, hints: game.hints, sol: game.cells.slice() };
    let prevBest = null;
    if (game.daily) { if (!store.get('daily:' + game.daily)) store.set('daily:' + game.daily, result); }
    else {
      prevBest = store.get('best:' + game.n);
      if (!game.hints && (!prevBest || time < prevBest)) store.set('best:' + game.n, time);
      store.set('wins:' + game.n, store.get('wins:' + game.n, 0) + 1);
    }
    store.del('save');
    const n = game.n;
    cellEls.forEach((el, i) => el.style.setProperty('--d', `${(Math.floor(i / n) + (i % n)) * 35}ms`));
    $('#frame').classList.add('celebrate');
    $('#status').textContent = 'Painel assentado!';
    setTimeout(() => { $('#frame').classList.remove('celebrate'); showWin({ n, daily: game.daily, ...result }, true, prevBest); }, 1500);
  }
  function showWin(r, fresh, prevBest = null) {
    show('win');
    $('#winEyebrow').textContent = r.daily ? `Painel do dia · ${dateLabel(r.daily)}` : `${SIZES[r.n].label} · ${r.n}×${r.n}`;
    const wb = $('#winBoard');
    wb.style.gridTemplateColumns = `repeat(${r.n}, 1fr)`;
    wb.innerHTML = (r.sol || []).map((v) => `<i class="t${v}"></i>`).join('');
    $('#winTime').textContent = fmtTime(r.time);
    let sub;
    if (r.daily) sub = fresh ? 'O mesmo painel para todo mundo hoje. Compare o tempo!' : 'Você já assentou o de hoje. Um novo painel à meia-noite.';
    else if (r.hints) sub = `Com ${plural(r.hints, 'dica', 'dicas')}. Partidas com dica não contam para o recorde.`;
    else if (!prevBest) sub = 'Primeiro recorde neste tamanho!';
    else if (r.time < prevBest) sub = `Novo recorde! Antes: ${fmtTime(prevBest)}`;
    else sub = `Seu recorde: ${fmtTime(prevBest)}`;
    $('#winSub').textContent = sub;
    $('#winShare').onclick = () => share(`Binário${r.daily ? ` do dia ${dateLabel(r.daily)}` : ''} · ${r.n}×${r.n}\n🟦⬜ ${fmtTime(r.time)}${r.hints ? ` · ${plural(r.hints, 'dica', 'dicas')}` : ' · sem dicas'}\n${location.origin}${location.pathname}`);
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
