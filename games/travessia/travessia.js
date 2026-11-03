(() => {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const E = window.TravessiaEngine;
  const FASES = window.TravessiaFases;
  const TONES = ['', '#e76f51', '#2a9d8f', '#8e6ad8', '#e9a23b'];
  const ICON = { bank: '🚫', boat: '⛵', outnumber: '⚖️', guard: '🎩', needs: '🤝' };
  const MIN = {};
  FASES.forEach((f) => { const p = E.solve(f); MIN[f.id] = p ? p.length : 0; });

  /* ================= Utilidades ================= */
  const store = {
    get(k, d = null) {
      try { const v = localStorage.getItem('travessia:' + k); return v == null ? d : JSON.parse(v); }
      catch { return d; }
    },
    set(k, v) { try { localStorage.setItem('travessia:' + k, JSON.stringify(v)); } catch { /* sem armazenamento */ } },
    del(k) { try { localStorage.removeItem('travessia:' + k); } catch { /* sem armazenamento */ } },
  };
  const plural = (k, one, many) => `${k} ${k === 1 ? one : many}`;
  const starsHtml = (k) => [0, 1, 2].map((i) => `<span class="${i < k ? '' : 'off'}">★</span>`).join('');
  const listNames = (names) => (names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} e ${names[names.length - 1]}`);

  let current = 'home';
  function show(id) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === 's-' + id));
    current = id;
    $('#backLink').hidden = id !== 'home';
    $('#menuBack').hidden = id === 'home';
    window.scrollTo(0, 0);
  }
  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
  }
  async function share(text) {
    try {
      if (navigator.share && matchMedia('(pointer: coarse)').matches) { await navigator.share({ text }); return; }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    try { await navigator.clipboard.writeText(text); toast('Resultado copiado!'); }
    catch { toast('Não deu para copiar automaticamente.'); }
  }

  /* ================= Progresso ================= */
  const prog = () => store.get('prog', {});
  function unlocked(k) {
    const p = prog();
    if (p[FASES[k].id]) return true;
    let last = -1;
    FASES.forEach((f, i) => { if (p[f.id]) last = i; });
    return k <= last + 2;
  }
  const nextLevel = () => {
    const p = prog();
    const k = FASES.findIndex((f) => !p[f.id]);
    return k < 0 ? 0 : k;
  };

  /* ================= Menu ================= */
  function renderHome() {
    const p = prog();
    const total = FASES.reduce((s, f) => s + (p[f.id] ? p[f.id].stars : 0), 0);
    $('#starsTotal').textContent = `${total} de ${FASES.length * 3} ★`;
    $('#levels').innerHTML = FASES.map((f, k) => {
      const r = p[f.id], open = unlocked(k);
      return `<button class="level${r ? ' done' : ''}" data-k="${k}" ${open ? '' : 'disabled'}>
        <span class="num">${k + 1}</span>
        <strong>${f.title}${open ? '' : '<span class="lock">🔒</span>'}</strong>
        <span class="meta">${r ? `<span class="stars">${starsHtml(r.stars)}</span> · ${r.trips} viagens` : `Mínimo: ${MIN[f.id]} viagens`}</span>
        <span class="cast" aria-hidden="true">${[...new Set(f.chars.map((c) => c.emoji))].join('')}</span>
      </button>`;
    }).join('');
    show('home');
  }
  $('#levels').addEventListener('click', (e) => {
    const b = e.target.closest('[data-k]');
    if (b && !b.disabled) startLevel(+b.dataset.k, store.get('save'));
  });
  const toMenu = () => { if (game && !game.won) save(); renderHome(); };
  $('#homeBtn').addEventListener('click', toMenu);
  $('#menuBack').addEventListener('click', toMenu);

  /* ================= Estado ================= */
  let game = null; // { k, state, boat, trips, hints, history, broken, won }
  let L = null, P = null, crossing = false;
  const save = () => { if (game && !game.won) store.set('save', game); };

  function startLevel(k, resumeFrom = null) {
    L = FASES[k];
    P = E.prep(L);
    game = resumeFrom && resumeFrom.k === k ? resumeFrom
      : { k, state: 0, boat: 0, trips: 0, hints: 0, history: [], broken: null, won: false };
    crossing = false;
    $('#lvNum').textContent = `Fase ${k + 1} de ${FASES.length}`;
    $('#lvTitle').textContent = L.title;
    $('#story').textContent = L.story;
    $('#minTrips').textContent = `mínimo ${MIN[L.id]}`;
    renderRules();
    show('play');
    render();
    save();
  }

  function renderRules() {
    const lines = [];
    const everyoneRows = L.chars.every((c) => c.rows);
    lines.push(['🛶', `O barco leva ${plural(L.seats, 'personagem', 'personagens')}${L.maxW ? ` e aguenta ${L.maxW} kg` : ''}. ${everyoneRows ? 'Todos sabem remar.' : 'Só rema quem tem 🛶.'}`, '']);
    const seen = new Set();
    for (const r of L.rules) {
      if (seen.has(r.msg)) continue;
      seen.add(r.msg);
      lines.push([ICON[r.t] || '•', r.msg, r.msg]);
    }
    $('#rules').innerHTML = lines.map(([i, t, key]) => `<li data-msg="${key.replace(/"/g, '&quot;')}"><i aria-hidden="true">${i}</i><span>${t}</span></li>`).join('');
  }

  const sideOf = (i) => (game.state >> i) & 1;
  const boatSide = () => (game.state >> P.n) & 1;

  function tokenHtml(c, i, extra = '') {
    const ring = c.tone ? `--ring:${TONES[c.tone]}` : '';
    return `<button class="tok${extra}" data-i="${i}" style="${ring}" aria-label="${c.name}${c.rows ? ', sabe remar' : ''}${c.w ? `, ${c.w} kg` : ''}">
      <span class="emo" aria-hidden="true">${c.emoji}</span><span class="name">${c.name}</span>
      ${c.rows && !L.chars.every((x) => x.rows) ? '<span class="oar" aria-hidden="true">🛶</span>' : ''}
      ${c.w ? `<span class="kg">${c.w}kg</span>` : ''}
    </button>`;
  }

  function render(badSet = new Set()) {
    const bs = boatSide();
    const parts = ['', ''];
    let seats = '', w = 0, inBoat = 0;
    L.chars.forEach((c, i) => {
      const bad = badSet.has(i) ? ' bad' : '';
      if (game.boat & (1 << i)) { seats += tokenHtml(c, i, bad); w += c.w || 0; inBoat++; }
      else parts[sideOf(i)] += tokenHtml(c, i, (sideOf(i) !== bs ? ' far' : '') + bad);
    });
    for (let s = inBoat; s < L.seats; s++) seats += '<span class="seat" aria-hidden="true"></span>';
    $('#tokens0').innerHTML = parts[0];
    $('#tokens1').innerHTML = parts[1];
    $('#seats').innerHTML = seats;
    const boat = $('#boat');
    boat.classList.toggle('at0', bs === 0);
    boat.classList.toggle('at1', bs === 1);
    const load = $('#load');
    load.textContent = L.maxW ? `${w} / ${L.maxW} kg` : '';
    load.classList.toggle('over', !!L.maxW && w > L.maxW);
    $('#bank1').classList.add('goal');
    $('#trips').textContent = game.trips;
    $('#goBtn').disabled = crossing || !!game.broken || !game.boat;
    $('#undoBtn').disabled = crossing || !game.history.length;
    $('#oops').hidden = !game.broken;
    if (game.broken) $('#oopsMsg').textContent = game.broken;
    document.querySelectorAll('#rules li').forEach((li) => li.classList.toggle('hit', !!game.broken && li.dataset.msg === game.broken));
  }

  /* ================= Jogadas ================= */
  $('#scene').addEventListener('click', (e) => {
    const t = e.target.closest('.tok');
    if (!t || crossing || game.broken || game.won) return;
    const i = +t.dataset.i, bit = 1 << i;
    if (game.boat & bit) game.boat &= ~bit;
    else if (sideOf(i) !== boatSide()) { toast('O barco está na outra margem.'); return; }
    else if (E.count(game.boat) >= L.seats) { toast(`O barco está cheio: cabem ${L.seats}.`); return; }
    else game.boat |= bit;
    render(); save();
  });

  function go() {
    if (crossing || game.broken || game.won) return;
    const chk = E.boatCheck(L, P, game.boat);
    if (!chk.ok) {
      toast(chk.msg);
      const b = $('#boat');
      b.classList.remove('no'); void b.offsetWidth; b.classList.add('no');
      if (chk.rule) document.querySelectorAll('#rules li').forEach((li) => { if (li.dataset.msg === chk.rule.msg) { li.classList.add('hit'); setTimeout(() => li.classList.remove('hit'), 1600); } });
      return;
    }
    game.history.push({ state: game.state, boat: game.boat, trips: game.trips });
    const res = E.cross(L, P, game.state, game.boat);
    game.state = res.state;
    game.trips++;
    crossing = true;
    $('#boat').classList.add('moving');
    render();
    setTimeout(() => {
      crossing = false;
      $('#boat').classList.remove('moving');
      if (res.broken) {
        game.broken = res.broken.msg;
        render(culprits(res.broken));
        $('#bank0').classList.toggle('bad', !!E.bankBroken(P, ~game.state & P.all));
        $('#bank1').classList.toggle('bad', !!E.bankBroken(P, game.state & P.all));
      } else if ((game.state & P.all) === P.all) { render(); win(); return; }
      else render();
      save();
    }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 50 : 850);
  }
  $('#goBtn').addEventListener('click', go);

  // Quem está envolvido na regra quebrada (para piscar em vermelho).
  function culprits(r) {
    const out = new Set();
    for (const side of [0, 1]) {
      const group = side ? game.state & P.all : ~game.state & P.all;
      const br = E.bankBroken(P, group);
      if (!br) continue;
      const on = (id) => group & P.bit(id);
      const add = (id) => { if (on(id)) out.add(P.idx[id]); };
      if (br.t === 'bank') { add(br.a); add(br.b); }
      if (br.t === 'outnumber') br.big.forEach(add);
      if (br.t === 'needs') add(br.a);
      if (br.t === 'guard') {
        for (const [x, o] of br.pairs) if (on(x) && !on(o)) add(x);
      }
    }
    return out;
  }

  function undo() {
    const h = game.history.pop();
    if (!h || crossing) return;
    Object.assign(game, h, { broken: null });
    $('#bank0').classList.remove('bad'); $('#bank1').classList.remove('bad');
    render(); save();
  }
  $('#undoBtn').addEventListener('click', undo);
  $('#oopsUndo').addEventListener('click', undo);
  $('#restartBtn').addEventListener('click', () => {
    if (crossing || !game.trips) return;
    game.history.push({ state: game.state, boat: game.boat, trips: game.trips });
    Object.assign(game, { state: 0, boat: 0, trips: 0, broken: null });
    $('#bank0').classList.remove('bad'); $('#bank1').classList.remove('bad');
    render(); save();
    toast('Todo mundo de volta. Dá para desfazer.');
  });

  // Dica: monta no barco o próximo passo de uma solução mais curta a partir daqui.
  $('#hintBtn').addEventListener('click', () => {
    if (crossing || game.won) return;
    if (game.broken) { toast('Primeiro desfaça a última viagem.'); return; }
    const path = E.solve(L, game.state);
    if (!path || !path.length) { toast('Daqui não há saída. Desfaça algumas viagens.'); return; }
    game.boat = path[0];
    game.hints++;
    render(); save();
    const names = L.chars.filter((c, i) => game.boat & (1 << i)).map((c) => c.name);
    document.querySelectorAll('#seats .tok').forEach((t) => t.classList.add('hint'));
    toast(`Dica: ${listNames(names)} ${names.length > 1 ? 'atravessam' : 'atravessa'}. Faltam ${path.length} ${path.length === 1 ? 'viagem' : 'viagens'} no melhor caminho.`);
  });

  document.addEventListener('keydown', (e) => {
    if (current !== 'play' || !game) return;
    if (e.key === 'Enter' && !e.target.closest('button')) { e.preventDefault(); go(); }
    else if ((e.key === 'z' || e.key === 'Z' || e.key === 'Backspace') && !e.ctrlKey && !e.metaKey) undo();
    else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); }
    else if (/^[1-9]$/.test(e.key)) {
      const t = document.querySelectorAll('#scene .tok')[+e.key - 1];
      if (t) t.click();
    } else if (e.key === ' ' && !e.target.closest('button')) { e.preventDefault(); go(); }
  });

  /* ================= Vitória ================= */
  function win() {
    game.won = true;
    store.del('save');
    const min = MIN[L.id];
    let stars = game.trips <= min ? 3 : game.trips <= min + 4 ? 2 : 1;
    if (game.hints) stars = Math.min(stars, 2);
    const p = prog();
    const prev = p[L.id];
    p[L.id] = { trips: Math.min(game.trips, prev ? prev.trips : Infinity), stars: Math.max(stars, prev ? prev.stars : 0) };
    store.set('prog', p);
    setTimeout(() => showWin(stars), 500);
  }
  function showWin(stars) {
    const k = game.k, min = MIN[L.id];
    show('win');
    $('#winEyebrow').textContent = `Fase ${k + 1} · ${L.title}`;
    $('#winStars').innerHTML = starsHtml(stars);
    $('#winTrips').textContent = `${plural(game.trips, 'viagem', 'viagens')}`;
    $('#winSub').textContent = game.trips <= min
      ? (game.hints ? `No mínimo possível, mas com ${plural(game.hints, 'dica', 'dicas')}.` : 'No mínimo possível! Perfeito.')
      : `O mínimo é ${min}. Dá para economizar ${plural(game.trips - min, 'viagem', 'viagens')}.`;
    const hasNext = k + 1 < FASES.length;
    $('#winNext').hidden = !hasNext;
    $('#winNext').onclick = () => startLevel(k + 1);
    $('#winRetry').onclick = () => startLevel(k);
    $('#winShare').onclick = () => share(`Travessia · Fase ${k + 1}: ${L.title}\n⛵ ${plural(game.trips, 'viagem', 'viagens')} (mínimo ${min}) ${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}\n${location.origin}${location.pathname}`);
  }
  $('#winHome').addEventListener('click', renderHome);

  /* ================= Início ================= */
  renderHome();
  const mode = new URLSearchParams(location.search).get('mode');
  const sv = store.get('save');
  if (mode === 'continuar' && sv && FASES[sv.k]) startLevel(sv.k, sv);
  else if (mode === 'proxima') startLevel(nextLevel());
  else if (mode) {
    const k = FASES.findIndex((f) => f.id === mode);
    if (k >= 0) startLevel(k, sv);
  }
})();
