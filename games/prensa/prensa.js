(() => {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const { RESPOSTAS, ACEITAS } = window.PrensaPalavras;
  const MODES = {
    um: { n: 1, tries: 6, label: '1 palavra' },
    dois: { n: 2, tries: 7, label: '2 palavras' },
    quatro: { n: 4, tries: 9, label: '4 palavras' },
    livre: { n: 1, tries: 6, label: 'Livre' },
  };
  const LEN = 5;
  const KEYS = ['qwertyuiop', 'asdfghjkl⌫', 'zxcvbnm↵'];

  /* ================= Utilidades ================= */
  const store = {
    get(k, d = null) {
      try { const v = localStorage.getItem('prensa:' + k); return v == null ? d : JSON.parse(v); }
      catch { return d; }
    },
    set(k, v) { try { localStorage.setItem('prensa:' + k, JSON.stringify(v)); } catch { /* sem armazenamento */ } },
  };
  // Sem acento e sem cedilha: é assim que as letras são comparadas.
  const norm = (w) => w.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const DISPLAY = new Map(ACEITAS.map((w) => [norm(w), w]));
  const show = (w) => DISPLAY.get(w) || w;

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
  function shuffled(arr, rnd) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  // Número do dia (o #1 foi 1º de janeiro de 2026), pela data local.
  function dayNumber() {
    const d = new Date();
    return Math.round((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(2026, 0, 1)) / 86400000) + 1;
  }
  const ORDER = {};
  function dailyAnswers(mode, day) {
    if (!ORDER[mode]) ORDER[mode] = shuffled(RESPOSTAS.map(norm), mulberry32(hashStr('jogateca-prensa-' + mode)));
    const o = ORDER[mode], k = MODES[mode].n;
    return Array.from({ length: k }, (_, j) => o[(((day - 1) * k + j) % o.length + o.length) % o.length]);
  }
  function randomAnswers(k) {
    return shuffled(RESPOSTAS.map(norm), Math.random).slice(0, k);
  }

  // Cores de uma tentativa: 'ok' (lugar certo), 'near' (está na palavra), 'miss' (não está). Trata letras repetidas.
  function score(guess, answer) {
    const res = new Array(LEN).fill('miss');
    const left = {};
    for (let i = 0; i < LEN; i++) {
      if (guess[i] === answer[i]) res[i] = 'ok';
      else left[answer[i]] = (left[answer[i]] || 0) + 1;
    }
    for (let i = 0; i < LEN; i++) {
      if (res[i] !== 'ok' && left[guess[i]] > 0) { res[i] = 'near'; left[guess[i]]--; }
    }
    return res;
  }

  /* ================= Estado ================= */
  let mode = 'um';
  let st = null; // { mode, day, answers, guesses, solvedAt, done, won, counted }
  let typed = new Array(LEN).fill('');
  let cursor = 0;
  let busy = false;
  const stateKey = (m, day) => (m === 'livre' ? 'state:livre' : `state:${m}:${day}`);

  function load(m) {
    mode = m;
    const day = dayNumber();
    const saved = store.get(stateKey(m, day));
    if (saved && (m !== 'livre' || !saved.done)) st = saved;
    else {
      const answers = m === 'livre' ? randomAnswers(1) : dailyAnswers(m, day);
      st = { mode: m, day, answers, guesses: [], solvedAt: answers.map(() => -1), done: false, won: false, counted: false };
      save();
    }
    typed = new Array(LEN).fill('');
    cursor = 0;
    document.querySelectorAll('.modes button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.mode === m)));
    store.set('mode', m);
    build();
    render();
  }
  const save = () => store.set(stateKey(st.mode, st.day), st);

  /* ================= Desenho ================= */
  const boardsEl = $('#boards');
  const kb = $('#keyboard');
  function sizeTiles() {
    const { n, tries } = MODES[mode];
    const cols = n === 1 ? 1 : 2, brows = n === 4 ? 2 : 1;
    const W = boardsEl.clientWidth, H = boardsEl.clientHeight;
    const gapGuess = n === 4 ? 3 : 5;
    const tsW = (W - (cols - 1) * 14 - cols * 4 * gapGuess) / (cols * LEN);
    const tsH = (H - (brows - 1) * 10 - brows * (tries - 1) * gapGuess) / (brows * tries);
    const ts = Math.max(18, Math.floor(Math.min(tsW, tsH, n === 1 ? 64 : 52)));
    boardsEl.style.setProperty('--ts', ts + 'px');
    boardsEl.style.setProperty('--gap', Math.max(3, Math.round(ts * 0.09)) + 'px');
  }
  function build() {
    const { n, tries } = MODES[mode];
    boardsEl.className = `boards n${n}`;
    boardsEl.innerHTML = Array.from({ length: n }, (_, b) => `
      <div class="board" data-b="${b}" style="--rows:${tries}" aria-label="Palavra ${b + 1}">
        ${Array.from({ length: tries }, (__, r) => `<div class="row" data-r="${r}">${Array.from({ length: LEN }, (___, c) => `<div class="tile" data-c="${c}"></div>`).join('')}</div>`).join('')}
      </div>`).join('');
    if (!kb.children.length) buildKeyboard();
    sizeTiles();
    requestAnimationFrame(sizeTiles); // de novo depois do layout final (fontes, barra do navegador)
  }

  function render(flipRow = -1) {
    const { tries } = MODES[mode];
    st.answers.forEach((answer, b) => {
      const board = boardsEl.children[b];
      const solvedAt = st.solvedAt[b];
      board.classList.toggle('solved', solvedAt >= 0);
      for (let r = 0; r < tries; r++) {
        const row = board.children[r];
        const evaluated = r < st.guesses.length && (solvedAt < 0 || r <= solvedAt);
        const current = !st.done && solvedAt < 0 && r === st.guesses.length;
        row.className = 'row' + (current ? ' current' : '') + (solvedAt >= 0 && r > solvedAt ? ' future' : '');
        const guess = evaluated ? st.guesses[r] : null;
        const colors = guess ? score(guess, answer) : null;
        const shown = guess ? [...show(guess)] : null;
        for (let c = 0; c < LEN; c++) {
          const t = row.children[c];
          let cls = 'tile', txt = '';
          if (guess) { cls += ' ' + colors[c]; txt = shown[c]; if (r === flipRow) { cls += ' flip'; t.style.setProperty('--d', `${c * 180}ms`); } }
          else if (current) {
            txt = typed[c];
            if (txt) cls += ' typed';
            if (c === cursor) cls += ' cursor';
          }
          if (t.className !== cls) t.className = cls;
          if (t.textContent !== txt) t.textContent = txt;
        }
        row.setAttribute('aria-label', guess ? `${show(guess)}: ${colors.map((x) => ({ ok: 'certa', near: 'em outro lugar', miss: 'não tem' }[x])).join(', ')}` : '');
      }
    });
    paintKeys();
  }

  /* ================= Teclado ================= */
  function buildKeyboard() {
    kb.innerHTML = KEYS.map((row) => `<div class="krow">${[...row].map((k) => {
      if (k === '⌫') return '<button class="key wide" data-k="Backspace" aria-label="Apagar"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M22 3H7c-.7 0-1.2.3-1.6.9L0 12l5.4 8.1c.4.6.9.9 1.6.9h15a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm-3 12.6L17.6 17 14 13.4 10.4 17 9 15.6l3.6-3.6L9 8.4 10.4 7 14 10.6 17.6 7 19 8.4 15.4 12l3.6 3.6z"/></svg></button>';
      if (k === '↵') return '<button class="key wide" data-k="Enter">ENTER</button>';
      return `<button class="key" data-k="${k}">${k}</button>`;
    }).join('')}</div>`).join('');
  }
  // Para cada palavra, a melhor informação de cada letra; com várias palavras, a tecla é dividida em partes.
  function paintKeys() {
    const rank = { miss: 1, near: 2, ok: 3 };
    const per = st.answers.map((answer, b) => {
      const m = {};
      st.guesses.forEach((g, r) => {
        if (st.solvedAt[b] >= 0 && r > st.solvedAt[b]) return;
        score(g, answer).forEach((s, i) => { if (!m[g[i]] || rank[s] > rank[m[g[i]]]) m[g[i]] = s; });
      });
      return m;
    });
    const css = getComputedStyle(document.documentElement);
    const color = { ok: css.getPropertyValue('--ok').trim(), near: css.getPropertyValue('--near').trim(), miss: '#3a312a', none: '#8a7259' };
    kb.querySelectorAll('.key[data-k]').forEach((key) => {
      const k = key.dataset.k;
      if (k.length !== 1) return;
      key.className = 'key';
      key.style.background = '';
      if (st.answers.length === 1) {
        if (per[0][k]) key.classList.add(per[0][k]);
        return;
      }
      const parts = per.map((m, b) => (st.solvedAt[b] >= 0 ? 'none' : m[k] || 'none'));
      if (parts.every((p) => p === 'miss')) { key.classList.add('miss'); return; }
      if (parts.every((p) => p === 'none')) return;
      const c = parts.map((p) => color[p]);
      key.style.background = c.length === 2
        ? `linear-gradient(90deg, ${c[0]} 50%, ${c[1]} 50%)`
        : `linear-gradient(90deg, ${c[0]} 50%, ${c[1]} 50%) top / 100% 50% no-repeat, linear-gradient(90deg, ${c[2]} 50%, ${c[3]} 50%) bottom / 100% 50% no-repeat`;
    });
  }
  // As teclas da tela não pegam o foco: assim o Enter do teclado físico sempre envia a palavra.
  kb.addEventListener('mousedown', (e) => e.preventDefault());
  kb.addEventListener('click', (e) => {
    const k = e.target.closest('[data-k]');
    if (k) press(k.dataset.k);
  });
  document.addEventListener('keydown', (e) => {
    if (!$('#modal').hidden) { if (e.key === 'Escape') closeModal(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target.closest && e.target.closest('.modes, .bar') && (e.key === 'Enter' || e.key === ' ')) return;
    const k = e.key;
    if (k === 'Enter' || k === 'Backspace' || k === 'Delete' || k === 'ArrowLeft' || k === 'ArrowRight') { e.preventDefault(); press(k); return; }
    const letter = norm(k);
    if (/^[a-z]$/.test(letter) && k.length === 1) { e.preventDefault(); press(letter); }
  });
  // Tocar numa casa da linha atual leva o cursor até ela.
  boardsEl.addEventListener('click', (e) => {
    const t = e.target.closest('.row.current .tile');
    if (!t || busy || st.done) return;
    cursor = +t.dataset.c;
    render();
  });

  function press(k) {
    if (busy || !st || st.done) return;
    if (k === 'Enter') { submit(); return; }
    if (k === 'Backspace') {
      if (typed[cursor]) typed[cursor] = '';
      else if (cursor > 0) { cursor--; typed[cursor] = ''; }
    } else if (k === 'Delete') typed[cursor] = '';
    else if (k === 'ArrowLeft') cursor = Math.max(0, cursor - 1);
    else if (k === 'ArrowRight') cursor = Math.min(LEN - 1, cursor + 1);
    else if (/^[a-z]$/.test(k)) {
      typed[cursor] = k;
      // Vai para a próxima casa vazia à direita (ou fica na última).
      let next = cursor + 1;
      while (next < LEN && typed[next]) next++;
      cursor = next < LEN ? next : Math.min(LEN - 1, cursor + 1);
    }
    render();
  }

  /* ================= Jogada ================= */
  const currentRows = () => [...boardsEl.querySelectorAll('.row.current')];
  function shake() {
    currentRows().forEach((r) => { r.classList.remove('shake'); void r.offsetWidth; r.classList.add('shake'); });
  }
  function submit() {
    if (typed.some((x) => !x)) { toast('Só palavras com 5 letras'); shake(); return; }
    const word = typed.join('');
    if (!DISPLAY.has(word)) { toast('Essa palavra não está na lista'); shake(); return; }
    const { tries } = MODES[mode];
    const row = st.guesses.length;
    st.guesses.push(word);
    st.answers.forEach((a, b) => { if (st.solvedAt[b] < 0 && a === word) st.solvedAt[b] = row; });
    const allSolved = st.solvedAt.every((x) => x >= 0);
    st.done = allSolved || st.guesses.length >= tries;
    st.won = allSolved;
    typed = new Array(LEN).fill('');
    cursor = 0;
    save();
    busy = true;
    render(row);
    const revealMs = LEN * 180 + 520;
    setTimeout(() => {
      busy = false;
      if (st.done) finish();
      else render();
    }, revealMs);
  }

  function finish() {
    render();
    const { tries } = MODES[mode];
    if (!st.counted) {
      st.counted = true;
      const s = store.get('stats:' + mode, { played: 0, wins: 0, streak: 0, best: 0, dist: {}, last: null });
      s.played++;
      if (st.won) {
        const used = Math.max(...st.solvedAt) + 1;
        s.wins++;
        s.dist[used] = (s.dist[used] || 0) + 1;
        s.streak = mode === 'livre' || s.last === st.day - 1 || s.last == null ? s.streak + 1 : 1;
        s.best = Math.max(s.best, s.streak);
      } else s.streak = 0;
      if (mode !== 'livre') s.last = st.day;
      store.set('stats:' + mode, s);
      save();
    }
    if (st.won) {
      boardsEl.querySelectorAll('.board').forEach((board, b) => {
        const row = board.children[st.solvedAt[b]];
        if (row) { [...row.children].forEach((t, c) => t.style.setProperty('--d', `${c * 90}ms`)); row.classList.add('win'); }
      });
      const used = Math.max(...st.solvedAt) + 1;
      toast(['Incrível!', 'Impressionante!', 'Muito bem!', 'Ótimo!', 'Boa!', 'Ufa!'][Math.min(5, Math.floor((used - 1) * 6 / tries))]);
    } else {
      toast(st.answers.filter((a, b) => st.solvedAt[b] < 0).map((a) => show(a).toUpperCase()).join(' · '), 3200);
    }
    setTimeout(() => openEnd(), st.won ? 1400 : 2000);
  }

  /* ================= Mensagens e janelas ================= */
  function toast(msg, ms = 1600) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    $('#toasts').appendChild(t);
    setTimeout(() => t.remove(), ms);
  }
  const modal = $('#modal');
  let countdownTimer = null;
  function openModal(html) {
    $('#modalBody').innerHTML = html;
    modal.hidden = false;
    modal.querySelector('.modal-close').focus();
  }
  function closeModal() {
    modal.hidden = true;
    clearInterval(countdownTimer);
  }
  modal.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeModal(); });

  const exRow = (word, marks) => `<div class="ex">${[...word].map((ch, i) => `<div class="tile ${marks[i] || 'typed'}">${ch}</div>`).join('')}</div>`;
  function openHelp() {
    openModal(`
      <h2 id="modalTitle">Como jogar</h2>
      <p>Descubra a palavra de cinco letras. Depois de cada tentativa, a tinta mostra o quanto você chegou perto.</p>
      ${exRow('tinta', ['ok'])}
      <p><b>T</b> está na palavra e no lugar certo.</p>
      ${exRow('prato', ['', '', 'near'])}
      <p><b>A</b> está na palavra, mas em outro lugar.</p>
      ${exRow('vapor', ['', '', '', 'miss'])}
      <p><b>O</b> não está na palavra.</p>
      <h3>Detalhes</h3>
      <p>Acentos e cedilha são colocados sozinhos e não contam nas dicas: <b>acao</b> vira <b>ação</b>. A palavra pode ter letras repetidas.</p>
      <p>Toque numa casa da linha para escrever nela. As tentativas precisam ser palavras da lista.</p>
      <h3>Modos</h3>
      <p><b>1 palavra</b> (6 tentativas), <b>2 palavras</b> (7) e <b>4 palavras</b> (9) mudam todo dia à meia-noite, iguais para todo mundo. Com várias palavras, cada tentativa vale para todas. <b>Livre</b> sorteia palavras sem limite, para treinar.</p>`);
    store.set('seenHelp', true);
  }

  function statsHtml() {
    const { tries } = MODES[mode];
    const s = store.get('stats:' + mode, { played: 0, wins: 0, streak: 0, best: 0, dist: {} });
    const max = Math.max(1, ...Object.values(s.dist));
    const used = st.done && st.won ? Math.max(...st.solvedAt) + 1 : -1;
    const minRow = MODES[mode].n;
    return `
      <div class="stats">
        <div><b>${s.played}</b><span>jogos</span></div>
        <div><b>${s.played ? Math.round((s.wins / s.played) * 100) : 0}%</b><span>vitórias</span></div>
        <div><b>${s.streak}</b><span>sequência</span></div>
        <div><b>${s.best}</b><span>melhor sequência</span></div>
      </div>
      <h3>Tentativas usadas</h3>
      <div class="dist">${Array.from({ length: tries - minRow + 1 }, (_, i) => i + minRow).map((k) => {
        const v = s.dist[k] || 0;
        return `<div><span>${k}</span><i class="${k === used ? 'hl' : ''}" style="width:${Math.max(8, (v / max) * 100)}%">${v}</i></div>`;
      }).join('')}</div>`;
  }
  function openStats() {
    openModal(`<h2 id="modalTitle">Estatísticas · ${MODES[mode].label}</h2>${statsHtml()}${st.done ? endRow() : ''}`);
    wireEnd();
  }
  function openEnd() {
    const solvedAll = st.won;
    openModal(`
      <h2 id="modalTitle">${solvedAll ? 'Impresso com sucesso!' : 'Não foi dessa vez'}</h2>
      <p>${st.answers.length === 1 ? 'A palavra era:' : 'As palavras eram:'}</p>
      <div class="answers">${st.answers.map((a, b) => `<span class="${st.solvedAt[b] < 0 ? 'lost' : ''}">${show(a)}</span>`).join('')}</div>
      ${statsHtml()}
      ${endRow()}`);
    wireEnd();
  }
  function endRow() {
    return `<div class="end-row">
      ${mode === 'livre'
        ? '<button class="btn light" id="againBtn">Nova palavra</button>'
        : '<div class="countdown"><small>Próxima palavra em</small><span id="cd"></span></div>'}
      <button class="btn" id="shareBtn">Compartilhar</button>
    </div>`;
  }
  function wireEnd() {
    const again = $('#againBtn');
    if (again) again.onclick = () => { closeModal(); store.set('state:livre', null); load('livre'); };
    const sh = $('#shareBtn');
    if (sh) sh.onclick = shareResult;
    const cd = $('#cd');
    if (cd) {
      const tickCd = () => {
        const now = new Date();
        const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        const s = Math.max(0, Math.floor((next - now) / 1000));
        cd.textContent = [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((x) => String(x).padStart(2, '0')).join(':');
        if (s === 0) { closeModal(); load(mode); }
      };
      tickCd();
      clearInterval(countdownTimer);
      countdownTimer = setInterval(tickCd, 1000);
    }
  }
  $('#helpBtn').addEventListener('click', openHelp);
  $('#statsBtn').addEventListener('click', openStats);
  $('#settingsBtn').addEventListener('click', () => {
    const on = document.documentElement.classList.contains('contrast');
    openModal(`
      <h2 id="modalTitle">Ajustes</h2>
      <div class="setting"><span>Alto contraste<small>Laranja e azul no lugar de verde e ocre, para quem enxerga pouco essas cores.</small></span>
        <button class="switch" id="contrastSw" role="switch" aria-checked="${on}" aria-label="Alto contraste"></button></div>`);
    $('#contrastSw').onclick = (e) => {
      const v = !document.documentElement.classList.contains('contrast');
      document.documentElement.classList.toggle('contrast', v);
      e.currentTarget.setAttribute('aria-checked', String(v));
      store.set('contrast', v);
      render();
    };
  });

  async function shareResult() {
    const { tries, label } = MODES[mode];
    const contrast = document.documentElement.classList.contains('contrast');
    const sq = { ok: contrast ? '🟧' : '🟩', near: contrast ? '🟦' : '🟨', miss: '⬛' };
    const num = (k) => ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'][k - 1];
    let text = `Prensa${mode === 'livre' ? ' (livre)' : ` #${st.day}`} · ${label}`;
    if (st.answers.length === 1) {
      text += ` ${st.won ? st.guesses.length : 'X'}/${tries}\n\n`;
      text += st.guesses.map((g) => score(g, st.answers[0]).map((x) => sq[x]).join('')).join('\n');
    } else {
      const cells = st.solvedAt.map((x) => (x >= 0 ? num(x + 1) : '🟥'));
      text += '\n\n' + (cells.length === 4 ? `${cells[0]} ${cells[1]}\n${cells[2]} ${cells[3]}` : cells.join(' '));
    }
    text += `\n${location.origin}${location.pathname}`;
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

  /* ================= Modos e início ================= */
  document.querySelector('.modes').addEventListener('click', (e) => {
    const b = e.target.closest('[data-mode]');
    if (b && e.detail > 0) b.blur(); // clique com mouse/dedo: devolve o teclado ao jogo
    if (b && !busy && b.dataset.mode !== mode) load(b.dataset.mode);
  });
  window.addEventListener('resize', () => { if (st) sizeTiles(); });
  // Virou o dia com a página aberta: carrega a palavra nova ao voltar.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && st && mode !== 'livre' && st.day !== dayNumber()) load(mode);
  });

  if (store.get('contrast', false)) document.documentElement.classList.add('contrast');
  const param = new URLSearchParams(location.search).get('mode');
  load(MODES[param] ? param : store.get('mode', 'um'));
  if (!store.get('seenHelp', false)) openHelp();
  else if (st.done && mode !== 'livre') setTimeout(openEnd, 300);
})();
