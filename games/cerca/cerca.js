(() => {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const E = window.CercaEngine;
  const { UNK, LINE, CROSS } = E;
  const SIZES = {
    5: { label: 'Fácil', level: 0 },
    7: { label: 'Médio', level: 1 },
    8: { label: 'Difícil', level: 2 },
    10: { label: 'Desafio', level: 2 },
  };
  const DAILY_SIZE = 8, DAILY_LEVEL = 1;
  const U = 10, M = 6; // unidade de desenho por casa e margem

  /* ================= Utilidades ================= */
  const store = {
    get(k, d = null) {
      try { const v = localStorage.getItem('cerca:' + k); return v == null ? d : JSON.parse(v); }
      catch { return d; }
    },
    set(k, v) { try { localStorage.setItem('cerca:' + k, JSON.stringify(v)); } catch { /* sem armazenamento */ } },
    del(k) { try { localStorage.removeItem('cerca:' + k); } catch { /* sem armazenamento */ } },
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
        <span>${best ? `Melhor tempo ${fmtTime(best)}` : 'Sem recorde ainda'}${wins ? ` · ${plural(wins, 'pasto', 'pastos')}` : ''}</span>
      </button>`;
    }).join('');
    const daily = store.get('daily:' + todayKey());
    $('#dailyText').textContent = daily
      ? `Cercado hoje em ${fmtTime(daily.time)}${daily.hints ? ` com ${plural(daily.hints, 'dica', 'dicas')}` : ''}. Um novo pasto à meia-noite.`
      : `${dateLabel(todayKey())} · ${DAILY_SIZE}×${DAILY_SIZE}. O mesmo pasto para todo mundo hoje.`;
    $('#dailyBtn').textContent = daily ? 'Ver resultado' : 'Jogar o de hoje';
    const sv = store.get('save');
    if (sv && !sv.won) {
      $('#resumeTitle').textContent = sv.daily ? `Pasto do dia (${dateLabel(sv.daily)})` : `${SIZES[sv.n].label} ${sv.n}×${sv.n}`;
      $('#resumeInfo').textContent = `${fmtTime(sv.elapsed / 1000)} · ${plural(sv.edges.filter((v) => v === LINE).length, 'cerca', 'cercas')}`;
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
    const busy = sv && !sv.won && sv.edges.some((v) => v !== UNK);
    if (!busy || Date.now() - pendingReplace < 4000) { pendingReplace = 0; fn(); return; }
    pendingReplace = Date.now();
    toast('Você tem um pasto em andamento. Toque de novo para começar outro.');
  }

  /* ================= Estado ================= */
  let game = null; // { n, clues, sol, edges, daily, elapsed, hints, won }
  let G = null;
  let history = [];
  let autoX = store.get('autoX', false);
  let hl = null; // destaque da dica

  function newGame(n, daily = null) {
    const rnd = daily ? mulberry32(hashStr('jogateca-cerca-' + daily)) : Math.random;
    const p = E.generate(n, n, rnd, daily ? DAILY_LEVEL : SIZES[n].level);
    G = E.geom(n, n);
    game = { n, clues: p.clues, sol: p.sol, edges: new Array(G.E).fill(UNK), daily, elapsed: 0, hints: 0, won: false };
    history = [];
    startPlay();
  }
  function resume(sv) { game = sv; G = E.geom(sv.n, sv.n); history = []; startPlay(); }
  function startPlay() {
    hl = null;
    $('#paused').hidden = true;
    $('#board').style.visibility = '';
    $('#frame').classList.remove('won');
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
    $('#board').style.visibility = p ? 'hidden' : '';
    syncTimer();
  }
  $('#pauseBtn').addEventListener('click', () => setPaused($('#paused').hidden));
  $('#resumePlay').addEventListener('click', () => setPaused(false));

  /* ================= Desenho ================= */
  const vxy = (x, n) => [(x % (n + 1)) * U, Math.floor(x / (n + 1)) * U];
  const edgeXY = (e) => { const [a, b] = G.edgeVerts[e]; return [...vxy(a, game.n), ...vxy(b, game.n)]; };

  // Casas dentro do cercado (pela paridade das cercas verticais em cada linha).
  function insideCells(edges) {
    const n = game.n, out = [];
    for (let r = 0; r < n; r++) {
      let inside = false;
      for (let c = 0; c < n; c++) {
        if (edges[G.v(r, c)] === LINE) inside = !inside;
        if (inside) out.push(r * n + c);
      }
    }
    return out;
  }

  function analyze(edges) {
    const deg = new Array(G.V).fill(0), open = new Array(G.V).fill(0);
    edges.forEach((v, e) => { for (const x of G.edgeVerts[e]) { if (v === LINE) deg[x]++; else if (v === UNK) open[x]++; } });
    const clueState = game.clues.map((k, i) => {
      if (k < 0) return '';
      let L = 0, Un = 0;
      for (const e of G.cellEdges[i]) { if (edges[e] === LINE) L++; else if (edges[e] === UNK) Un++; }
      // um 0 só apaga quando os quatro lados estiverem marcados
      return L > k || L + Un < k ? 'bad' : L === k && (k > 0 || Un === 0) ? 'done' : '';
    });
    let reason = '';
    if (deg.some((d) => d > 2)) reason = 'Num poste passam mais de duas cercas.';
    else if (clueState.includes('bad')) reason = 'Algum número ficou com cercas demais (ou de menos).';
    // ×s automáticos: lados de números completos e postes com duas cercas.
    const autoSet = new Set();
    if (autoX) {
      game.clues.forEach((k, i) => {
        if (k < 0 || clueState[i] === 'bad') return;
        const L = G.cellEdges[i].filter((e) => edges[e] === LINE).length;
        if (L === k) for (const e of G.cellEdges[i]) if (edges[e] === UNK) autoSet.add(e);
      });
      deg.forEach((d, x) => { if (d === 2) for (const e of G.vertEdges[x]) if (edges[e] === UNK) autoSet.add(e); });
      deg.forEach((d, x) => { if (d === 0 && open[x] === 1) for (const e of G.vertEdges[x]) if (edges[e] === UNK) autoSet.add(e); });
    }
    return { deg, clueState, reason, autoSet };
  }

  function boardSvg(edges, { won = false, clueState = null, deg = null, autoSet = null } = {}) {
    const n = game.n, W = n * U;
    let s = `<rect class="bg" x="${-M}" y="${-M}" width="${W + 2 * M}" height="${W + 2 * M}"/>`;
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if ((r + c) % 2) s += `<rect class="grass" x="${c * U}" y="${r * U}" width="${U}" height="${U}"/>`;
    if (won) {
      const ins = insideCells(edges);
      s += ins.map((i) => `<rect class="pen" x="${(i % n) * U - 0.05}" y="${Math.floor(i / n) * U - 0.05}" width="${U + 0.1}" height="${U + 0.1}"/>`).join('');
      const spots = ins.filter((i) => game.clues[i] < 0);
      const step = Math.max(1, Math.round(spots.length / Math.min(6, Math.max(1, Math.round(spots.length / 4)))));
      s += spots.filter((_, k) => k % step === Math.floor(step / 2)).slice(0, 7).map((i, k) =>
        `<text class="sheep" style="animation-delay:${k * 0.12}s;transform-origin:${(i % n) * U + U / 2}px ${Math.floor(i / n) * U + U / 2}px" x="${(i % n) * U + U / 2}" y="${Math.floor(i / n) * U + U / 2}">🐑</text>`).join('');
    }
    game.clues.forEach((k, i) => {
      if (k < 0) return;
      const st = clueState ? clueState[i] : '';
      s += `<text class="clue ${st}" x="${(i % n) * U + U / 2}" y="${Math.floor(i / n) * U + U / 2 + 0.4}" font-size="6.2">${k}</text>`;
    });
    edges.forEach((v, e) => {
      const [x1, y1, x2, y2] = edgeXY(e);
      if (v === CROSS || (autoSet && autoSet.has(e))) {
        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, d = 1.1;
        s += `<path class="x${v === CROSS ? '' : ' auto'}" stroke-width="0.7" d="M${mx - d} ${my - d}L${mx + d} ${my + d}M${mx + d} ${my - d}L${mx - d} ${my + d}"/>`;
      }
    });
    edges.forEach((v, e) => {
      if (v !== LINE) return;
      const [x1, y1, x2, y2] = edgeXY(e);
      s += `<line class="fence" stroke-width="2.3" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
      s += `<line class="fence-hi" stroke-width="0.6" x1="${x1}" y1="${y1 - (y1 === y2 ? 0.45 : 0)}" x2="${x2}" y2="${y2 - (y1 === y2 ? 0.45 : 0)}"/>`;
    });
    for (let x = 0; x < G.V; x++) {
      const [px, py] = vxy(x, n);
      const d = deg ? deg[x] : 0;
      s += `<circle class="post${d > 2 ? ' bad' : ''}" cx="${px}" cy="${py}" r="${d ? 1.25 : 0.85}"/>`;
    }
    return s;
  }

  function render() {
    if (!game) return;
    const n = game.n, W = n * U;
    const board = $('#board');
    board.setAttribute('viewBox', `${-M} ${-M} ${W + 2 * M} ${W + 2 * M}`);
    const a = analyze(game.edges);
    let s = boardSvg(game.edges, { clueState: a.clueState, deg: a.deg, autoSet: a.autoSet });
    if (hl) s += hl;
    board.innerHTML = s;
    const lines = game.edges.filter((v) => v === LINE).length;
    $('#infoTitle').textContent = game.daily ? `Do dia · ${n}×${n}` : `${SIZES[n].label} · ${n}×${n}`;
    $('#infoLines').textContent = lines;
    $('#timer').textContent = fmtTime(game.elapsed / 1000);
    const st = $('#status');
    st.classList.toggle('bad', !!a.reason);
    st.textContent = a.reason || (lines ? 'Feche um único cercado.' : 'Toque entre dois postes ou arraste para cercar.');
    $('#autoBtn').setAttribute('aria-pressed', String(autoX));
    $('#autoState').textContent = autoX ? 'lig.' : 'desl.';
    $('#undoBtn').disabled = history.length === 0;
    if (!a.reason && lines && solvedNow()) win();
  }
  const solvedNow = () => E.isSolved(G, game.clues, Int8Array.from(game.edges, (v) => (v === LINE ? LINE : CROSS)));

  /* ================= Jogadas ================= */
  let gesture = null;
  function setEdge(e, v) {
    if (game.edges[e] === v) return;
    if (gesture && !gesture.has(e)) gesture.set(e, game.edges[e]);
    game.edges[e] = v;
  }
  function begin() { gesture = new Map(); }
  function end() {
    if (gesture && gesture.size) { history.push([...gesture]); if (history.length > 500) history.shift(); }
    gesture = null; hl = null;
    render(); save();
  }
  const cycle = (v) => (v === UNK ? LINE : v === LINE ? CROSS : UNK);

  const board = $('#board');
  function toGrid(ev) {
    const r = board.getBoundingClientRect(), n = game.n, W = n * U + 2 * M;
    return [((ev.clientX - r.left) / r.width * W - M) / U, ((ev.clientY - r.top) / r.height * W - M) / U];
  }
  function nearestEdge(x, y) {
    const n = game.n;
    let best = -1, bd = 0.42;
    const hr = Math.round(y), hc = Math.floor(x);
    if (hr >= 0 && hr <= n && hc >= 0 && hc < n && Math.abs(y - hr) < bd) { bd = Math.abs(y - hr); best = G.h(hr, hc); }
    const vc = Math.round(x), vr = Math.floor(y);
    if (vc >= 0 && vc <= n && vr >= 0 && vr < n && Math.abs(x - vc) < bd) { bd = Math.abs(x - vc); best = G.v(vr, vc); }
    return best;
  }
  function nearestVert(x, y) {
    const n = game.n, r = Math.round(y), c = Math.round(x);
    if (r < 0 || c < 0 || r > n || c > n || Math.hypot(x - c, y - r) > 0.38) return -1;
    return r * (n + 1) + c;
  }
  function edgeBetween(a, b) {
    const n = game.n, ra = Math.floor(a / (n + 1)), ca = a % (n + 1), rb = Math.floor(b / (n + 1)), cb = b % (n + 1);
    if (ra === rb && Math.abs(ca - cb) === 1) return G.h(ra, Math.min(ca, cb));
    if (ca === cb && Math.abs(ra - rb) === 1) return G.v(Math.min(ra, rb), ca);
    return -1;
  }

  let press = null;
  board.addEventListener('pointerdown', (ev) => {
    if (!game || game.won) return;
    ev.preventDefault();
    const [x, y] = toGrid(ev);
    if (ev.button === 2) {
      const e = nearestEdge(x, y);
      if (e >= 0) { begin(); setEdge(e, game.edges[e] === CROSS ? UNK : CROSS); end(); }
      return;
    }
    if (ev.button > 0) return;
    board.setPointerCapture(ev.pointerId);
    press = { x, y, vert: nearestVert(x, y), dragging: false, action: null };
  });
  board.addEventListener('pointermove', (ev) => {
    if (!press) return;
    const [x, y] = toGrid(ev);
    if (!press.dragging && Math.hypot(x - press.x, y - press.y) < 0.3) return;
    if (!press.dragging) { press.dragging = true; begin(); if (press.vert < 0) press.vert = nearestVert(x, y); }
    const v = nearestVert(x, y);
    if (v < 0 || v === press.vert) return;
    if (press.vert >= 0) {
      const e = edgeBetween(press.vert, v);
      if (e >= 0) {
        if (press.action === null) press.action = game.edges[e] === LINE ? UNK : LINE;
        setEdge(e, press.action);
        hl = null;
        render();
      }
    }
    press.vert = v;
  });
  function finish() {
    if (!press) return;
    if (press.dragging) end();
    else {
      const e = nearestEdge(press.x, press.y);
      if (e >= 0) { begin(); setEdge(e, cycle(game.edges[e])); end(); }
    }
    press = null;
  }
  board.addEventListener('pointerup', finish);
  board.addEventListener('lostpointercapture', finish);
  board.addEventListener('pointercancel', () => { if (press && press.dragging) end(); press = null; });
  board.addEventListener('contextmenu', (ev) => ev.preventDefault());

  function undo() {
    const h = history.pop();
    if (!h || !game || game.won) return;
    for (const [e, v] of h) game.edges[e] = v;
    hl = null; render(); save();
  }
  $('#undoBtn').addEventListener('click', undo);
  $('#autoBtn').addEventListener('click', () => { autoX = !autoX; store.set('autoX', autoX); render(); });
  $('#clearBtn').addEventListener('click', () => {
    if (!game || game.won || !game.edges.some((v) => v !== UNK)) return;
    begin(); game.edges.forEach((v, e) => setEdge(e, UNK)); end();
    toast('Pasto limpo. Dá para desfazer.');
  });

  /* ================= Dica ================= */
  const WHY = {
    cellFull: (k) => (k === 0 ? 'Um 0 não tem cerca em nenhum lado.' : `Esse ${k} já tem as suas ${k === 1 ? 'cerca' : 'cercas'}; os outros lados ficam livres.`),
    cellNeed: (k) => `Esse ${k} só tem esses lados sobrando: todos levam cerca.`,
    vertFull: () => 'Já passam duas cercas por esse poste; não cabe outra.',
    vertGo: () => 'A cerca que chega nesse poste só pode seguir por aqui.',
    vertDead: () => 'Desse poste sairia uma cerca só, e cerca não pode terminar solta.',
    loopEarly: () => 'Fechar aqui criaria um cercado pequeno, deixando cerca de fora.',
    loopWrong: () => 'Fechar aqui terminaria o cercado sem acertar todos os números.',
    color: () => 'Pensando em quais casas ficam dentro e quais ficam fora do cercado, esse lado fica decidido.',
    colorClue: (k) => `Dentro e fora: em volta desse ${k}, só uma combinação de casas dentro/fora funciona.`,
    trial: (k, why) => `Se aqui ${why.tried === LINE ? 'tivesse' : 'não tivesse'} cerca, logo daria contradição.`,
  };
  function hint() {
    if (!game || game.won) return;
    const wrong = game.edges.findIndex((v, e) => (v === LINE && game.sol[e] !== LINE) || (v === CROSS && game.sol[e] === LINE));
    begin();
    if (wrong >= 0) {
      const was = game.edges[wrong];
      setEdge(wrong, UNK);
      game.hints++;
      end();
      hl = hlEdge(wrong);
      render();
      toast(was === LINE ? 'Essa cerca estava errada.' : 'Esse × estava errado: aqui vai cerca.');
      return;
    }
    const st = Int8Array.from(game.edges);
    const got = E.hintStep(game.n, game.n, game.clues, st);
    let e, val, why;
    if (got) ({ e, val, why } = got);
    else { e = game.sol.findIndex((v, i) => v === LINE && game.edges[i] !== LINE); val = LINE; why = null; }
    if (e == null || e < 0) { gesture = null; return; }
    setEdge(e, val);
    game.hints++;
    end();
    hl = hlEdge(e) + (why && why.cell != null ? hlCell(why.cell) : '') + (why && why.vert != null ? hlVert(why.vert) : '');
    render();
    if (why && WHY[why.rule]) toast(WHY[why.rule](why.cell != null ? game.clues[why.cell] : 0, why), 4200);
  }
  const hlEdge = (e) => { const [x1, y1, x2, y2] = edgeXY(e); return `<line class="hl" stroke-width="3.6" stroke-opacity=".55" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`; };
  const hlCell = (i) => `<rect class="hl" stroke-width="0.8" x="${(i % game.n) * U + 0.8}" y="${Math.floor(i / game.n) * U + 0.8}" width="${U - 1.6}" height="${U - 1.6}" rx="1.5"/>`;
  const hlVert = (x) => { const [px, py] = vxy(x, game.n); return `<circle class="hl" stroke-width="0.7" cx="${px}" cy="${py}" r="2.4"/>`; };
  $('#hintBtn').addEventListener('click', hint);

  document.addEventListener('keydown', (ev) => {
    if (current !== 'play' || !game || game.won) return;
    if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'z') { ev.preventDefault(); undo(); return; }
    if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
    const k = ev.key.toLowerCase();
    if (k === 'z' || k === 'u') undo();
    else if (k === 'h') hint();
    else if (k === 'x') $('#autoBtn').click();
    else if (k === 'p') setPaused($('#paused').hidden);
  });

  /* ================= Vitória ================= */
  function win() {
    if (game.won) return;
    pauseTimer();
    game.won = true;
    const time = Math.round(game.elapsed / 1000);
    const result = { time, hints: game.hints, clues: game.clues, sol: game.sol };
    let prevBest = null;
    if (game.daily) { if (!store.get('daily:' + game.daily)) store.set('daily:' + game.daily, result); }
    else {
      prevBest = store.get('best:' + game.n);
      if (!game.hints && (!prevBest || time < prevBest)) store.set('best:' + game.n, time);
      store.set('wins:' + game.n, store.get('wins:' + game.n, 0) + 1);
    }
    store.del('save');
    // o pasto ganha capim e ovelhas dentro do cercado
    const clean = game.edges.map((v) => (v === LINE ? LINE : UNK));
    $('#board').innerHTML = boardSvg(clean, { won: true });
    $('#frame').classList.add('won');
    $('#status').textContent = 'Cercado!';
    setTimeout(() => showWin({ n: game.n, daily: game.daily, ...result }, true, prevBest), 1700);
  }
  function showWin(r, fresh, prevBest = null) {
    show('win');
    $('#winEyebrow').textContent = r.daily ? `Pasto do dia · ${dateLabel(r.daily)}` : `${SIZES[r.n].label} · ${r.n}×${r.n}`;
    if (r.clues && r.sol) {
      const keep = game;
      game = { n: r.n, clues: r.clues };
      G = E.geom(r.n, r.n);
      const wb = $('#winBoard');
      wb.setAttribute('viewBox', `${-M} ${-M} ${r.n * U + 2 * M} ${r.n * U + 2 * M}`);
      wb.innerHTML = boardSvg(r.sol.map((v) => (v === LINE ? LINE : UNK)), { won: true });
      game = keep;
      if (keep) G = E.geom(keep.n, keep.n);
    }
    $('#winTime').textContent = fmtTime(r.time);
    let sub;
    if (r.daily) sub = fresh ? 'O mesmo pasto para todo mundo hoje. Compare o tempo!' : 'Você já cercou o de hoje. Um novo pasto à meia-noite.';
    else if (r.hints) sub = `Com ${plural(r.hints, 'dica', 'dicas')}. Partidas com dica não contam para o recorde.`;
    else if (!prevBest) sub = 'Primeiro recorde neste tamanho!';
    else if (r.time < prevBest) sub = `Novo recorde! Antes: ${fmtTime(prevBest)}`;
    else sub = `Seu recorde: ${fmtTime(prevBest)}`;
    $('#winSub').textContent = sub;
    $('#winShare').onclick = () => share(`Cerca${r.daily ? ` do dia ${dateLabel(r.daily)}` : ''} · ${r.n}×${r.n}\n🐑 ${fmtTime(r.time)}${r.hints ? ` · ${plural(r.hints, 'dica', 'dicas')}` : ' · sem dicas'}\n${location.origin}${location.pathname}`);
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
