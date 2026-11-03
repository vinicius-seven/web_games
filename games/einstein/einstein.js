(() => {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const E = window.EinsteinEngine;
  const { CATS, OPTIONAL, sentence } = window.EinsteinDados;
  const SIZES = {
    facil: { label: 'Fácil', n: 3, K: 3, level: 'facil' },
    medio: { label: 'Médio', n: 4, K: 4, level: 'medio' },
    dificil: { label: 'Difícil', n: 5, K: 5, level: 'dificil' },
    genio: { label: 'Gênio', n: 5, K: 6, level: 'dificil' },
  };
  const DAILY = { n: 5, K: 5, level: 'medio' };
  const REL = { same: '=', not: '≠', next: '↔', left: '→', before: '…→' };

  /* ================= Utilidades ================= */
  const store = {
    get(k, d = null) {
      try { const v = localStorage.getItem('einstein:' + k); return v == null ? d : JSON.parse(v); }
      catch { return d; }
    },
    set(k, v) { try { localStorage.setItem('einstein:' + k, JSON.stringify(v)); } catch { /* sem armazenamento */ } },
    del(k) { try { localStorage.removeItem('einstein:' + k); } catch { /* sem armazenamento */ } },
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
  function shuffle(arr, rnd) {
    for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
    return arr;
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
  function toast(msg, ms = 2800) {
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
        <strong>${s.label}<small>${s.n} casas · ${s.K} categorias</small></strong>
        <span>${best ? `Melhor tempo ${fmtTime(best)}` : 'Sem recorde ainda'}${wins ? ` · ${plural(wins, 'enigma', 'enigmas')}` : ''}</span>
      </button>`;
    }).join('');
    const daily = store.get('daily:' + todayKey());
    $('#dailyText').textContent = daily
      ? `Resolvido hoje em ${fmtTime(daily.time)}${daily.hints ? ` com ${plural(daily.hints, 'dica', 'dicas')}` : ''}. Um novo enigma chega à meia-noite.`
      : `${dateLabel(todayKey())} · ${DAILY.n} casas, ${DAILY.K} categorias. O mesmo enigma para todo mundo hoje.`;
    $('#dailyBtn').textContent = daily ? 'Ver resultado' : 'Jogar o de hoje';
    const sv = store.get('save');
    if (sv && !sv.won) {
      $('#resumeTitle').textContent = sv.daily ? `Enigma do dia (${dateLabel(sv.daily)})` : `${SIZES[sv.size].label} · ${sv.n} casas`;
      $('#resumeInfo').textContent = `${fmtTime(sv.elapsed / 1000)} · ${solvedCount(sv)} de ${sv.n * sv.K} quadros`;
      $('#resumeBtn').hidden = false;
    } else $('#resumeBtn').hidden = true;
    show('home');
  }
  const solvedCount = (g) => g.cand.reduce((s, row) => s + row.filter((m) => E.bits(m) === 1).length, 0);

  $('#sizes').addEventListener('click', (e) => {
    const b = e.target.closest('[data-size]');
    if (b) confirmReplace(() => newGame(b.dataset.size));
  });
  $('#dailyBtn').addEventListener('click', () => {
    const done = store.get('daily:' + todayKey());
    if (done) { showWin(done, false); return; }
    const sv = store.get('save');
    if (sv && !sv.won && sv.daily === todayKey()) { resume(sv); return; }
    confirmReplace(() => newGame('dificil', todayKey()));
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
    const busy = sv && !sv.won && sv.history && sv.history.length;
    if (!busy || Date.now() - pendingReplace < 4000) { pendingReplace = 0; fn(); return; }
    pendingReplace = Date.now();
    toast('Você tem um enigma em andamento. Toque de novo para começar outro.');
  }

  /* ================= Estado ================= */
  let game = null;
  let chooseMode = store.get('chooseMode', false);

  function newGame(size, daily = null) {
    const spec = daily ? DAILY : SIZES[size];
    const rnd = daily ? mulberry32(hashStr('jogateca-einstein-' + daily)) : Math.random;
    const cats = ['cor', 'morador', ...shuffle(OPTIONAL.slice(), rnd).slice(0, spec.K - 2)];
    const vals = cats.map((c) => shuffle([...CATS[c].values.keys()], rnd).slice(0, spec.n));
    const p = E.generate(spec.n, spec.K, rnd, spec.level);
    game = {
      size, n: spec.n, K: spec.K, cats, vals, sol: p.sol, clues: p.clues,
      chosen: blankChosen(spec.n, spec.K), crossed: blankCrossed(spec.n, spec.K),
      struck: [], history: [], daily, elapsed: 0, hints: 0, won: false,
    };
    derive();
    startPlay();
  }
  function resume(sv) {
    game = sv;
    // Partidas salvas antes desta versão só tinham a grade pronta: vira escolhas + riscos.
    if (!game.chosen) {
      const full = (1 << game.n) - 1;
      game.chosen = game.cand.map((row) => row.map((m) => (E.bits(m) === 1 ? E.low(m) : -1)));
      game.crossed = game.cand.map((row) => row.map((m) => (E.bits(m) === 1 ? 0 : full & ~m)));
      game.history = [];
    }
    game.history = game.history || [];
    derive();
    startPlay();
  }
  const blankChosen = (n, K) => Array.from({ length: K }, () => new Array(n).fill(-1));
  const blankCrossed = (n, K) => Array.from({ length: K }, () => new Array(n).fill(0));

  /* A grade que aparece (game.cand) é calculada a partir do que o jogador fez:
     - chosen[c][h]: valor escolhido na casa (ou -1);
     - crossed[c][h]: valores que o jogador riscou na casa.
     Um valor escolhido (ou que sobrou sozinho numa casa) sai das outras casas da linha.
     Assim, reabrir uma casa devolve o valor às outras e mantém os riscos que já existiam. */
  function derive() {
    const { n, K, chosen, crossed } = game;
    const full = (1 << n) - 1;
    const cand = [];
    for (let c = 0; c < K; c++) {
      const taken = chosen[c].reduce((m, v) => (v >= 0 ? m | (1 << v) : m), 0);
      cand.push(chosen[c].map((v, h) => (v >= 0 ? 1 << v : full & ~crossed[c][h] & ~taken)));
    }
    // valores que sobraram sozinhos numa casa saem das outras (sem esvaziar nenhuma)
    let changed = true;
    while (changed) {
      changed = false;
      for (let c = 0; c < K; c++) {
        for (let h = 0; h < n; h++) {
          const m = cand[c][h];
          if (E.bits(m) !== 1) continue;
          for (let o = 0; o < n; o++) {
            if (o !== h && (cand[c][o] & m) && E.bits(cand[c][o]) > 1) { cand[c][o] &= ~m; changed = true; }
          }
        }
      }
    }
    game.cand = cand;
  }
  function startPlay() {
    $('#paused').hidden = true;
    $('#grid').style.visibility = '';
    renderClues();
    show('play');
    render();
    save();
  }
  const save = () => {
    if (!game || game.won) return;
    if (game.history.length > 200) game.history = game.history.slice(-200);
    store.set('save', game); // a grade (cand) também vai junto, para o menu mostrar o progresso
  };

  const item = (c, v) => {
    const cat = CATS[game.cats[c]];
    return { cat, v: cat.values[game.vals[c][v]] };
  };
  const icon = (c, v) => {
    const { cat, v: val } = item(c, v);
    return cat.kind === 'cor' ? `<span class="sw" style="--sw:${val.color}"></span>` : val.emoji;
  };
  const label = (c, v) => item(c, v).v.id;
  const say = (q) => sentence(q, ([c, v]) => item(c, v), game.n);

  /* ================= Cronômetro ================= */
  let tick = null, lastT = 0, sinceSave = 0;
  const running = () => game && !game.won && current === 'play' && $('#paused').hidden && document.visibilityState === 'visible';
  function syncTimer() {
    if (running()) { if (!tick) { lastT = performance.now(); tick = setInterval(stepTime, 500); } }
    else pauseTimer();
  }
  function stepTime() {
    const now = performance.now();
    game.elapsed += now - lastT; sinceSave += now - lastT; lastT = now;
    $('#timer').textContent = fmtTime(game.elapsed / 1000);
    if (sinceSave > 5000) { sinceSave = 0; save(); }
  }
  function pauseTimer() { if (tick) { stepTime(); clearInterval(tick); tick = null; save(); } }
  document.addEventListener('visibilitychange', syncTimer);
  window.addEventListener('pagehide', () => { pauseTimer(); save(); });
  function setPaused(p) {
    if (!game || game.won) return;
    $('#paused').hidden = !p;
    $('#grid').style.visibility = p ? 'hidden' : '';
    syncTimer();
  }
  $('#pauseBtn').addEventListener('click', () => setPaused($('#paused').hidden));
  $('#resumePlay').addEventListener('click', () => setPaused(false));

  /* ================= Grade ================= */
  function conflicts() {
    const bad = new Set();
    for (let c = 0; c < game.K; c++) {
      const seen = {};
      for (let h = 0; h < game.n; h++) {
        const m = game.cand[c][h];
        if (m === 0) { bad.add(`${c}:${h}`); continue; }
        if (E.bits(m) !== 1) continue;
        if (seen[m] != null) { bad.add(`${c}:${h}`); bad.add(`${c}:${seen[m]}`); }
        else seen[m] = h;
      }
    }
    return bad;
  }

  function render(flash = []) {
    const { n, K, cand } = game;
    const grid = $('#grid');
    grid.style.gridTemplateColumns = `minmax(30px, .5fr) repeat(${n}, minmax(0, 1fr))`;
    const colorRow = game.cats.indexOf('cor');
    let html = '<span class="corner"></span>';
    for (let h = 0; h < n; h++) {
      const m = cand[colorRow][h];
      const col = E.bits(m) === 1 ? item(colorRow, E.low(m)).v.color : null;
      html += `<div class="house"><i class="${col ? '' : 'unk'}" style="${col ? `--hc:${col}` : ''}"></i>${h + 1}</div>`;
    }
    const bad = conflicts();
    const fl = new Set(flash.map(([c, h]) => `${c}:${h}`));
    for (let c = 0; c < K; c++) {
      const cat = CATS[game.cats[c]];
      html += `<div class="rowlab" title="${cat.name}" aria-label="${cat.name}">${cat.icon}</div>`;
      for (let h = 0; h < n; h++) {
        const m = cand[c][h];
        const cls = `${fl.has(`${c}:${h}`) ? ' flash' : ''}${bad.has(`${c}:${h}`) ? ' bad' : ''}`;
        if (E.bits(m) === 1) {
          const v = E.low(m);
          html += `<button class="cell solved${cls}" data-c="${c}" data-h="${h}" title="Toque para reabrir" aria-label="${cat.name}, casa ${h + 1}: ${label(c, v)}. Toque para reabrir"${bad.has(`${c}:${h}`) ? ' style="box-shadow: inset 0 0 0 2px var(--red)"' : ''}><span class="big">${icon(c, v)}</span><span class="nm">${label(c, v)}</span></button>`;
        } else {
          html += `<div class="cell${cls}" role="gridcell" aria-label="${cat.name}, casa ${h + 1}">` +
            [...Array(n).keys()].map((v) => `<button class="c${m & (1 << v) ? '' : ' x'}" data-c="${c}" data-h="${h}" data-v="${v}" aria-label="${label(c, v)}${m & (1 << v) ? '' : ' (riscado)'}">${icon(c, v)}</button>`).join('') +
            '</div>';
        }
      }
    }
    grid.innerHTML = html;
    const done = solvedCount(game);
    $('#infoTitle').textContent = game.daily ? `Do dia · ${n} casas` : `${SIZES[game.size].label} · ${n} casas`;
    $('#infoDone').textContent = `${done}/${n * K}`;
    $('#timer').textContent = fmtTime(game.elapsed / 1000);
    const st = $('#status');
    let msg = '', isBad = false;
    if (bad.size) { msg = 'Um mesmo valor ficou em duas casas da mesma linha (ou uma casa ficou sem opções).'; isBad = true; }
    else if (done === n * K) {
      if (isWin()) msg = 'Resolvido!';
      else { msg = 'A grade está cheia, mas algo não bate. A dica aponta o erro.'; isBad = true; }
    } else msg = `${chooseMode ? 'Toque para escolher; segure para riscar.' : 'Toque para riscar; segure para escolher.'} Toque numa casa pronta para reabrir.`;
    st.textContent = msg; st.classList.toggle('bad', isBad);
    $('#modeBtn').setAttribute('aria-pressed', String(chooseMode));
    $('#modeState').textContent = chooseMode ? 'escolher' : 'riscar';
    $('#modeIco').textContent = chooseMode ? '✓' : '✕';
    $('#undoBtn').disabled = !game.history.length;
    if (done === n * K && isWin()) win();
  }
  const isWin = () => game.cand.every((row, c) => row.every((m, h) => m === 1 << game.sol[c][h]));

  function renderClues() {
    $('#clues').innerHTML = game.clues.map((q, i) => {
      const pic = q.t === 'pos'
        ? `${icon(q.a[0], q.a[1])}<span class="rel">casa ${q.k + 1}</span>`
        : `${icon(q.a[0], q.a[1])}<span class="rel">${REL[q.t]}</span>${icon(q.b[0], q.b[1])}`;
      return `<li data-i="${i}" class="${game.struck.includes(i) ? 'done' : ''}"><span class="tx">${say(q)}</span><span class="pic" aria-hidden="true">${pic}</span></li>`;
    }).join('');
    $('#cluesCount').textContent = `${game.clues.length}`;
  }
  $('#clues').addEventListener('click', (e) => {
    const li = e.target.closest('li');
    if (!li || !game) return;
    const i = +li.dataset.i;
    const k = game.struck.indexOf(i);
    if (k >= 0) game.struck.splice(k, 1); else game.struck.push(i);
    li.classList.toggle('done', k < 0);
    li.classList.remove('hl');
    save();
  });

  /* ================= Jogadas ================= */
  function snapshot() { game.history.push({ chosen: game.chosen.map((r) => r.slice()), crossed: game.crossed.map((r) => r.slice()) }); }
  const after = (cells) => { derive(); render(cells); save(); };
  function toggle(c, h, v) {
    const m = game.cand[c][h], b = 1 << v;
    if ((m & b) && E.bits(m) === 1) return; // a casa nunca fica vazia
    if (!(m & b) && !(game.crossed[c][h] & b)) {
      // não foi riscado: saiu porque já está escolhido (ou sobrou sozinho) em outra casa da linha
      const o = game.cand[c].findIndex((x, k) => k !== h && x === b);
      toast(`${label(c, v)} já está na casa ${o + 1}. Toque nela para reabrir.`);
      return;
    }
    snapshot();
    game.crossed[c][h] ^= b;
    after([[c, h]]);
  }
  function choose(c, h, v) {
    if (game.chosen[c][h] === v) return;
    snapshot();
    game.chosen[c][h] = v;
    // escolher um valor que estava escolhido em outra casa da linha tira de lá
    game.chosen[c].forEach((x, k) => { if (k !== h && x === v) game.chosen[c][k] = -1; });
    after([[c, h]]);
  }
  // Reabre uma casa pronta: tira a escolha (ou, se ela fechou só por riscos, desfaz esses riscos).
  function reopen(c, h) {
    snapshot();
    if (game.chosen[c][h] >= 0) game.chosen[c][h] = -1;
    else game.crossed[c][h] = 0;
    after([[c, h]]);
  }

  // Toque curto = ação do modo; tocar e segurar = a outra ação.
  const grid = $('#grid');
  let press = null;
  grid.addEventListener('pointerdown', (e) => {
    const b = e.target.closest('.c');
    if (!b || !game || game.won) return;
    if (e.button === 2) return;
    const c = +b.dataset.c, h = +b.dataset.h, v = +b.dataset.v;
    press = { c, h, v, long: false, x: e.clientX, y: e.clientY };
    press.timer = setTimeout(() => {
      if (!press) return;
      press.long = true;
      const eliminated = !(game.cand[c][h] & (1 << v));
      if (chooseMode || eliminated) toggle(c, h, v); else choose(c, h, v);
      if (navigator.vibrate) try { navigator.vibrate(15); } catch { /* sem vibração */ }
    }, 430);
  });
  grid.addEventListener('pointermove', (e) => {
    if (press && Math.hypot(e.clientX - press.x, e.clientY - press.y) > 12) { clearTimeout(press.timer); press = null; }
  });
  grid.addEventListener('pointerup', () => {
    if (!press) return;
    clearTimeout(press.timer);
    const { c, h, v, long } = press;
    press = null;
    if (long) return;
    const eliminated = !(game.cand[c][h] & (1 << v));
    if (chooseMode && !eliminated) choose(c, h, v); else toggle(c, h, v);
  });
  grid.addEventListener('pointercancel', () => { if (press) clearTimeout(press.timer); press = null; });
  grid.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const b = e.target.closest('.c');
    if (b && game && !game.won && !press) toggle(+b.dataset.c, +b.dataset.h, +b.dataset.v);
  });
  grid.addEventListener('click', (e) => {
    const cell = e.target.closest('.cell.solved');
    if (cell && game && !game.won) reopen(+cell.dataset.c, +cell.dataset.h);
  });

  function undo() {
    const h = game.history.pop();
    if (!h) return;
    game.chosen = h.chosen; game.crossed = h.crossed;
    after();
  }
  $('#undoBtn').addEventListener('click', undo);
  $('#modeBtn').addEventListener('click', () => { chooseMode = !chooseMode; store.set('chooseMode', chooseMode); render(); });
  $('#clearBtn').addEventListener('click', () => {
    if (!game || game.won || !game.history.length) return;
    snapshot();
    game.chosen = blankChosen(game.n, game.K);
    game.crossed = blankCrossed(game.n, game.K);
    game.struck = [];
    renderClues(); after();
    toast('Grade limpa. Dá para desfazer.');
  });

  // Dica: primeiro corrige um engano; senão, faz a próxima dedução e mostra de onde ela veio.
  function hint() {
    if (!game || game.won) return;
    const { n, K, sol } = game;
    // Enganos: primeiro uma escolha errada; depois o valor certo riscado.
    for (let c = 0; c < K; c++) {
      for (let h = 0; h < n; h++) {
        const v = game.chosen[c][h];
        if (v >= 0 && v !== sol[c][h]) {
          snapshot();
          game.chosen[c][h] = -1;
          game.hints++;
          after([[c, h]]);
          toast(`Engano na casa ${h + 1} (${CATS[game.cats[c]].name}): não é ${label(c, v)}. A casa foi reaberta.`, 4200);
          return;
        }
      }
    }
    for (let c = 0; c < K; c++) {
      for (let h = 0; h < n; h++) {
        const right = 1 << sol[c][h];
        if (game.crossed[c][h] & right) {
          snapshot();
          game.crossed[c][h] &= ~right;
          game.hints++;
          after([[c, h]]);
          toast(`Engano na casa ${h + 1} (${CATS[game.cats[c]].name}): ${label(c, sol[c][h])} tinha sido riscado, mas ainda é possível.`, 4200);
          return;
        }
      }
    }
    const next = E.clone(game.cand);
    const s = E.step(next, n, game.clues);
    if (!s) { toast('Nada mais a deduzir.'); return; }
    snapshot();
    if (s.kind === 'place') game.chosen[s.c][s.h] = s.v;
    else for (const [c, h, v] of s.changes) if (game.chosen[c][h] < 0) game.crossed[c][h] |= 1 << v;
    game.hints++;
    after(s.changes.map(([c, h]) => [c, h]));
    document.querySelectorAll('#clues li.hl').forEach((li) => li.classList.remove('hl'));
    if (s.kind === 'clue') {
      const li = document.querySelector(`#clues li[data-i="${s.clue}"]`);
      if (li) { li.classList.add('hl'); li.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
      const gone = [...new Set(s.changes.map(([c, , v]) => label(c, v)))];
      toast(`Pela pista ${s.clue + 1}: ${gone.join(', ')} ${gone.length > 1 ? 'saem' : 'sai'} de ${plural(new Set(s.changes.map(([c, h]) => `${c}:${h}`)).size, 'quadro', 'quadros')}.`, 4200);
    } else if (s.kind === 'place') {
      toast(`${label(s.c, s.v)} só cabe na casa ${s.h + 1}: é o único lugar que sobrou na linha ${CATS[game.cats[s.c]].name}.`, 4200);
    } else {
      toast(`A casa ${s.h + 1} já é ${label(s.c, s.v)}, então ${label(s.c, s.v)} sai das outras casas.`, 4200);
    }
  }
  $('#hintBtn').addEventListener('click', hint);

  document.addEventListener('keydown', (e) => {
    if (current !== 'play' || !game || game.won) return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (k === 'z' || k === 'u') undo();
    else if (k === 'h') hint();
    else if (k === 'm') $('#modeBtn').click();
    else if (k === 'p') setPaused($('#paused').hidden);
  });

  /* ================= Vitória ================= */
  function win() {
    if (game.won) return;
    pauseTimer();
    game.won = true;
    const time = Math.round(game.elapsed / 1000);
    const colorRow = game.cats.indexOf('cor'), whoRow = game.cats.indexOf('morador');
    const street = [...Array(game.n).keys()].map((h) => ({
      color: item(colorRow, game.sol[colorRow][h]).v.color,
      who: item(whoRow, game.sol[whoRow][h]).v,
      extra: game.cats.map((id, c) => (id === 'cor' || id === 'morador' ? '' : item(c, game.sol[c][h]).v.emoji)).join(''),
    }));
    const r = { time, hints: game.hints, n: game.n, size: game.size, daily: game.daily, street };
    let prevBest = null;
    if (game.daily) { if (!store.get('daily:' + game.daily)) store.set('daily:' + game.daily, r); }
    else {
      prevBest = store.get('best:' + game.size);
      if (!game.hints && (!prevBest || time < prevBest)) store.set('best:' + game.size, time);
      store.set('wins:' + game.size, store.get('wins:' + game.size, 0) + 1);
    }
    store.del('save');
    setTimeout(() => showWin(r, true, prevBest), 900);
  }
  function showWin(r, fresh, prevBest = null) {
    show('win');
    $('#winEyebrow').textContent = r.daily ? `Enigma do dia · ${dateLabel(r.daily)}` : `${SIZES[r.size].label} · ${r.n} casas`;
    $('#winStreet').innerHTML = (r.street || []).map((s) => `<div class="wh"><i style="--hc:${s.color}"></i><span>${s.who.emoji}</span><b>${s.who.id}</b><span>${s.extra}</span></div>`).join('');
    $('#winTime').textContent = fmtTime(r.time);
    let sub;
    if (r.daily) sub = fresh ? 'O mesmo enigma para todo mundo hoje. Compare o tempo!' : 'Você já resolveu o de hoje. Um novo chega à meia-noite.';
    else if (r.hints) sub = `Com ${plural(r.hints, 'dica', 'dicas')}. Partidas com dica não contam para o recorde.`;
    else if (!prevBest) sub = 'Primeiro recorde neste tamanho!';
    else if (r.time < prevBest) sub = `Novo recorde! Antes: ${fmtTime(prevBest)}`;
    else sub = `Seu recorde: ${fmtTime(prevBest)}`;
    $('#winSub').textContent = sub;
    $('#winShare').onclick = () => share(`Enigma de Einstein${r.daily ? ` do dia ${dateLabel(r.daily)}` : ` · ${SIZES[r.size].label}`}\n🕵️ ${fmtTime(r.time)}${r.hints ? ` · ${plural(r.hints, 'dica', 'dicas')}` : ' · sem dicas'}\n${location.origin}${location.pathname}`);
    $('#winNew').onclick = () => newGame(r.daily ? 'dificil' : r.size);
  }
  $('#winHome').addEventListener('click', renderHome);

  /* ================= Início ================= */
  renderHome();
  const mode = new URLSearchParams(location.search).get('mode');
  if (mode === 'diario') $('#dailyBtn').click();
  else if (mode === 'continuar' && store.get('save')) resume(store.get('save'));
  else if (SIZES[mode]) confirmReplace(() => newGame(mode));
})();
