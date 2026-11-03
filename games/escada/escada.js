(() => {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const D = window.EscadaPalavras;
  const MODES = {
    dia4: { L: 4, daily: true, title: 'Escada do dia', sub: '4 letras' },
    dia5: { L: 5, daily: true, title: 'Escada do dia', sub: '5 letras' },
    livre4: { L: 4, daily: false, title: 'Escada livre', sub: '4 letras' },
    livre5: { L: 5, daily: false, title: 'Escada livre', sub: '5 letras' },
  };
  const RANGE = { 4: [4, 6], 5: [4, 6] };

  /* ================= Utilidades ================= */
  const store = {
    get(k, d = null) {
      try { const v = localStorage.getItem('escada:' + k); return v == null ? d : JSON.parse(v); }
      catch { return d; }
    },
    set(k, v) { try { localStorage.setItem('escada:' + k, JSON.stringify(v)); } catch { /* sem armazenamento */ } },
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
  function dayNumber() {
    const d = new Date();
    return Math.round((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(2026, 0, 1)) / 86400000) + 1;
  }
  const norm = (w) => w.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const plural = (k, one, many) => `${k} ${k === 1 ? one : many}`;
  const starsHtml = (k) => [0, 1, 2].map((i) => `<span class="${i < k ? '' : 'off'}">★</span>`).join('');

  let toastTimer;
  function toast(msg, ms = 2200) {
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

  /* ================= Palavras e grafo ================= */
  const DICT = {};
  function dict(L) {
    if (DICT[L]) return DICT[L];
    const valid = new Map();
    for (const w of D[L].VALIDAS.split(' ')) if (!valid.has(norm(w))) valid.set(norm(w), w);
    const comuns = [...new Set(D[L].COMUNS.split(' ').map(norm))].filter((w) => valid.has(w));
    const buckets = new Map();
    for (const w of valid.keys()) {
      for (let i = 0; i < L; i++) {
        const k = w.slice(0, i) + '_' + w.slice(i + 1);
        if (!buckets.has(k)) buckets.set(k, []);
        buckets.get(k).push(w);
      }
    }
    DICT[L] = { valid, comuns, buckets, L };
    return DICT[L];
  }
  function neighbors(d, w) {
    const out = [];
    for (let i = 0; i < d.L; i++) for (const x of d.buckets.get(w.slice(0, i) + '_' + w.slice(i + 1)) || []) if (x !== w) out.push(x);
    return out;
  }
  function bfs(d, from) {
    const dist = new Map([[from, 0]]), prev = new Map();
    const q = [from];
    for (let h = 0; h < q.length; h++) {
      const w = q[h];
      for (const x of neighbors(d, w)) if (!dist.has(x)) { dist.set(x, dist.get(w) + 1); prev.set(x, w); q.push(x); }
    }
    return { dist, prev };
  }
  function path(d, from, to) {
    const { prev, dist } = bfs(d, from);
    if (!dist.has(to)) return null;
    const p = [to];
    while (p[0] !== from) p.unshift(prev.get(p[0]));
    return p;
  }
  function pickLadder(L, rnd) {
    const d = dict(L);
    const [lo, hi] = RANGE[L];
    for (let t = 0; t < 200; t++) {
      const start = d.comuns[Math.floor(rnd() * d.comuns.length)];
      const { dist } = bfs(d, start);
      const goals = d.comuns.filter((w) => dist.has(w) && dist.get(w) >= lo && dist.get(w) <= hi);
      if (!goals.length) continue;
      const goal = goals[Math.floor(rnd() * goals.length)];
      return { start, goal, par: dist.get(goal) };
    }
    return null;
  }
  const show = (w) => (dict(game.L).valid.get(w) || w).toUpperCase();

  /* ================= Telas ================= */
  let current = 'home';
  function screen(id) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === 's-' + id));
    current = id;
    $('#backLink').hidden = id !== 'home';
    $('#menuBack').hidden = id === 'home';
    window.scrollTo(0, 0);
  }

  function renderHome() {
    const day = dayNumber();
    $('#modes').innerHTML = Object.entries(MODES).map(([id, m]) => {
      let st;
      if (m.daily) {
        const s = store.get(`dia:${m.L}:${day}`);
        const stats = store.get(`stats:${m.L}`, { streak: 0 });
        st = s && s.done ? (s.won ? `<span class="st">${'★'.repeat(s.stars)}${'☆'.repeat(3 - s.stars)}</span> · Hoje em ${plural(s.chain.length, 'degrau', 'degraus')}` : 'Hoje: desistiu')
          : s && s.chain.length ? 'Em andamento' : 'Nova escada hoje';
        if (stats.streak > 1) st += ` · sequência ${stats.streak}`;
      } else {
        const wins = store.get(`wins:${m.L}`, 0);
        st = wins ? `${plural(wins, 'escada', 'escadas')} subidas` : 'Escadas sorteadas, sem limite';
      }
      return `<button class="mode" data-mode="${id}"><strong>${m.title}</strong><span>${m.sub}</span><span>${st}</span></button>`;
    }).join('');
    screen('home');
  }
  $('#modes').addEventListener('click', (e) => { const b = e.target.closest('[data-mode]'); if (b) start(b.dataset.mode); });
  $('#homeBtn').addEventListener('click', renderHome);
  $('#menuBack').addEventListener('click', renderHome);
  $('#doneMenu').addEventListener('click', renderHome);

  /* ================= Estado ================= */
  let mode = null, game = null, typed = '';
  const keyOf = () => (MODES[mode].daily ? `dia:${game.L}:${game.day}` : `livre:${game.L}`);
  const save = () => store.set(keyOf(), game);

  function start(m, fresh = false) {
    mode = m;
    const M = MODES[m];
    const day = dayNumber();
    let g = M.daily ? store.get(`dia:${M.L}:${day}`) : (fresh ? null : store.get(`livre:${M.L}`));
    if (!g || (!M.daily && g.done && fresh)) {
      const rnd = M.daily ? mulberry32(hashStr(`jogateca-escada-${M.L}-${day}`)) : Math.random;
      const p = pickLadder(M.L, rnd);
      g = { L: M.L, day: M.daily ? day : null, ...p, chain: [], hints: 0, done: false, won: false, stars: 0 };
    }
    game = g;
    typed = '';
    if (!M.daily) store.set(`livre:${M.L}`, game);
    screen('play');
    buildKeyboard();
    render(true);
  }

  /* ================= Desenho ================= */
  function tilesHtml(w, prev, cls = '') {
    const goal = game.goal;
    return [...w].map((ch, i) => {
      const c = [];
      if (prev && norm(prev[i]) !== norm(ch)) c.push('ch');
      if (norm(ch) === goal[i]) c.push('ok');
      return `<span class="tile ${c.join(' ')} ${cls}">${ch}</span>`;
    }).join('');
  }
  function render(scroll = false) {
    const M = MODES[mode];
    const L = game.L;
    $('#infoTitle').textContent = `${M.daily ? `Do dia #${game.day}` : 'Livre'} · ${L} letras`;
    $('#infoSteps').textContent = game.chain.length;
    $('#infoPar').textContent = `(mínimo ${game.par})`;
    let h = `<div class="rung start" data-k="-1" aria-label="Começo: ${show(game.start)}">${tilesHtml(show(game.start), null)}</div>`;
    let prev = show(game.start);
    game.chain.forEach((w, k) => {
      const W = show(w);
      const isLast = k === game.chain.length - 1;
      const isGoal = w === game.goal;
      if (isGoal) return;
      h += `<div class="rung${isLast && scroll === 'new' ? ' new' : ''}" data-k="${k}" aria-label="Degrau ${k + 1}: ${W}">${tilesHtml(W, prev)}</div>`;
      prev = W;
    });
    if (!game.done) {
      const cells = Array.from({ length: L }, (_, i) => {
        const ch = typed[i];
        return ch ? `<span class="tile">${ch.toUpperCase()}</span>` : `<span class="tile ${i === typed.length ? 'cur' : 'empty'}"></span>`;
      }).join('');
      h += `<div class="rung input" id="inputRung" aria-label="Próximo degrau">${cells}</div>`;
    }
    const reached = game.won;
    h += `<div class="rung goal" aria-label="Chegada: ${show(game.goal)}">${tilesHtml(show(game.goal), reached ? prev : null)}</div>`;
    $('#ladder').innerHTML = h;
    // painel de fim
    $('#donePanel').hidden = !game.done;
    $('#tools').hidden = game.done;
    $('#kb').hidden = game.done;
    if (game.done) renderDone();
    $('#undoBtn').disabled = !game.chain.length;
    if (scroll) {
      const el = $('#inputRung') || $('#ladder').lastElementChild;
      if (el) el.scrollIntoView({ block: 'nearest' });
    }
  }

  function renderDone() {
    const d = dict(game.L);
    const sol = path(d, game.start, game.goal);
    $('#doneStars').innerHTML = game.won ? starsHtml(game.stars) : '';
    const steps = game.chain.length;
    $('#doneTitle').textContent = !game.won ? 'Fica para a próxima' : steps === game.par && !game.hints ? 'No mínimo possível!' : 'Chegou lá!';
    $('#doneSub').textContent = !game.won ? `Dava para ir em ${plural(game.par, 'degrau', 'degraus')}.`
      : `${plural(steps, 'degrau', 'degraus')} (mínimo ${game.par})${game.hints ? ` · ${plural(game.hints, 'dica', 'dicas')}` : ''}.`;
    $('#doneSolution').textContent = sol ? `Um caminho mínimo: ${sol.map((w) => show(w)).join(' → ')}` : '';
    const M = MODES[mode];
    $('#nextBtn').textContent = M.daily ? (game.L === 4 ? 'Escada do dia de 5 letras' : 'Escada livre') : 'Nova escada';
    $('#nextBtn').onclick = () => (M.daily ? start(game.L === 4 ? 'dia5' : 'livre5') : start(mode, true));
    $('#shareBtn').onclick = () => share(`${M.title}${M.daily ? ` #${game.day}` : ''} · ${game.L} letras\n${show(game.start)} → ${show(game.goal)}\n🪜 ${game.won ? `${plural(steps, 'degrau', 'degraus')} (mínimo ${game.par}) ${'★'.repeat(game.stars)}${'☆'.repeat(3 - game.stars)}` : 'não chegou desta vez'}\n${location.origin}${location.pathname}`);
  }

  /* ================= Jogadas ================= */
  const last = () => (game.chain.length ? game.chain[game.chain.length - 1] : game.start);
  function shake(msg) {
    toast(msg);
    const r = $('#inputRung');
    if (r) { r.classList.remove('shake'); void r.offsetWidth; r.classList.add('shake'); }
  }
  function submit() {
    if (game.done) return;
    const L = game.L, d = dict(L), w = typed;
    if (w.length < L) { shake(`A palavra tem ${L} letras.`); return; }
    if (!d.valid.has(w)) { shake('Não conheço essa palavra.'); return; }
    const p = last();
    let diff = 0;
    for (let i = 0; i < L; i++) if (w[i] !== p[i]) diff++;
    if (diff === 0) { shake('É a mesma palavra.'); return; }
    if (diff > 1) { shake('Mude só uma letra.'); return; }
    if (w === game.start || game.chain.includes(w)) { shake('Essa palavra já está na escada.'); return; }
    game.chain.push(w);
    typed = '';
    if (w === game.goal) finish(true);
    save();
    render('new');
  }
  function finish(won) {
    game.done = true;
    game.won = won;
    const steps = game.chain.length;
    let stars = 0;
    if (won) {
      stars = steps === game.par ? 3 : steps <= game.par + 2 ? 2 : 1;
      if (game.hints) stars = Math.min(stars, game.hints > 2 ? 1 : 2);
    }
    game.stars = stars;
    const M = MODES[mode];
    if (M.daily) {
      const stats = store.get(`stats:${game.L}`, { streak: 0, lastDay: 0, wins: 0 });
      if (won) {
        stats.streak = stats.lastDay === game.day - 1 ? stats.streak + 1 : 1;
        stats.lastDay = game.day; stats.wins++;
      } else stats.streak = 0;
      store.set(`stats:${game.L}`, stats);
    } else if (won) store.set(`wins:${game.L}`, store.get(`wins:${game.L}`, 0) + 1);
  }

  function type(ch) {
    if (game.done || typed.length >= game.L) return;
    typed += norm(ch); // acentos e cedilha não importam
    render();
  }
  function backspace() { if (!game.done && typed) { typed = typed.slice(0, -1); render(); } }

  $('#ladder').addEventListener('click', (e) => {
    const r = e.target.closest('.rung[data-k]');
    if (!r || game.done) return;
    const k = +r.dataset.k;
    if (k === game.chain.length - 1) return;
    game.chain = game.chain.slice(0, k + 1);
    typed = '';
    save(); render(true);
    toast(k < 0 ? 'De volta ao começo.' : 'Voltou para esse degrau.');
  });
  $('#undoBtn').addEventListener('click', () => {
    if (game.done || !game.chain.length) return;
    game.chain.pop(); typed = '';
    save(); render(true);
  });
  $('#hintBtn').addEventListener('click', () => {
    if (game.done) return;
    const p = path(dict(game.L), last(), game.goal);
    if (!p || p.length < 2) return;
    const next = p[1];
    game.hints++;
    game.chain.push(next);
    typed = '';
    if (next === game.goal) finish(true);
    save(); render('new');
    toast(`Dica: ${show(next)}. Faltam ${plural(p.length - 2, 'degrau', 'degraus')} no melhor caminho daqui.`, 3200);
  });
  let giveArm = 0;
  $('#giveBtn').addEventListener('click', () => {
    if (game.done) return;
    if (Date.now() - giveArm > 3000) { giveArm = Date.now(); toast('Toque de novo para desistir e ver um caminho.'); return; }
    finish(false); save(); render(true);
  });

  /* ================= Teclado ================= */
  function buildKeyboard() {
    const rows = ['qwertyuiop', 'asdfghjklç', '↵zxcvbnm⌫'];
    $('#kb').innerHTML = rows.map((r) => `<div class="kb-row">${[...r].map((k) => {
      if (k === '↵') return '<button class="key wide" data-k="enter" aria-label="Confirmar">OK</button>';
      if (k === '⌫') return '<button class="key wide" data-k="back" aria-label="Apagar">⌫</button>';
      return `<button class="key" data-k="${k}">${k}</button>`;
    }).join('')}</div>`).join('');
  }
  $('#kb').addEventListener('mousedown', (e) => e.preventDefault());
  $('#kb').addEventListener('click', (e) => {
    const b = e.target.closest('[data-k]');
    if (!b || !game) return;
    const k = b.dataset.k;
    if (k === 'enter') submit(); else if (k === 'back') backspace(); else type(k);
  });
  document.addEventListener('keydown', (e) => {
    if (current !== 'play' || !game || game.done || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Enter') { e.preventDefault(); submit(); return; }
    if (e.key === 'Backspace') { e.preventDefault(); backspace(); return; }
    const ch = e.key.length === 1 ? norm(e.key) : '';
    if (/^[a-z]$/.test(ch)) type(ch);
  });

  /* ================= Início ================= */
  renderHome();
  const q = new URLSearchParams(location.search).get('mode');
  if (MODES[q]) start(q);
})();
