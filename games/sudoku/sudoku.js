(() => {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const DIFFS = {
    facil: { label: 'Fácil', givens: 38, dots: 1 },
    medio: { label: 'Médio', givens: 32, dots: 2 },
    dificil: { label: 'Difícil', givens: 27, dots: 3 },
    especialista: { label: 'Especialista', givens: 23, dots: 4 },
  };
  const DAILY_DIFF = 'medio';

  /* ================= Armazenamento ================= */
  const store = {
    get(k, d = null) {
      try { const v = localStorage.getItem('sudoku:' + k); return v == null ? d : JSON.parse(v); }
      catch { return d; }
    },
    set(k, v) { try { localStorage.setItem('sudoku:' + k, JSON.stringify(v)); } catch { /* sem armazenamento */ } },
    del(k) { try { localStorage.removeItem('sudoku:' + k); } catch { /* sem armazenamento */ } },
  };

  /* ================= Motor: gerar e resolver ================= */
  const ROW = (i) => Math.floor(i / 9);
  const COL = (i) => i % 9;
  const BOX = (i) => Math.floor(ROW(i) / 3) * 3 + Math.floor(COL(i) / 3);
  const PEERS = Array.from({ length: 81 }, (_, i) => {
    const out = [];
    for (let j = 0; j < 81; j++) {
      if (j !== i && (ROW(j) === ROW(i) || COL(j) === COL(i) || BOX(j) === BOX(i))) out.push(j);
    }
    return out;
  });
  const UNITS = [
    ...Array.from({ length: 9 }, (_, r) => Array.from({ length: 9 }, (__, c) => r * 9 + c)),
    ...Array.from({ length: 9 }, (_, c) => Array.from({ length: 9 }, (__, r) => r * 9 + c)),
    ...Array.from({ length: 9 }, (_, b) => Array.from({ length: 9 }, (__, k) =>
      (Math.floor(b / 3) * 3 + Math.floor(k / 3)) * 9 + (b % 3) * 3 + (k % 3))),
  ];
  const UNITS_OF = Array.from({ length: 81 }, (_, i) => [ROW(i), 9 + COL(i), 18 + BOX(i)]);

  function shuffle(arr, rnd) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Conta soluções (até `limit`). Se `out` for passado, copia nele a primeira solução encontrada.
  function solve(grid, limit, rnd = null, out = null) {
    const g = Int8Array.from(grid);
    const rows = new Int16Array(9), cols = new Int16Array(9), boxes = new Int16Array(9);
    for (let i = 0; i < 81; i++) {
      const v = g[i];
      if (!v) continue;
      const bit = 1 << v;
      if ((rows[ROW(i)] | cols[COL(i)] | boxes[BOX(i)]) & bit) return 0; // grade inválida
      rows[ROW(i)] |= bit; cols[COL(i)] |= bit; boxes[BOX(i)] |= bit;
    }
    let found = 0;
    const search = () => {
      let best = -1, bestMask = 0, bestCount = 10;
      for (let i = 0; i < 81; i++) {
        if (g[i]) continue;
        const mask = ~(rows[ROW(i)] | cols[COL(i)] | boxes[BOX(i)]) & 0x3fe;
        let n = 0; for (let m = mask; m; m &= m - 1) n++;
        if (n === 0) return false;
        if (n < bestCount) { best = i; bestMask = mask; bestCount = n; if (n === 1) break; }
      }
      if (best < 0) {
        if (found === 0 && out) out.set(g);
        found++;
        return found >= limit;
      }
      const digits = [];
      for (let d = 1; d <= 9; d++) if (bestMask & (1 << d)) digits.push(d);
      if (rnd) shuffle(digits, rnd);
      const r = ROW(best), c = COL(best), b = BOX(best);
      for (const d of digits) {
        const bit = 1 << d;
        g[best] = d; rows[r] |= bit; cols[c] |= bit; boxes[b] |= bit;
        const stop = search();
        g[best] = 0; rows[r] &= ~bit; cols[c] &= ~bit; boxes[b] &= ~bit;
        if (stop) return true;
      }
      return false;
    };
    search();
    return found;
  }

  // Gera uma grade completa aleatória e remove números em pares simétricos,
  // mantendo sempre solução única, até chegar perto da quantidade de pistas desejada.
  function generate(givens, rnd) {
    const solution = new Int8Array(81);
    solve(new Int8Array(81), 1, rnd, solution);
    const puzzle = Int8Array.from(solution);
    let count = 81;
    const order = shuffle(Array.from({ length: 41 }, (_, i) => i), rnd);
    for (const i of order) {
      if (count <= givens) break;
      const j = 80 - i;
      const vi = puzzle[i], vj = puzzle[j];
      puzzle[i] = 0; puzzle[j] = 0;
      if (solve(puzzle, 2) === 1) count -= i === j ? 1 : 2;
      else { puzzle[i] = vi; puzzle[j] = vj; }
    }
    // Segunda passada, casa a casa, para as dificuldades com poucas pistas.
    if (count > givens) {
      for (const i of shuffle(Array.from({ length: 81 }, (_, k) => k), rnd)) {
        if (count <= givens) break;
        if (!puzzle[i]) continue;
        const v = puzzle[i];
        puzzle[i] = 0;
        if (solve(puzzle, 2) === 1) count--; else puzzle[i] = v;
      }
    }
    return { puzzle: Array.from(puzzle), solution: Array.from(solution) };
  }

  /* ================= Aleatoriedade com semente (diário) ================= */
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
  const todayLabel = () => new Date().toLocaleDateString('pt-BR');
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
    window.scrollTo(0, 0);
    syncTimer();
  }
  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
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
    $('#diffs').innerHTML = Object.entries(DIFFS).map(([id, d]) => {
      const best = store.get('best:' + id);
      const wins = store.get('wins:' + id, 0);
      return `<button class="diff" data-diff="${id}">
        <strong>${d.label}</strong>
        <span class="dots" aria-hidden="true">${'●'.repeat(d.dots)}${'○'.repeat(4 - d.dots)}</span>
        <span>${best ? `Melhor tempo ${fmtTime(best)}` : 'Sem recorde ainda'}${wins ? ` · ${wins} ${wins === 1 ? 'vitória' : 'vitórias'}` : ''}</span>
      </button>`;
    }).join('');

    const daily = store.get('daily:' + todayKey());
    $('#dailyText').textContent = daily
      ? `Resolvido hoje em ${fmtTime(daily.time)}${daily.hints ? ` com ${daily.hints} ${daily.hints === 1 ? 'dica' : 'dicas'}` : ''}. Um novo aparece à meia-noite.`
      : `${todayLabel()} · ${DIFFS[DAILY_DIFF].label}. A mesma grade para todo mundo hoje.`;
    const dailyBtn = $('#dailyBtn');
    dailyBtn.textContent = daily ? 'Ver resultado' : 'Jogar o de hoje';

    const save = store.get('save');
    const rb = $('#resumeBtn');
    if (save && !save.won) {
      const filled = save.values.filter((v, i) => v && save.puzzle[i] === 0).length;
      const empty = save.puzzle.filter((v) => !v).length;
      $('#resumeTitle').textContent = save.daily ? `Sudoku do dia (${save.daily.split('-').reverse().join('/')})` : DIFFS[save.diff].label;
      $('#resumeInfo').textContent = `${fmtTime(save.elapsed / 1000)} · ${Math.round((filled / empty) * 100)}% preenchido`;
      $('#resumeMini').innerHTML = save.values.map((v, i) => `<i class="${save.puzzle[i] ? 'f' : v ? 'u' : ''}"></i>`).join('');
      rb.hidden = false;
    } else rb.hidden = true;
    show('home');
  }

  $('#diffs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-diff]');
    if (b) confirmReplace(() => newGame(b.dataset.diff));
  });
  $('#dailyBtn').addEventListener('click', () => {
    const done = store.get('daily:' + todayKey());
    if (done) { showWin({ daily: todayKey(), diff: DAILY_DIFF, ...done }, false); return; }
    const save = store.get('save');
    if (save && !save.won && save.daily === todayKey()) { resume(save); return; }
    confirmReplace(() => newGame(DAILY_DIFF, todayKey()));
  });
  $('#resumeBtn').addEventListener('click', () => { const s = store.get('save'); if (s) resume(s); });
  $('#homeBtn').addEventListener('click', renderHome);

  // Começar outro jogo descarta o salvo; pede uma segunda confirmação tocando de novo.
  let pendingReplace = 0;
  function confirmReplace(fn) {
    const save = store.get('save');
    const hasProgress = save && !save.won && save.values.some((v, i) => v && !save.puzzle[i]);
    if (!hasProgress || Date.now() - pendingReplace < 4000) { pendingReplace = 0; fn(); return; }
    pendingReplace = Date.now();
    toast('Você tem um jogo em andamento. Toque de novo para começar outro.');
  }

  /* ================= Estado do jogo ================= */
  let game = null; // { puzzle, solution, values, notes, diff, daily, elapsed, errors, hints, hinted, won }
  let sel = 40;
  let notesMode = false;
  let history = [];

  function newGame(diff, daily = null) {
    const rnd = daily ? mulberry32(hashStr('jogateca-sudoku-' + daily)) : Math.random;
    const { puzzle, solution } = generate(DIFFS[diff].givens, rnd);
    game = {
      puzzle, solution, values: puzzle.slice(), notes: new Array(81).fill(0),
      diff, daily, elapsed: 0, errors: 0, hints: 0, hinted: [], won: false,
    };
    history = [];
    sel = puzzle.indexOf(0);
    startPlay();
  }

  function resume(save) {
    game = save;
    game.hinted = game.hinted || [];
    history = [];
    sel = game.values.indexOf(0);
    if (sel < 0) sel = 40;
    startPlay();
  }

  function startPlay() {
    notesMode = false;
    $('#paused').hidden = true;
    buildBoard();
    show('play');
    render();
    save();
    focusCell();
  }

  function save() { if (game) store.set('save', game); }

  /* ================= Cronômetro ================= */
  let tick = null, lastT = 0;
  function running() {
    return game && !game.won && current === 'play' && $('#paused').hidden && document.visibilityState === 'visible';
  }
  function syncTimer() {
    if (running()) {
      if (!tick) { lastT = performance.now(); tick = setInterval(step, 500); }
    } else pauseTimer();
  }
  function step() {
    const now = performance.now();
    game.elapsed += now - lastT; lastT = now;
    $('#timer').textContent = fmtTime(game.elapsed / 1000);
    if (Math.floor(game.elapsed / 5000) !== Math.floor((game.elapsed - 500) / 5000)) save();
  }
  function pauseTimer() {
    if (tick) { step(); clearInterval(tick); tick = null; save(); }
  }
  document.addEventListener('visibilitychange', syncTimer);
  window.addEventListener('pagehide', () => { pauseTimer(); save(); });

  function setPaused(p) {
    if (!game || game.won) return;
    $('#paused').hidden = !p;
    $('#board').style.visibility = p ? 'hidden' : '';
    syncTimer();
    if (!p) focusCell();
  }
  $('#pauseBtn').addEventListener('click', () => setPaused($('#paused').hidden));
  $('#resumePlay').addEventListener('click', () => setPaused(false));

  /* ================= Grade ================= */
  const cells = [];
  function buildBoard() {
    const board = $('#board');
    if (cells.length) return;
    for (let i = 0; i < 81; i++) {
      const c = document.createElement('button');
      c.className = `cell r${ROW(i)} c${COL(i)}`;
      c.dataset.i = i;
      c.setAttribute('role', 'gridcell');
      c.tabIndex = -1;
      cells.push(c);
      board.appendChild(c);
    }
    board.addEventListener('click', (e) => {
      const c = e.target.closest('.cell');
      if (!c) return;
      sel = +c.dataset.i;
      render();
      focusCell();
    });
    $('#pad').innerHTML = Array.from({ length: 9 }, (_, k) =>
      `<button class="key" data-n="${k + 1}" aria-label="Número ${k + 1}">${k + 1}<small></small></button>`).join('');
  }
  function focusCell() { if (cells[sel]) cells[sel].focus({ preventScroll: true }); }

  function render() {
    if (!game) return;
    const { values, puzzle, solution, notes } = game;
    const sv = values[sel];
    const counts = new Array(10).fill(0);
    values.forEach((v, i) => { if (v && v === solution[i]) counts[v]++; });

    // Casas em conflito (mesmo número repetido numa linha, coluna ou bloco).
    const clash = new Set();
    for (const unit of UNITS) {
      const seen = {};
      for (const i of unit) { const v = values[i]; if (!v) continue; (seen[v] = seen[v] || []).push(i); }
      Object.values(seen).forEach((list) => { if (list.length > 1) list.forEach((i) => clash.add(i)); });
    }
    const peers = new Set(PEERS[sel]);
    for (let i = 0; i < 81; i++) {
      const c = cells[i], v = values[i], given = puzzle[i] !== 0;
      const cls = [`cell r${ROW(i)} c${COL(i)}`];
      if (i === sel) cls.push('sel');
      else if (sv && v === sv) cls.push('same');
      else if (peers.has(i)) cls.push('peer');
      if (!given && v) cls.push(game.hinted.includes(i) ? 'hint' : 'user');
      if (!given && v && v !== solution[i]) cls.push('wrong');
      if (clash.has(i) && !given && v !== solution[i]) cls.push('clash');
      if (c.classList.contains('flash')) cls.push('flash');
      c.className = cls.join(' ');
      c.tabIndex = i === sel ? 0 : -1;

      let label = `Linha ${ROW(i) + 1}, coluna ${COL(i) + 1}: `;
      if (v) {
        c.textContent = v;
        label += `${v}${given ? ' (fixo)' : ''}${!given && v !== solution[i] ? ', errado' : ''}`;
      } else if (notes[i]) {
        let html = '<span class="notes">';
        const ds = [];
        for (let d = 1; d <= 9; d++) {
          const on = notes[i] & (1 << d);
          if (on) ds.push(d);
          html += `<i${on && d === sv ? ' class="hl"' : ''}>${on ? d : ''}</i>`;
        }
        c.innerHTML = html + '</span>';
        label += `vazio, notas ${ds.join(', ')}`;
      } else { c.textContent = ''; label += 'vazio'; }
      c.setAttribute('aria-label', label);
    }

    document.querySelectorAll('.key').forEach((k) => {
      const n = +k.dataset.n, left = 9 - counts[n];
      k.classList.toggle('done', left === 0);
      k.querySelector('small').textContent = left > 0 ? left : '';
    });
    $('#infoDiff').textContent = game.daily ? `Do dia · ${DIFFS[game.diff].label}` : DIFFS[game.diff].label;
    $('#infoErrors').textContent = game.errors;
    $('#infoHints').textContent = game.hints;
    $('#timer').textContent = fmtTime(game.elapsed / 1000);
    $('#notesBtn').setAttribute('aria-pressed', String(notesMode));
    $('#notesState').textContent = notesMode ? 'lig.' : 'desl.';
    $('#pad').classList.toggle('notes-on', notesMode);
    $('#undoBtn').disabled = history.length === 0;
  }

  /* ================= Jogadas ================= */
  // Cada jogada guarda o estado anterior das casas que mudou, para poder desfazer.
  function commit(changes, extra = {}) {
    history.push({ changes, ...extra });
    if (history.length > 300) history.shift();
  }
  const snap = (i) => ({ i, v: game.values[i], n: game.notes[i] });

  function place(n) {
    if (!game || game.won || game.puzzle[sel]) return;
    if (notesMode) { toggleNote(n); return; }
    const i = sel;
    if (game.values[i] === n) { erase(); return; }
    const changes = [snap(i)];
    game.values[i] = n;
    game.notes[i] = 0;
    for (const p of PEERS[i]) {
      if (game.notes[p] & (1 << n)) { changes.push(snap(p)); game.notes[p] &= ~(1 << n); }
    }
    const wrong = n !== game.solution[i];
    if (wrong) game.errors++;
    commit(changes, { error: wrong });
    afterMove(i);
  }

  function toggleNote(n) {
    const i = sel;
    if (game.values[i]) return;
    commit([snap(i)]);
    game.notes[i] ^= 1 << n;
    afterMove(i);
  }

  function erase() {
    if (!game || game.won || game.puzzle[sel]) return;
    const i = sel;
    if (!game.values[i] && !game.notes[i]) return;
    commit([snap(i)]);
    game.values[i] = 0;
    game.notes[i] = 0;
    game.hinted = game.hinted.filter((h) => h !== i);
    afterMove(i);
  }

  function undo() {
    const h = history.pop();
    if (!h || !game || game.won) return;
    for (const c of h.changes) { game.values[c.i] = c.v; game.notes[c.i] = c.n; }
    if (h.hint) { game.hinted = game.hinted.filter((x) => x !== h.hint.i); }
    sel = h.changes[0].i;
    afterMove(null);
  }

  function hint() {
    if (!game || game.won) return;
    let i = sel;
    if (game.puzzle[i] || game.values[i] === game.solution[i]) {
      const empties = [];
      for (let k = 0; k < 81; k++) if (!game.puzzle[k] && game.values[k] !== game.solution[k]) empties.push(k);
      if (!empties.length) return;
      // Prefere a casa com menos candidatos: a dica fica mais útil para destravar.
      empties.sort((a, b) => candidates(a) - candidates(b));
      i = empties[0];
    }
    sel = i;
    const n = game.solution[i];
    const changes = [snap(i)];
    game.values[i] = n;
    game.notes[i] = 0;
    for (const p of PEERS[i]) {
      if (game.notes[p] & (1 << n)) { changes.push(snap(p)); game.notes[p] &= ~(1 << n); }
    }
    game.hints++;
    game.hinted.push(i);
    commit(changes, { hint: { i } });
    afterMove(i);
  }
  function candidates(i) {
    let used = 0;
    for (const p of PEERS[i]) if (game.values[p]) used |= 1 << game.values[p];
    let n = 0; for (let d = 1; d <= 9; d++) if (!(used & (1 << d))) n++;
    return n;
  }

  function afterMove(i) {
    if (i != null && game.values[i] === game.solution[i]) flashCompleted(i);
    render();
    save();
    if (game.values.every((v, k) => v === game.solution[k])) win();
  }

  function flashCompleted(i) {
    const done = UNITS_OF[i].map((u) => UNITS[u]).filter((unit) => unit.every((k) => game.values[k] === game.solution[k]));
    const list = new Set(done.flat());
    list.forEach((k) => {
      const c = cells[k];
      c.classList.remove('flash'); void c.offsetWidth; c.classList.add('flash');
      setTimeout(() => c.classList.remove('flash'), 650);
    });
  }

  /* ================= Vitória ================= */
  function win() {
    pauseTimer();
    game.won = true;
    const time = Math.round(game.elapsed / 1000);
    const result = { time, errors: game.errors, hints: game.hints };
    let prevBest = null;
    if (game.daily) {
      if (!store.get('daily:' + game.daily)) store.set('daily:' + game.daily, result);
    } else {
      prevBest = store.get('best:' + game.diff);
      if (!game.hints && (!prevBest || time < prevBest)) store.set('best:' + game.diff, time);
      store.set('wins:' + game.diff, store.get('wins:' + game.diff, 0) + 1);
    }
    store.del('save');
    setTimeout(() => showWin({ daily: game.daily, diff: game.diff, ...result }, true, prevBest), 700);
  }

  function showWin(r, fresh, prevBest = null) {
    show('win');
    $('#winEyebrow').textContent = r.daily
      ? `Sudoku do dia · ${r.daily.split('-').reverse().join('/')}`
      : DIFFS[r.diff].label;
    $('#winTime').textContent = fmtTime(r.time);
    let sub = '';
    if (r.daily) sub = fresh ? 'A mesma grade para todo mundo hoje. Compare o tempo com os amigos!' : 'Você já resolveu o de hoje. Um novo aparece à meia-noite.';
    else if (r.hints) sub = 'Partidas com dica não contam para o recorde.';
    else if (!prevBest) sub = 'Primeiro recorde nesta dificuldade!';
    else if (r.time < prevBest) sub = `Novo recorde! Antes: ${fmtTime(prevBest)}`;
    else sub = `Seu recorde: ${fmtTime(prevBest)}`;
    $('#winSub').textContent = sub;
    $('#winStats').innerHTML = `
      <div>Tempo<b>${fmtTime(r.time)}</b></div>
      <div>Erros<b>${r.errors}</b></div>
      <div>Dicas<b>${r.hints}</b></div>`;
    $('#winShare').onclick = () => share(
      `Sudoku${r.daily ? ` do dia ${todayLabel()}` : ` · ${DIFFS[r.diff].label}`}\n⏱️ ${fmtTime(r.time)} · ${r.errors} ${r.errors === 1 ? 'erro' : 'erros'} · ${r.hints} ${r.hints === 1 ? 'dica' : 'dicas'}\n${location.origin}${location.pathname}`,
    );
    $('#winNew').onclick = () => newGame(r.daily ? DAILY_DIFF : r.diff);
    $('#winNew').textContent = r.daily ? `Novo jogo (${DIFFS[DAILY_DIFF].label})` : 'Novo jogo';
  }
  $('#winHome').addEventListener('click', renderHome);

  /* ================= Controles ================= */
  $('#pad').addEventListener('click', (e) => {
    const k = e.target.closest('.key');
    if (!k || !$('#paused').hidden) return;
    place(+k.dataset.n);
    focusCell();
  });
  $('#eraseBtn').addEventListener('click', () => { erase(); focusCell(); });
  $('#undoBtn').addEventListener('click', () => { undo(); focusCell(); });
  $('#hintBtn').addEventListener('click', () => { hint(); focusCell(); });
  $('#notesBtn').addEventListener('click', () => { notesMode = !notesMode; render(); focusCell(); });

  document.addEventListener('keydown', (e) => {
    if (current !== 'play' || !game || game.won) return;
    if (e.target.closest && e.target.closest('summary, a')) return;
    if (!$('#paused').hidden) { if (e.key === 'Enter' || e.key === ' ' || e.key.toLowerCase() === 'p') { e.preventDefault(); setPaused(false); } return; }
    const k = e.key;
    const moves = { ArrowUp: -9, ArrowDown: 9, ArrowLeft: -1, ArrowRight: 1 };
    if (moves[k]) {
      e.preventDefault();
      const r = ROW(sel), c = COL(sel);
      if (k === 'ArrowUp') sel = ((r + 8) % 9) * 9 + c;
      if (k === 'ArrowDown') sel = ((r + 1) % 9) * 9 + c;
      if (k === 'ArrowLeft') sel = r * 9 + ((c + 8) % 9);
      if (k === 'ArrowRight') sel = r * 9 + ((c + 1) % 9);
      render(); focusCell();
      return;
    }
    const m = /^(?:Digit|Numpad)([1-9])$/.exec(e.code);
    if (m && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      const n = +m[1];
      if (e.shiftKey && !game.puzzle[sel]) toggleNote(n); else place(n);
      return;
    }
    if (k === 'Backspace' || k === 'Delete' || k === '0') { e.preventDefault(); erase(); return; }
    if ((e.ctrlKey || e.metaKey) && k.toLowerCase() === 'z') { e.preventDefault(); undo(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const low = k.toLowerCase();
    if (low === 'n') { notesMode = !notesMode; render(); }
    else if (low === 'z' || low === 'u') undo();
    else if (low === 'h') hint();
    else if (low === 'p') setPaused(true);
  });

  /* ================= Início ================= */
  renderHome();
  const mode = new URLSearchParams(location.search).get('mode');
  if (mode === 'diario') $('#dailyBtn').click();
  else if (mode === 'continuar' && store.get('save')) resume(store.get('save'));
  else if (DIFFS[mode]) confirmReplace(() => newGame(mode));
})();
