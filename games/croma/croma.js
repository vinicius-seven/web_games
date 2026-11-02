(() => {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const ROUNDS = 5;
  const DIFFS = {
    facil: { label: 'Fácil', ms: 5000 },
    normal: { label: 'Normal', ms: 3000 },
    dificil: { label: 'Difícil', ms: 1500 },
  };
  const ODD_SECONDS = 60;
  const ODD_PENALTY = 3;

  /* ================= Armazenamento ================= */
  const store = {
    get(k, d = null) {
      try { const v = localStorage.getItem('croma:' + k); return v == null ? d : JSON.parse(v); }
      catch { return d; }
    },
    set(k, v) { try { localStorage.setItem('croma:' + k, JSON.stringify(v)); } catch { /* sem armazenamento */ } },
  };

  /* ================= Matemática das cores ================= */
  function hsvToRgb(h, s, v) {
    s /= 100; v /= 100;
    const k = (n) => (n + h / 60) % 6;
    const f = (n) => v - v * s * Math.max(0, Math.min(k(n), 4 - k(n), 1));
    return [f(5), f(3), f(1)].map((x) => Math.round(x * 255));
  }
  const hex = ([r, g, b]) => '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('').toUpperCase();
  const css = (c) => hex(hsvToRgb(c.h, c.s, c.v));

  function rgbToLab([r, g, b]) {
    const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    const R = lin(r), G = lin(g), B = lin(b);
    const X = (R * 0.4124564 + G * 0.3575761 + B * 0.1804375) / 0.95047;
    const Y = R * 0.2126729 + G * 0.7151522 + B * 0.072175;
    const Z = (R * 0.0193339 + G * 0.119192 + B * 0.9503041) / 1.08883;
    const f = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);
    const fx = f(X), fy = f(Y), fz = f(Z);
    return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
  }

  // Diferença perceptual CIEDE2000.
  function deltaE2000([L1, a1, b1], [L2, a2, b2]) {
    const rad = Math.PI / 180, deg = 180 / Math.PI, p7 = Math.pow(25, 7);
    const C1 = Math.hypot(a1, b1), C2 = Math.hypot(a2, b2);
    const Cb7 = Math.pow((C1 + C2) / 2, 7);
    const G = 0.5 * (1 - Math.sqrt(Cb7 / (Cb7 + p7)));
    const a1p = (1 + G) * a1, a2p = (1 + G) * a2;
    const C1p = Math.hypot(a1p, b1), C2p = Math.hypot(a2p, b2);
    const hp = (b, a) => { if (a === 0 && b === 0) return 0; const x = Math.atan2(b, a) * deg; return x < 0 ? x + 360 : x; };
    const h1p = hp(b1, a1p), h2p = hp(b2, a2p);
    const dLp = L2 - L1, dCp = C2p - C1p;
    let dhp = 0;
    if (C1p * C2p !== 0) { dhp = h2p - h1p; if (dhp > 180) dhp -= 360; else if (dhp < -180) dhp += 360; }
    const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp / 2) * rad);
    const Lbp = (L1 + L2) / 2, Cbp = (C1p + C2p) / 2;
    let hbp;
    if (C1p * C2p === 0) hbp = h1p + h2p;
    else if (Math.abs(h1p - h2p) <= 180) hbp = (h1p + h2p) / 2;
    else hbp = h1p + h2p < 360 ? (h1p + h2p + 360) / 2 : (h1p + h2p - 360) / 2;
    const T = 1 - 0.17 * Math.cos((hbp - 30) * rad) + 0.24 * Math.cos(2 * hbp * rad)
      + 0.32 * Math.cos((3 * hbp + 6) * rad) - 0.2 * Math.cos((4 * hbp - 63) * rad);
    const dTheta = 30 * Math.exp(-Math.pow((hbp - 275) / 25, 2));
    const Cbp7 = Math.pow(Cbp, 7);
    const Rc = 2 * Math.sqrt(Cbp7 / (Cbp7 + p7));
    const Sl = 1 + (0.015 * Math.pow(Lbp - 50, 2)) / Math.sqrt(20 + Math.pow(Lbp - 50, 2));
    const Sc = 1 + 0.045 * Cbp, Sh = 1 + 0.015 * Cbp * T;
    const Rt = -Math.sin(2 * dTheta * rad) * Rc;
    return Math.sqrt((dLp / Sl) ** 2 + (dCp / Sc) ** 2 + (dHp / Sh) ** 2 + Rt * (dCp / Sc) * (dHp / Sh));
  }

  const labOf = (c) => rgbToLab(hsvToRgb(c.h, c.s, c.v));
  // 10 = idêntico; ~8 = ΔE 5 (bem perto); ~5 = ΔE 10; ~1,4 = ΔE 20.
  const scoreFor = (dE) => 10 * Math.exp(-Math.pow(dE / 13, 1.6));
  const inkFor = (c) => (labOf(c)[0] > 62 ? '#111' : '#fff');

  function verdict(score) {
    if (score >= 9.5) return 'Perfeito! Olho de águia 🦅';
    if (score >= 8.5) return 'Excelente!';
    if (score >= 7) return 'Muito bom';
    if (score >= 5) return 'Bom, mas dá pra melhorar';
    if (score >= 3) return 'Hmm… passou longe';
    return 'Era outra cor 😅';
  }
  const square = (score) => (score >= 9 ? '🟩' : score >= 7 ? '🟨' : score >= 5 ? '🟧' : '🟥');

  /* ================= Aleatoriedade ================= */
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
  // Evita alvos muito escuros ou acinzentados, onde a tarefa vira só "adivinhar o cinza".
  const randomTarget = (rnd) => ({
    h: Math.floor(rnd() * 360),
    s: Math.round(30 + rnd() * 70),
    v: Math.round(35 + rnd() * 65),
  });

  function todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  const todayLabel = () => new Date().toLocaleDateString('pt-BR');
  const fmt = (n) => n.toFixed(2);

  /* ================= Telas ================= */
  let current = 'home';
  function show(id) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === 's-' + id));
    current = id;
    // No menu do jogo: link para a Jogateca. Em qualquer outra tela: botão para voltar ao menu do jogo.
    document.getElementById('backLink').hidden = id !== 'home';
    document.getElementById('menuBack').hidden = id === 'home';
    if (!['show', 'pick', 'result'].includes(id)) setInk('#fff');
    $('#barRight').textContent = '';
    window.scrollTo(0, 0);
  }
  function setInk(color) { document.documentElement.style.setProperty('--ink', color); }
  function setScreenColor(el, c) {
    el.style.backgroundColor = css(c);
    setInk(inkFor(c));
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
      try { document.execCommand('copy'); toast('Resultado copiado!'); } catch { prompt('Copie o resultado:', text); }
      ta.remove();
    }
  }

  /* ================= Menu ================= */
  function renderHome() {
    const memBest = Math.max(...Object.keys(DIFFS).map((d) => store.get(`best:memoria:${d}`, 0)));
    document.querySelector('[data-best="memoria"]').textContent = memBest > 0 ? `Recorde: ${fmt(memBest)} / 50` : '';
    const daily = store.get('daily:' + todayKey());
    document.querySelector('[data-best="diario"]').textContent = daily ? `Hoje: ${fmt(daily.total)} / 50 — volte amanhã` : 'Desafio de hoje disponível';
    const oddBest = store.get('best:olho', 0);
    document.querySelector('[data-best="olho"]').textContent = oddBest > 0 ? `Recorde: nível ${oddBest}` : '';

    // Arte decorativa (não revela as cores do dia).
    const deco = ['#e76f51', '#f4a261', '#e9c46a', '#2a9d8f', '#8ab17d'];
    $('#dailyArt').innerHTML = deco.map((c) => `<i style="background:${c}"></i>`).join('');
    const olho = document.querySelector('#s-home .art-olho');
    if (!olho.children.length) olho.innerHTML = Array.from({ length: 32 }, (_, i) => `<i${i === 21 ? ' class="odd"' : ''}></i>`).join('');
    show('home');
  }

  document.addEventListener('click', (e) => {
    const go = e.target.closest('[data-go]');
    if (go) startMode(go.dataset.go);
  });
  // Sair no meio de uma partida perde o progresso dela: pede um segundo toque para confirmar.
  let leaveAsk = 0;
  function leaveToMenu() {
    const busy = (game && ['show', 'pick', 'result'].includes(current)) || (odd && current === 'odd');
    if (busy && Date.now() - leaveAsk > 3500) {
      leaveAsk = Date.now();
      toast('Toque de novo em Menu para sair. A partida atual será perdida.');
      return;
    }
    leaveAsk = 0;
    stopAll();
    renderHome();
  }
  $('#homeBtn').addEventListener('click', leaveToMenu);
  $('#menuBack').addEventListener('click', leaveToMenu);

  function startMode(mode) {
    stopAll();
    if (mode === 'memoria') openMemIntro();
    else if (mode === 'diario') startDaily();
    else if (mode === 'olho') openOddIntro();
    else renderHome();
  }

  /* ================= Memória / Diário ================= */
  let game = null; // { kind, diff, targets, rounds, i }
  let showTimer = null, showTick = null;
  let diff = store.get('diff', 'normal');
  if (!DIFFS[diff]) diff = 'normal';

  function openMemIntro() {
    updateDiffSeg();
    show('mem-intro');
  }
  function updateDiffSeg() {
    document.querySelectorAll('#diffSeg button').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.diff === diff)));
    const best = store.get(`best:memoria:${diff}`, 0);
    $('#diffBest').textContent = best > 0 ? `Seu recorde no ${DIFFS[diff].label}: ${fmt(best)} / 50` : '';
  }
  $('#diffSeg').addEventListener('click', (e) => {
    const b = e.target.closest('[data-diff]');
    if (!b) return;
    diff = b.dataset.diff; store.set('diff', diff); updateDiffSeg();
  });
  $('#memStart').addEventListener('click', () => {
    const targets = Array.from({ length: ROUNDS }, () => randomTarget(Math.random));
    game = { kind: 'memoria', diff, targets, rounds: [], i: 0 };
    showTarget();
  });

  function startDaily() {
    const saved = store.get('daily:' + todayKey());
    if (saved) {
      game = { kind: 'diario', diff: 'normal', targets: saved.rounds.map((r) => r.target), rounds: saved.rounds, i: ROUNDS };
      renderEnd(true);
      return;
    }
    const rnd = mulberry32(hashStr('croma-diario-' + todayKey()));
    const targets = Array.from({ length: ROUNDS }, () => randomTarget(rnd));
    game = { kind: 'diario', diff: 'normal', targets, rounds: [], i: 0, date: todayKey() };
    showTarget();
  }

  function roundLabel() { return `${game.kind === 'diario' ? 'Diário · ' : ''}Rodada ${game.i + 1}/${ROUNDS}`; }

  function showTarget() {
    const target = game.targets[game.i];
    const el = $('#s-show');
    show('show');
    setScreenColor(el, target);
    $('#showRound').textContent = roundLabel();
    const ms = DIFFS[game.diff].ms;
    const bar = $('#countBar');
    bar.style.transition = 'none';
    bar.style.transform = 'scaleX(1)';
    void bar.offsetWidth; // reinicia a animação
    bar.style.transition = `transform ${ms}ms linear`;
    bar.style.transform = 'scaleX(0)';

    const end = performance.now() + ms;
    const tick = () => {
      const left = Math.max(0, end - performance.now());
      $('#showNum').textContent = ms >= 2500 ? Math.ceil(left / 1000) : (left / 1000).toFixed(1);
    };
    tick();
    showTick = setInterval(tick, 100);
    showTimer = setTimeout(() => { clearInterval(showTick); openPicker(); }, ms);
  }

  /* ---------- Seletor ---------- */
  const ih = $('#ih'), is = $('#is'), iv = $('#iv');
  function pickerColor() { return { h: +ih.value, s: +is.value, v: +iv.value }; }

  function updatePicker() {
    const c = pickerColor();
    setScreenColor($('#s-pick'), c);
    $('#oh').textContent = c.h + '°';
    $('#os').textContent = c.s + '%';
    $('#ov').textContent = c.v + '%';
    const hueStops = [0, 60, 120, 180, 240, 300, 360].map((h) => css({ h: h % 360, s: Math.max(c.s, 15), v: Math.max(c.v, 25) }));
    ih.style.setProperty('--track', `linear-gradient(90deg, ${hueStops.join(',')})`);
    const satStops = [0, 25, 50, 75, 100].map((s) => css({ h: c.h, s, v: c.v }));
    is.style.setProperty('--track', `linear-gradient(90deg, ${satStops.join(',')})`);
    const valStops = [0, 25, 50, 75, 100].map((v) => css({ h: c.h, s: c.s, v }));
    iv.style.setProperty('--track', `linear-gradient(90deg, ${valStops.join(',')})`);
  }
  [ih, is, iv].forEach((el) => el.addEventListener('input', updatePicker));

  function openPicker() {
    // Começa de um ponto aleatório para não favorecer nenhuma cor.
    ih.value = Math.floor(Math.random() * 360);
    is.value = 50;
    iv.value = 50;
    show('pick');
    $('#pickRound').textContent = roundLabel();
    updatePicker();
    ih.focus({ preventScroll: true });
  }

  $('#pickOk').addEventListener('click', submitGuess);

  function submitGuess() {
    const target = game.targets[game.i];
    const guess = pickerColor();
    const dE = deltaE2000(labOf(target), labOf(guess));
    const score = Math.round(scoreFor(dE) * 100) / 100;
    game.rounds.push({ target, guess, dE: Math.round(dE * 10) / 10, score });
    renderRoundResult();
  }

  function hueDiff(a, b) { let d = b - a; if (d > 180) d -= 360; if (d < -180) d += 360; return d; }
  const signed = (n, unit = '') => (n > 0 ? '+' : n < 0 ? '−' : '±') + Math.abs(n) + unit;

  function renderRoundResult() {
    const r = game.rounds[game.rounds.length - 1];
    show('result');
    const t = $('#rTarget'), y = $('#rYours');
    t.style.backgroundColor = css(r.target); t.style.color = inkFor(r.target);
    y.style.backgroundColor = css(r.guess); y.style.color = inkFor(r.guess);
    t.querySelector('code').textContent = `${css(r.target)} · H${r.target.h} S${r.target.s} B${r.target.v}`;
    y.querySelector('code').textContent = `${css(r.guess)} · H${r.guess.h} S${r.guess.s} B${r.guess.v}`;
    setInk(inkFor(r.target));
    $('#barRight').textContent = `${fmt(game.rounds.reduce((a, x) => a + x.score, 0))} pts`;

    $('#rVerdict').textContent = verdict(r.score);
    $('#rDiffs').innerHTML = `
      <div>Matiz<b>${signed(hueDiff(r.target.h, r.guess.h), '°')}</b></div>
      <div>Saturação<b>${signed(r.guess.s - r.target.s)}</b></div>
      <div>Brilho<b>${signed(r.guess.v - r.target.v)}</b></div>`;
    $('#rNext').textContent = game.rounds.length >= ROUNDS ? 'Ver resultado' : 'Próxima';

    // Contagem animada da nota.
    const el = $('#rScore');
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const start = performance.now(), dur = reduce ? 0 : 700;
    const step = (now) => {
      const p = dur ? Math.min(1, (now - start) / dur) : 1;
      el.innerHTML = `${fmt(r.score * (1 - Math.pow(1 - p, 3)))}<small>/10</small>`;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    $('#rNext').focus({ preventScroll: true });
  }

  $('#rNext').addEventListener('click', () => {
    game.i += 1;
    if (game.i >= ROUNDS) finishGame(); else showTarget();
  });

  function finishGame() {
    const total = game.rounds.reduce((a, r) => a + r.score, 0);
    if (game.kind === 'diario') {
      store.set('daily:' + game.date, { total, rounds: game.rounds });
    } else {
      const key = `best:memoria:${game.diff}`;
      game.prevBest = store.get(key, 0);
      if (total > game.prevBest) store.set(key, total);
    }
    renderEnd(false);
  }

  function renderEnd(fromSave) {
    const total = game.rounds.reduce((a, r) => a + r.score, 0);
    show('end');
    $('#endEyebrow').textContent = game.kind === 'diario'
      ? `Desafio Diário · ${todayLabel()}`
      : `Memória · ${DIFFS[game.diff].label}`;
    $('#endTotal').innerHTML = `${fmt(total)}<small> / 50</small>`;

    let sub = '';
    if (game.kind === 'diario') sub = fromSave ? 'Você já jogou o desafio de hoje.' : 'Mesmas cores para todo mundo hoje. Compare com os amigos!';
    else if (total > (game.prevBest || 0)) sub = game.prevBest ? `Novo recorde! Antes: ${fmt(game.prevBest)}` : 'Primeiro recorde registrado!';
    else sub = `Seu recorde: ${fmt(game.prevBest)}`;
    $('#endSub').textContent = sub;

    $('#endStrip').innerHTML = game.rounds.map((r, i) => `
      <div class="round">
        <span>${i + 1}</span>
        <span class="sw" style="background:${css(r.target)}" title="Alvo ${css(r.target)}"></span>
        <span class="sw" style="background:${css(r.guess)}" title="Sua ${css(r.guess)}"></span>
        <b>${fmt(r.score)}</b>
      </div>`).join('');

    $('#endAgain').hidden = game.kind === 'diario';
    $('#endNext').textContent = game.kind === 'diario' ? 'Um novo desafio aparece à meia-noite.' : '';
  }

  $('#endShare').addEventListener('click', () => {
    const total = game.rounds.reduce((a, r) => a + r.score, 0);
    const head = game.kind === 'diario'
      ? `Croma · Diário ${todayLabel()}`
      : `Croma · Memória (${DIFFS[game.diff].label})`;
    const text = `${head}\n🎨 ${fmt(total)}/50\n${game.rounds.map((r) => square(r.score)).join('')}\n${location.origin}${location.pathname}`;
    share(text);
  });
  $('#endAgain').addEventListener('click', () => openMemIntro());
  $('#endHome').addEventListener('click', renderHome);

  /* ================= Olho Clínico ================= */
  let odd = null; // { level, endAt, raf, oddIndex, base, other }

  function openOddIntro() {
    const best = store.get('best:olho', 0);
    $('#oddBestIntro').textContent = best > 0 ? `Seu recorde: nível ${best}` : '';
    show('odd-intro');
  }
  $('#oddStart').addEventListener('click', startOdd);

  function startOdd() {
    odd = { level: 1, endAt: performance.now() + ODD_SECONDS * 1000, raf: 0, last: null };
    show('odd');
    nextOddLevel();
    const loop = () => {
      const left = Math.max(0, odd.endAt - performance.now());
      $('#oddTime').textContent = Math.ceil(left / 1000);
      const bar = $('#oddTimeBar');
      bar.style.transform = `scaleX(${left / (ODD_SECONDS * 1000)})`;
      bar.classList.toggle('low', left < 10000);
      if (left <= 0) { endOdd(); return; }
      odd.raf = requestAnimationFrame(loop);
    };
    odd.raf = requestAnimationFrame(loop);
  }

  function gridSize(level) { return Math.min(8, 2 + Math.floor((level - 1) / 3)); }
  function oddDelta(level) { return Math.max(1.2, 20 * Math.pow(0.88, level - 1)); }

  function nextOddLevel() {
    const n = gridSize(odd.level);
    const base = { h: Math.floor(Math.random() * 360), s: Math.round(40 + Math.random() * 50), v: Math.round(45 + Math.random() * 45) };
    const d = oddDelta(odd.level);
    let sign = Math.random() < 0.5 ? -1 : 1;
    if (base.v + sign * d > 100 || base.v + sign * d < 10) sign = -sign;
    const other = { ...base, v: base.v + sign * d };
    if (css(other) === css(base)) other.v = base.v + sign * 2; // garante que exista diferença real
    odd.base = base; odd.other = other;
    odd.oddIndex = Math.floor(Math.random() * n * n);

    const grid = $('#oddGrid');
    grid.style.gridTemplateColumns = `repeat(${n}, 1fr)`;
    grid.style.gap = n >= 7 ? '4px' : '6px';
    const baseCss = css(base), otherCss = css(other);
    grid.innerHTML = Array.from({ length: n * n }, (_, i) =>
      `<button class="tile" data-i="${i}" style="background:${i === odd.oddIndex ? otherCss : baseCss}" aria-label="Quadrado ${i + 1}"></button>`).join('');
    $('#oddLevel').textContent = odd.level;
  }

  $('#oddGrid').addEventListener('click', (e) => {
    const tile = e.target.closest('.tile');
    if (!tile || !odd || current !== 'odd') return;
    if (+tile.dataset.i === odd.oddIndex) {
      odd.last = { base: odd.base, other: odd.other, level: odd.level };
      odd.level += 1;
      const grid = $('#oddGrid');
      grid.classList.remove('flash'); void grid.offsetWidth; grid.classList.add('flash');
      nextOddLevel();
    } else {
      odd.endAt -= ODD_PENALTY * 1000;
      tile.classList.remove('wrong'); void tile.offsetWidth; tile.classList.add('wrong');
      const t = $('#oddTime');
      t.classList.add('penalty'); setTimeout(() => t.classList.remove('penalty'), 400);
    }
  });

  function endOdd() {
    cancelAnimationFrame(odd.raf);
    // Mostra onde estava o diferente antes de sair.
    const tile = document.querySelector(`#oddGrid .tile[data-i="${odd.oddIndex}"]`);
    if (tile) tile.classList.add('found');
    const reached = odd.level - 1;
    const prev = store.get('best:olho', 0);
    if (reached > prev) store.set('best:olho', reached);
    const final = { reached, prev, base: odd.base, other: odd.other };
    odd = null;
    setTimeout(() => renderOddEnd(final), 900);
  }

  function renderOddEnd(f) {
    show('odd-end');
    $('#oddEndLevel').innerHTML = `${f.reached}<small> níveis</small>`;
    $('#oddEndSub').textContent = f.reached > f.prev
      ? (f.prev ? `Novo recorde! Antes: ${f.prev}` : 'Primeiro recorde registrado!')
      : `Seu recorde: ${f.prev}`;
    $('#oddReveal').innerHTML = `
      <div style="background:${css(f.base)};color:${inkFor(f.base)}">comum</div>
      <div style="background:${css(f.other)};color:${inkFor(f.other)}">diferente</div>`;
    $('#oddShare').onclick = () => share(
      `Croma · Olho Clínico\n👁️ Nível ${f.reached} em ${ODD_SECONDS}s\n${'🟪'.repeat(Math.min(10, Math.ceil(f.reached / 3)))}\n${location.origin}${location.pathname}`,
    );
  }
  $('#oddAgain').addEventListener('click', startOdd);
  $('#oddHome').addEventListener('click', renderHome);

  /* ================= Geral ================= */
  function stopAll() {
    clearTimeout(showTimer); clearInterval(showTick);
    if (odd) { cancelAnimationFrame(odd.raf); odd = null; }
  }

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || e.repeat) return;
    if (current === 'pick') { e.preventDefault(); submitGuess(); }
    else if (current === 'result' && document.activeElement !== $('#rNext')) { e.preventDefault(); $('#rNext').click(); }
  });

  // Início: ?mode=memoria|diario|olho abre direto o modo.
  const mode = new URLSearchParams(location.search).get('mode');
  renderHome();
  if (mode) startMode(mode);
})();
