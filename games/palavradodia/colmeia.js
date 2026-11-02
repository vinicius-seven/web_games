(() => {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const { PALAVRAS, COLMEIAS } = window.ColmeiaDados;
  // Níveis: porcentagem da pontuação máxima.
  const LEVELS = [[0, 'Ovo'], [2, 'Larva'], [5, 'Pupa'], [10, 'Operária'], [20, 'Coletora'], [35, 'Construtora'], [50, 'Guardiã'], [70, 'Rainha']];

  const store = {
    get(k, d = null) {
      try { const v = localStorage.getItem('colmeia:' + k); return v == null ? d : JSON.parse(v); }
      catch { return d; }
    },
    set(k, v) { try { localStorage.setItem('colmeia:' + k, JSON.stringify(v)); } catch { /* sem armazenamento */ } },
  };
  const norm = (w) => w.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const NORMS = PALAVRAS.map(norm);
  const DISPLAY = new Map(NORMS.map((n, i) => [n, PALAVRAS[i]]));

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
  function dayNumber(offset = 0) {
    const d = new Date();
    return Math.round((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate() + offset) - Date.UTC(2026, 0, 1)) / 86400000) + 1;
  }
  const ORDER = shuffled(COLMEIAS, mulberry32(hashStr('jogateca-colmeia')));
  const puzzleOfDay = (day) => ORDER[((day - 1) % ORDER.length + ORDER.length) % ORDER.length];

  // Todas as palavras válidas de uma colmeia ("abcdefgx": 7 letras + central).
  function solve(p) {
    const L = new Set(p.slice(0, 7)), c = p[7];
    return NORMS.filter((n) => n.includes(c) && [...n].every((ch) => L.has(ch)));
  }
  const isPangram = (n, p) => new Set(n).size === 7 && [...p.slice(0, 7)].every((ch) => n.includes(ch));
  const points = (n, p) => (n.length === 4 ? 1 : n.length) + (isPangram(n, p) ? 7 : 0);

  /* ================= Estado ================= */
  let mode = 'dia';
  let st = null; // { puzzle, found: [norm], day?, revealed }
  let answers = [], maxScore = 0, outer = [];
  let typed = '';

  function load(m) {
    mode = m;
    if (m === 'dia') {
      const day = dayNumber();
      st = store.get('dia:' + day) || { puzzle: puzzleOfDay(day), found: [], day };
    } else {
      st = store.get('livre');
      if (!st) { st = { puzzle: COLMEIAS[Math.floor(Math.random() * COLMEIAS.length)], found: [], revealed: false }; }
    }
    answers = solve(st.puzzle);
    maxScore = answers.reduce((s, n) => s + points(n, st.puzzle), 0);
    outer = shuffled([...st.puzzle.slice(0, 7)].filter((ch) => ch !== st.puzzle[7]), Math.random);
    typed = '';
    document.querySelectorAll('.tabs button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.mode === m)));
    $('#yesterdayBtn').hidden = m !== 'dia';
    $('#newBtn').hidden = m !== 'livre';
    $('#revealBtn').hidden = m !== 'livre';
    save();
    renderHive();
    render();
  }
  const save = () => store.set(mode === 'dia' ? 'dia:' + st.day : 'livre', st);
  const score = () => st.found.reduce((s, n) => s + points(n, st.puzzle), 0);
  function levelOf(sc) {
    const pct = maxScore ? (sc / maxScore) * 100 : 0;
    let i = 0;
    LEVELS.forEach(([p], k) => { if (pct >= p) i = k; });
    return i;
  }

  /* ================= Desenho ================= */
  function renderHive() {
    const hive = $('#hive');
    // Favo central e seis em volta (hexágonos de lado reto em cima).
    const pos = [[50, 50], [50, 16.5], [79, 33.3], [79, 66.7], [50, 83.5], [21, 66.7], [21, 33.3]];
    const letters = [st.puzzle[7], ...outer];
    hive.innerHTML = letters.map((ch, i) =>
      `<button class="cell${i === 0 ? ' center' : ''}" data-l="${ch}" style="left:${pos[i][0]}%;top:${pos[i][1]}%" aria-label="Letra ${ch.toUpperCase()}${i === 0 ? ', obrigatória' : ''}">${ch}</button>`).join('');
  }
  function render() {
    const sc = score(), lv = levelOf(sc);
    $('#score').textContent = sc;
    $('#rankName').textContent = st.found.length === answers.length ? 'Colmeia completa!' : LEVELS[lv][1];
    $('#rankBar').innerHTML = `<span class="fill" style="width:calc(${(lv / (LEVELS.length - 1)) * 100}% - 12px)"></span>` +
      LEVELS.map((_, i) => `<i class="${i <= lv ? 'on' : ''}${i === lv ? ' cur' : ''}">${i === lv ? sc : ''}</i>`).join('');
    const found = st.found.slice().sort();
    const missed = st.revealed ? answers.filter((n) => !st.found.includes(n)).sort() : [];
    $('#foundSummary').textContent = st.revealed
      ? `Você achou ${found.length} de ${answers.length} palavras`
      : found.length ? `${found.length} ${found.length === 1 ? 'palavra' : 'palavras'}: ${found.slice(-4).map((n) => DISPLAY.get(n)).join(', ')}…` : 'Nenhuma palavra ainda';
    $('#foundList').innerHTML = found.map((n) => `<li class="${isPangram(n, st.puzzle) ? 'pangram' : ''}">${DISPLAY.get(n)}</li>`).join('') +
      missed.map((n) => `<li class="missed${isPangram(n, st.puzzle) ? ' pangram' : ''}">${DISPLAY.get(n)}</li>`).join('');
    const c = st.puzzle[7], L = new Set(st.puzzle.slice(0, 7));
    $('#entry').innerHTML = [...typed].map((ch) => `<span class="${ch === c ? 'c' : L.has(ch) ? '' : 'x'}">${ch}</span>`).join('') + '<span class="caret"></span>';
  }

  /* ================= Jogadas ================= */
  function add(ch) { if (typed.length < 19) { typed += ch; render(); } }
  function del() { typed = typed.slice(0, -1); render(); }
  function shakeEntry(msg) {
    toast(msg);
    const e = $('#entry');
    e.classList.remove('shake'); void e.offsetWidth; e.classList.add('shake');
    setTimeout(() => { typed = ''; render(); }, 380);
  }
  function submit() {
    if (!typed) return;
    if (st.revealed) { shakeEntry('As respostas já foram mostradas'); return; }
    const w = typed, L = new Set(st.puzzle.slice(0, 7));
    if (w.length < 4) { shakeEntry('Muito curta: pelo menos 4 letras'); return; }
    if (![...w].every((ch) => L.has(ch))) { shakeEntry('Tem letra fora da colmeia'); return; }
    if (!w.includes(st.puzzle[7])) { shakeEntry('Falta a letra do centro'); return; }
    if (st.found.includes(w)) { shakeEntry('Essa você já achou'); return; }
    if (!answers.includes(w)) { shakeEntry('Não está na lista'); return; }
    const before = levelOf(score());
    st.found.push(w);
    save();
    const p = points(w, st.puzzle);
    typed = '';
    render();
    if (isPangram(w, st.puzzle)) toast(`Palavra-chave! +${p}`, 2200);
    else toast(`${['', '', '', '', 'Boa!', 'Muito bem!', 'Ótimo!'][Math.min(6, w.length)] || 'Incrível!'} +${p}`);
    const after = levelOf(score());
    if (st.found.length === answers.length) setTimeout(() => toast('Você achou todas as palavras! 🐝', 3000), 900);
    else if (after > before) setTimeout(() => toast(`Novo nível: ${LEVELS[after][1]}`, 2200), 900);
  }

  $('#hive').addEventListener('click', (e) => { const b = e.target.closest('[data-l]'); if (b) add(b.dataset.l); });
  $('#hive').addEventListener('mousedown', (e) => e.preventDefault());
  $('#delBtn').addEventListener('click', del);
  $('#enterBtn').addEventListener('click', submit);
  $('#shuffleBtn').addEventListener('click', () => {
    outer = shuffled(outer, Math.random);
    renderHive();
    $('#hive').classList.remove('spin'); void $('#hive').offsetWidth; $('#hive').classList.add('spin');
  });
  document.addEventListener('keydown', (e) => {
    if (!$('#modal').hidden) { if (e.key === 'Escape') closeModal(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target.closest && e.target.closest('summary, .tabs, .extras')) return;
    if (e.key === 'Enter') { e.preventDefault(); submit(); return; }
    if (e.key === 'Backspace') { e.preventDefault(); del(); return; }
    if (e.key === ' ') { e.preventDefault(); $('#shuffleBtn').click(); return; }
    const ch = norm(e.key);
    if (e.key.length === 1 && /^[a-z]$/.test(ch)) { e.preventDefault(); add(ch); }
  });

  /* ================= Avisos e janelas ================= */
  function toast(msg, ms = 1500) {
    const t = document.createElement('div');
    t.className = 'toast'; t.textContent = msg;
    $('#toasts').appendChild(t);
    setTimeout(() => t.remove(), ms);
  }
  const modal = $('#modal');
  function openModal(html) { $('#modalBody').innerHTML = html; modal.hidden = false; modal.querySelector('.modal-close').focus(); }
  function closeModal() { modal.hidden = true; }
  modal.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeModal(); });

  const miniHive = (p) => `<div class="mini-hive"><span class="c">${p[7]}</span>${[...p.slice(0, 7)].filter((ch) => ch !== p[7]).map((ch) => `<span>${ch}</span>`).join('')}</div>`;
  function openHelp() {
    openModal(`
      <h2 id="modalTitle">Como jogar</h2>
      <p>Forme palavras com as letras da colmeia.</p>
      <p>• Cada palavra tem <b>4 letras ou mais</b> e precisa usar a <b>letra do centro</b>.<br>• As letras podem se repetir.<br>• Acentos e cedilha não importam: <b>maca</b> vale <b>maçã</b>.<br>• Não há palavras com S nesta colmeia (nada de plurais).</p>
      <h3>Pontos</h3>
      <p>Palavras de 4 letras valem 1 ponto; as maiores valem 1 ponto por letra. A <b>palavra-chave</b> usa as 7 letras e vale 7 pontos extras. Toda colmeia tem pelo menos uma.</p>
      <h3>Níveis</h3>
      <div class="levels">${LEVELS.map(([p, n]) => `<div><span>${n}</span><span class="muted">${Math.ceil((p / 100) * maxScore)} pts</span></div>`).join('')}</div>
      <p class="muted" style="margin-top:12px">A colmeia do dia muda à meia-noite e é igual para todo mundo. No modo Livre, as colmeias são sorteadas.</p>`);
    store.set('seenHelp', true);
  }
  function openHints() {
    const left = answers.filter((n) => !st.found.includes(n));
    const lens = [...new Set(answers.map((n) => n.length))].sort((a, b) => a - b);
    const firsts = [...new Set(answers.map((n) => n[0]))].sort();
    const cnt = (f, l) => left.filter((n) => n[0] === f && n.length === l).length;
    const pairs = {};
    left.forEach((n) => { pairs[n.slice(0, 2)] = (pairs[n.slice(0, 2)] || 0) + 1; });
    const pangLeft = left.filter((n) => isPangram(n, st.puzzle)).length;
    openModal(`
      <h2 id="modalTitle">Dicas</h2>
      <p>Faltam <b>${left.length}</b> ${left.length === 1 ? 'palavra' : 'palavras'}${pangLeft ? ` (${pangLeft} ${pangLeft === 1 ? 'palavra-chave' : 'palavras-chave'})` : ''}. Pontuação máxima: <b>${maxScore}</b>.</p>
      <h3>Por letra inicial e tamanho</h3>
      <div style="overflow-x:auto"><table class="hints"><tr><th></th>${lens.map((l) => `<th>${l}</th>`).join('')}<th>Σ</th></tr>
        ${firsts.map((f) => `<tr><td>${f}</td>${lens.map((l) => `<td>${cnt(f, l) || '·'}</td>`).join('')}<td><b>${left.filter((n) => n[0] === f).length}</b></td></tr>`).join('')}
      </table></div>
      <h3>Começam com</h3>
      <div class="pairs">${Object.entries(pairs).sort().map(([k, v]) => `<span>${k}-${v}</span>`).join('')}</div>`);
  }
  function openYesterday() {
    const day = dayNumber(-1), p = puzzleOfDay(day);
    const sol = solve(p).sort();
    const prev = store.get('dia:' + day);
    const got = new Set(prev ? prev.found : []);
    openModal(`
      <h2 id="modalTitle">Colmeia de ontem</h2>
      ${miniHive(p)}
      <p class="muted">${sol.length} palavras${prev ? `; você achou ${got.size}` : ''}. Em destaque, as palavras-chave.</p>
      <div class="word-cols">${sol.map((n) => `<div class="${isPangram(n, p) ? 'pangram' : ''} ${got.has(n) ? 'got' : ''}">${DISPLAY.get(n)}</div>`).join('')}</div>`);
  }
  async function share() {
    const sc = score();
    const text = `Colmeia${mode === 'dia' ? ` #${st.day}` : ' (livre)'} · Palavra do Dia\n🐝 ${LEVELS[levelOf(sc)][1]} · ${sc} pts · ${st.found.length} ${st.found.length === 1 ? 'palavra' : 'palavras'}\n${location.origin}${location.pathname}`;
    try {
      if (navigator.share && matchMedia('(pointer: coarse)').matches) { await navigator.share({ text }); return; }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    try { await navigator.clipboard.writeText(text); toast('Resultado copiado!'); }
    catch { toast('Não deu para copiar automaticamente.'); }
  }
  $('#helpBtn').addEventListener('click', openHelp);
  $('#hintBtn').addEventListener('click', openHints);
  $('#yesterdayBtn').addEventListener('click', openYesterday);
  $('#shareBtn').addEventListener('click', share);
  $('#newBtn').addEventListener('click', () => { store.set('livre', null); load('livre'); toast('Nova colmeia!'); });
  $('#revealBtn').addEventListener('click', (e) => {
    if (!e.currentTarget.dataset.confirm) {
      e.currentTarget.dataset.confirm = '1'; e.currentTarget.textContent = 'Tem certeza? Toque de novo';
      setTimeout(() => { delete e.currentTarget.dataset.confirm; $('#revealBtn').textContent = 'Ver todas as palavras'; }, 3500);
      return;
    }
    st.revealed = true; save(); render(); $('#foundBox').open = true;
  });
  document.querySelector('.tabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-mode]');
    if (!b) return;
    if (e.detail > 0) b.blur();
    if (b.dataset.mode !== mode) load(b.dataset.mode);
  });
  // Virou o dia com a página aberta: carrega a colmeia nova ao voltar.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && mode === 'dia' && st.day !== dayNumber()) load('dia');
  });

  const param = new URLSearchParams(location.search).get('mode');
  load(param === 'livre' ? 'livre' : 'dia');
  if (!store.get('seenHelp', false)) openHelp();
})();
