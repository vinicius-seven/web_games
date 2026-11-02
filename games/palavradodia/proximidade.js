(() => {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const { PALAVRAS, SECRETAS } = window.ProximidadeVocab;
  const N = PALAVRAS.length;
  const HOT = 300, WARM = 1500; // faixas de cor por posição

  const store = {
    get(k, d = null) {
      try { const v = localStorage.getItem('proximidade:' + k); return v == null ? d : JSON.parse(v); }
      catch { return d; }
    },
    set(k, v) { try { localStorage.setItem('proximidade:' + k, JSON.stringify(v)); } catch { /* sem armazenamento */ } },
  };
  const norm = (w) => w.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  const INDEX = new Map();
  PALAVRAS.forEach((w, i) => { const n = norm(w); if (!INDEX.has(n)) INDEX.set(n, i); });

  function mulberry32(seed) {
    return () => {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function dayNumber() {
    const d = new Date();
    return Math.round((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(2026, 0, 1)) / 86400000) + 1;
  }
  // Ordem fixa das palavras secretas; o dia N usa a posição N dessa ordem.
  const ORDER = (() => {
    const a = [...Array(SECRETAS).keys()], rnd = mulberry32(0x5eed);
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  })();
  const secretOfDay = (day) => ORDER[((day - 1) % SECRETAS + SECRETAS) % SECRETAS];

  // Palpite → palavra do vocabulário: exata, ou a forma básica (plural, feminino, diminutivo, verbo conjugado).
  function lookup(raw) {
    const n = norm(raw);
    if (!/^[a-z]+(-[a-z]+)?$/.test(n)) return -1;
    if (INDEX.has(n)) return INDEX.get(n);
    const tries = [];
    const rep = (end, by) => { if (n.endsWith(end) && n.length > end.length + 1) tries.push(n.slice(0, -end.length) + by); };
    rep('oes', 'ao'); rep('aes', 'ao'); rep('ais', 'al'); rep('eis', 'el'); rep('ois', 'ol'); rep('uis', 'ul'); rep('is', 'il'); rep('ns', 'm');
    rep('res', 'r'); rep('zes', 'z'); rep('ses', 's'); rep('s', '');
    const base = tries.slice();
    for (const b of [n, ...base]) {
      if (b.endsWith('a')) tries.push(b.slice(0, -1) + 'o');
      if (/inh[oa]$/.test(b)) tries.push(b.replace(/inh([oa])$/, '$1'));
      if (/zinh[oa]$/.test(b)) tries.push(b.replace(/zinh[oa]$/, ''));
    }
    // Conjugações regulares → infinitivo.
    const verbEnds = ['ando', 'endo', 'indo', 'ado', 'ido', 'ada', 'ida', 'ava', 'avam', 'ou', 'eu', 'iu', 'aram', 'eram', 'iram', 'amos', 'emos', 'imos',
      'am', 'em', 'ei', 'ia', 'iam', 'as', 'es', 'o', 'a', 'e', 'arei', 'erei', 'irei', 'ara', 'era', 'ira', 'aria', 'eria', 'iria', 'asse', 'esse', 'isse'];
    for (const e of verbEnds) {
      if (n.endsWith(e) && n.length - e.length >= 2) {
        const st = n.slice(0, -e.length);
        tries.push(st + 'ar', st + 'er', st + 'ir');
      }
    }
    for (const t of tries) if (INDEX.has(t)) return INDEX.get(t);
    return -1;
  }

  /* ================= Estado ================= */
  let mode = 'dia';
  let st = null; // { day?, secret, guesses: [idx], hints: [idx], won, gaveUp }
  let rankOf = null, order = null;
  let lastIdx = -1;
  const cache = new Map();

  async function loadRanking(k) {
    if (cache.has(k)) return cache.get(k);
    const res = await fetch(`proximidade/r/${String(k).padStart(3, '0')}.txt`);
    if (!res.ok) throw new Error('falha ao carregar');
    const bin = atob((await res.text()).trim());
    const ord = new Uint16Array(bin.length / 2);
    for (let i = 0; i < ord.length; i++) ord[i] = bin.charCodeAt(2 * i) | (bin.charCodeAt(2 * i + 1) << 8);
    const rk = new Int32Array(N);
    ord.forEach((w, i) => { rk[w] = i + 1; });
    const out = { order: ord, rank: rk };
    cache.set(k, out);
    return out;
  }

  async function load(m, day = null) {
    mode = m;
    if (m === 'dia') {
      const d = day || dayNumber();
      st = store.get('dia:' + d) || { day: d, secret: secretOfDay(d), guesses: [], hints: [], won: false, gaveUp: false };
    } else {
      st = store.get('livre');
      if (!st || st.won || st.gaveUp) st = { secret: Math.floor(Math.random() * SECRETAS), guesses: [], hints: [], won: false, gaveUp: false };
    }
    document.querySelectorAll('.tabs button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.mode === m)));
    $('#loading').hidden = false;
    try {
      const r = await loadRanking(st.secret);
      rankOf = r.rank; order = r.order;
    } catch {
      $('#loading').textContent = 'Não foi possível carregar a palavra. Verifique a conexão e tente de novo.';
      return;
    }
    $('#loading').hidden = true;
    lastIdx = -1;
    save();
    render();
    if (st.won || st.gaveUp) setTimeout(openEnd, 300);
  }
  const save = () => store.set(mode === 'dia' ? 'dia:' + st.day : 'livre', st);
  const best = () => st.guesses.reduce((b, i) => Math.min(b, rankOf[i]), Infinity);

  /* ================= Desenho ================= */
  function rowHtml(i, isHint) {
    const r = rankOf[i];
    const cls = r === 1 ? 'win' : r <= HOT ? 'hot' : r <= WARM ? 'warm' : 'cold';
    const width = Math.max(4, 100 * (1 - Math.log(r) / Math.log(N)));
    return `<div class="row ${cls}${isHint ? ' hint' : ''}"><span class="bar" style="width:${width}%"></span><span class="word">${PALAVRAS[i]}</span><span class="rank">${r}</span></div>`;
  }
  function render() {
    $('#gameLabel').textContent = mode === 'dia' ? `Jogo #${st.day}${st.day !== dayNumber() ? ' (anterior)' : ''}` : 'Livre';
    $('#nGuesses').textContent = st.guesses.length;
    $('#nHints').textContent = st.hints.length;
    const hints = new Set(st.hints);
    const sorted = st.guesses.slice().sort((a, b) => rankOf[a] - rankOf[b]);
    $('#guesses').innerHTML = sorted.map((i) => `<li data-i="${i}">${rowHtml(i, hints.has(i))}</li>`).join('');
    $('#last').innerHTML = lastIdx >= 0 ? rowHtml(lastIdx, hints.has(lastIdx)) : '';
    $('#empty').hidden = st.guesses.length > 0;
    const done = st.won || st.gaveUp;
    $('#guess').disabled = done;
    $('#guess').placeholder = done ? (st.won ? 'Você achou a palavra!' : 'Palavra revelada') : 'Digite uma palavra';
  }

  /* ================= Jogadas ================= */
  function guess(raw) {
    if (!rankOf || st.won || st.gaveUp) return;
    const word = raw.trim();
    if (!word) return;
    const i = lookup(word);
    if (i < 0) { toast('Não conheço essa palavra'); return; }
    if (st.guesses.includes(i)) {
      lastIdx = i; render();
      const li = document.querySelector(`#guesses li[data-i="${i}"]`);
      if (li) { li.classList.remove('flash'); void li.offsetWidth; li.classList.add('flash'); li.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
      toast(`“${PALAVRAS[i]}” já foi`);
      return;
    }
    if (norm(word) !== norm(PALAVRAS[i])) toast(`Contou como “${PALAVRAS[i]}”`);
    st.guesses.push(i);
    lastIdx = i;
    if (rankOf[i] === 1) { st.won = true; finish(); }
    save();
    render();
  }
  function finish() {
    const key = 'stats:' + mode;
    const s = store.get(key, { played: 0, wins: 0, totalGuesses: 0 });
    s.played++; s.wins++; s.totalGuesses += st.guesses.length;
    store.set(key, s);
    setTimeout(openEnd, 900);
  }
  function hint() {
    if (!rankOf || st.won || st.gaveUp) return;
    const b = best();
    let target = b === Infinity ? HOT : Math.max(2, Math.floor(b / 2));
    if (b <= 2) { toast('Você já está colado na palavra!'); return; }
    const used = new Set(st.guesses);
    while (target > 1 && used.has(order[target - 1])) target--;
    if (target <= 1) { toast('Não há dica melhor que o seu palpite.'); return; }
    const i = order[target - 1];
    st.hints.push(i); st.guesses.push(i); lastIdx = i;
    save(); render();
    toast(`Dica: “${PALAVRAS[i]}” está na posição ${target}`);
  }
  function giveUp() {
    st.gaveUp = true;
    const i = order[0];
    if (!st.guesses.includes(i)) st.guesses.push(i);
    lastIdx = i;
    save(); render();
    setTimeout(openEnd, 500);
  }

  $('#form').addEventListener('submit', (e) => {
    e.preventDefault();
    const inp = $('#guess');
    guess(inp.value);
    inp.value = '';
    inp.focus();
  });

  /* ================= Janelas ================= */
  function toast(msg, ms = 1800) {
    const t = document.createElement('div');
    t.className = 'toast'; t.textContent = msg;
    $('#toasts').appendChild(t);
    setTimeout(() => t.remove(), ms);
  }
  const modal = $('#modal');
  function openModal(html) { $('#modalBody').innerHTML = html; modal.hidden = false; modal.querySelector('.modal-close').focus(); }
  function closeModal() { modal.hidden = true; }
  modal.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) closeModal(); });

  function openHelp() {
    openModal(`
      <h2 id="modalTitle">Como jogar</h2>
      <p>Descubra a palavra secreta. A cada palpite, você vê a <b>posição</b> dele numa fila de todas as ${N.toLocaleString('pt-BR')} palavras do jogo, ordenadas pela proximidade de sentido com a palavra secreta.</p>
      <p>A palavra secreta é a <b>posição 1</b>. Se “cachorro” for a secreta, “gato” fica bem no começo da fila e “matemática”, lá no fim.</p>
      <div class="legend"><span><i style="background:var(--hot)"></i>até ${HOT}: quente</span><span><i style="background:var(--warm)"></i>até ${WARM}: morno</span><span><i style="background:var(--cold)"></i>acima disso: frio</span></div>
      <p>Plural, feminino e verbo conjugado contam como a forma básica (“gatas” vale “gato”). Acentos não importam.</p>
      <p>A <b>dica</b> mostra uma palavra na metade do caminho entre o seu melhor palpite e a resposta. Se travar, dá para desistir pelo menu ⋮.</p>
      <p class="muted">A proximidade vem de vetores de palavras treinados com textos da internet (fastText, licença CC BY-SA 4.0); às vezes ela junta palavras que só aparecem em contextos parecidos.</p>`);
    store.set('seenHelp', true);
  }
  function openMenu() {
    const done = st.won || st.gaveUp;
    openModal(`
      <h2 id="modalTitle">Opções</h2>
      <div class="menu-list">
        <button class="btn" id="mHint" ${done ? 'disabled' : ''}>💡 Dica</button>
        <button class="btn" id="mPast">📅 Jogos anteriores</button>
        <button class="btn" id="mGiveUp" ${done ? 'disabled' : ''}>🏳️ Desistir e ver a palavra</button>
        ${done ? '<button class="btn" id="mEnd">🏁 Ver resultado</button>' : ''}
      </div>`);
    $('#mHint').onclick = () => { closeModal(); hint(); };
    $('#mPast').onclick = openPast;
    $('#mGiveUp').onclick = (e) => {
      if (!e.currentTarget.dataset.c) { e.currentTarget.dataset.c = '1'; e.currentTarget.textContent = 'Tem certeza? Toque de novo'; return; }
      closeModal(); giveUp();
    };
    const end = $('#mEnd'); if (end) end.onclick = openEnd;
  }
  function openPast() {
    const today = dayNumber();
    const days = [];
    for (let d = today; d >= Math.max(1, today - 59); d--) days.push(d);
    openModal(`
      <h2 id="modalTitle">Jogos anteriores</h2>
      <p class="muted">Os últimos ${days.length} dias. Em verde, os que você já resolveu.</p>
      <div class="past">${days.map((d) => { const s = store.get('dia:' + d); return `<button data-d="${d}" class="${s && s.won ? 'done' : ''}">#${d}</button>`; }).join('')}</div>`);
    document.querySelector('.past').onclick = (e) => {
      const b = e.target.closest('[data-d]');
      if (b) { closeModal(); load('dia', +b.dataset.d); }
    };
  }
  function openEnd() {
    const secretWord = PALAVRAS[order[0]];
    const top = Array.from(order.slice(0, 100));
    openModal(`
      <h2 id="modalTitle">${st.won ? 'Você achou!' : 'A palavra era'}</h2>
      <div class="big-word">${secretWord}</div>
      <p>${st.won ? `Em <b>${st.guesses.length}</b> ${st.guesses.length === 1 ? 'tentativa' : 'tentativas'}${st.hints.length ? ` e ${st.hints.length} ${st.hints.length === 1 ? 'dica' : 'dicas'}` : ', sem dicas'}.` : 'Fica para a próxima.'}</p>
      <h3>As 100 palavras mais próximas</h3>
      <div class="top-list">${top.map((i) => rowHtml(i, false)).join('')}</div>
      <div class="end-row">
        ${mode === 'livre' ? '<button class="btn primary" id="again">Nova palavra</button>' : '<button class="btn" id="past2">Jogos anteriores</button>'}
        <button class="btn primary" id="share">Compartilhar</button>
      </div>`);
    const again = $('#again'); if (again) again.onclick = () => { closeModal(); store.set('livre', null); load('livre'); };
    const past = $('#past2'); if (past) past.onclick = openPast;
    $('#share').onclick = share;
  }
  async function share() {
    const ranks = st.guesses.map((i) => rankOf[i]);
    const hot = ranks.filter((r) => r <= HOT && r > 1).length, warm = ranks.filter((r) => r > HOT && r <= WARM).length, cold = ranks.filter((r) => r > WARM).length;
    const text = `Proximidade${mode === 'dia' ? ` #${st.day}` : ' (livre)'} · Palavra do Dia\n${st.won ? `🎯 ${st.guesses.length} tentativas` : '🏳️ desisti'}${st.hints.length ? ` · ${st.hints.length} dicas` : ''}\n🟥 ${hot} 🟨 ${warm} 🟦 ${cold}\n${location.origin}${location.pathname}`;
    try {
      if (navigator.share && matchMedia('(pointer: coarse)').matches) { await navigator.share({ text }); return; }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    try { await navigator.clipboard.writeText(text); toast('Resultado copiado!'); }
    catch { toast('Não deu para copiar automaticamente.'); }
  }

  $('#helpBtn').addEventListener('click', openHelp);
  $('#menuBtn').addEventListener('click', openMenu);
  document.querySelector('.tabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-mode]');
    if (!b) return;
    if (e.detail > 0) b.blur();
    if (b.dataset.mode !== mode || (mode === 'dia' && st.day !== dayNumber())) load(b.dataset.mode);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && mode === 'dia' && st && !st.guesses.length && st.day < dayNumber()) load('dia');
  });

  const param = new URLSearchParams(location.search).get('mode');
  load(param === 'livre' ? 'livre' : 'dia');
  if (!store.get('seenHelp', false)) openHelp();
})();
