(() => {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const E = window.ContasEngine;
  const LEVELS = { facil: 'Fácil', normal: 'Normal', dificil: 'Difícil' };
  const TIMES = [60, 90];

  const store = {
    get(k, d = null) { try { const v = localStorage.getItem('contas:' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem('contas:' + k, JSON.stringify(v)); } catch { /* sem armazenamento */ } },
  };
  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const plural = (k, one, many) => `${k} ${k === 1 ? one : many}`;
  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
  }

  /* ================= Telas e opções ================= */
  let current = 'home';
  function show(id) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === 's-' + id));
    current = id;
    $('#backLink').hidden = id !== 'home';
    $('#menuBack').hidden = id === 'home';
    window.scrollTo(0, 0);
  }
  let level = store.get('level', 'normal'), time = store.get('time', 60);
  const cfgKey = () => `${level}-${time}`;
  function renderHome() {
    stopClock();
    $('#optLevel').innerHTML = Object.entries(LEVELS).map(([id, l]) => `<button class="chip${id === level ? ' on' : ''}" data-level="${id}">${l}</button>`).join('');
    $('#optTime').innerHTML = TIMES.map((t) => `<button class="chip${t === time ? ' on' : ''}" data-time="${t}">${t} s</button>`).join('');
    const best = store.get('best:' + cfgKey());
    $('#soloInfo').textContent = best ? `Recorde neste nível e tempo: ${best} pontos.` : 'Bata o seu próprio recorde.';
    show('home');
  }
  $('#optLevel').addEventListener('click', (e) => { const b = e.target.closest('[data-level]'); if (b) { level = b.dataset.level; store.set('level', level); renderHome(); } });
  $('#optTime').addEventListener('click', (e) => { const b = e.target.closest('[data-time]'); if (b) { time = +b.dataset.time; store.set('time', time); renderHome(); } });
  let leaveArm = 0;
  const toMenu = () => {
    if (round && !round.over && Date.now() - leaveArm > 3000) { leaveArm = Date.now(); toast('A rodada está valendo. Toque de novo para sair.'); return; }
    round = null; renderHome();
  };
  $('#homeBtn').addEventListener('click', toMenu);
  $('#menuBack').addEventListener('click', toMenu);
  $('#endMenu').addEventListener('click', renderHome);

  /* ================= Rodada ================= */
  // round: { seq, i, typed, score, streak, best, right, wrong, skipped, ends, over, onEnd }
  let round = null;
  function play(seed, who, onEnd) {
    round = { seq: E.sequence(seed, level), i: 0, typed: '', score: 0, streak: 0, best: 0, right: 0, wrong: 0, skipped: 0, ends: performance.now() + time * 1000, over: false, onEnd };
    show('play');
    $('#who').textContent = who || 'Sozinho';
    buildPad();
    render();
    startClock();
  }
  function buildPad() {
    $('#pad').innerHTML = ['7', '8', '9', '4', '5', '6', '1', '2', '3', 'skip', '0', 'del'].map((k) =>
      k === 'skip' ? '<button class="k-skip" data-k="skip">Pular</button>'
        : k === 'del' ? '<button class="k-del" data-k="del" aria-label="Apagar">⌫</button>'
          : `<button data-k="${k}">${k}</button>`).join('');
  }
  function render() {
    const p = round.seq[round.i];
    $('#q').textContent = `${p.a} ${p.op} ${p.b}`;
    const a = $('#a');
    a.textContent = round.typed;
    a.classList.toggle('empty', !round.typed);
    $('#score').textContent = round.score;
    $('#streak').textContent = round.streak >= 2 ? `${'🔥'.repeat(Math.min(3, Math.floor(round.streak / 3) + 1))} ${round.streak} seguidas` : '';
  }
  function flash(cls) {
    const led = $('#led');
    led.classList.remove('ok', 'bad'); void led.offsetWidth; led.classList.add(cls);
    setTimeout(() => led.classList.remove(cls), 260);
  }
  function popPoints(n) {
    const el = document.createElement('span');
    el.className = 'pop'; el.textContent = `+${n}`;
    $('#led').appendChild(el);
    setTimeout(() => el.remove(), 700);
  }
  function key(k) {
    if (!round || round.over) return;
    const p = round.seq[round.i];
    if (k === 'del') { round.typed = round.typed.slice(0, -1); render(); return; }
    if (k === 'skip') { round.streak = 0; round.skipped++; next(); return; }
    if (round.typed.length >= 6) return;
    round.typed += k;
    const want = String(p.ans);
    if (round.typed.length < want.length) { render(); return; }
    if (round.typed === want) {
      round.streak++; round.right++;
      round.best = Math.max(round.best, round.streak);
      const pts = E.points(round.streak);
      round.score += pts;
      flash('ok'); popPoints(pts);
    } else {
      round.streak = 0; round.wrong++;
      flash('bad');
      toast(`${p.a} ${p.op} ${p.b} = ${p.ans}`);
    }
    next();
  }
  function next() {
    round.i++;
    round.typed = '';
    if (round.i >= round.seq.length) { endRound(); return; }
    render();
  }
  $('#pad').addEventListener('pointerdown', (e) => {
    const b = e.target.closest('[data-k]');
    if (!b) return;
    e.preventDefault();
    key(b.dataset.k);
  });
  document.addEventListener('keydown', (e) => {
    if (current !== 'play' || !round || round.over || e.ctrlKey || e.metaKey || e.altKey) return;
    if (/^[0-9]$/.test(e.key)) key(e.key);
    else if (e.key === 'Backspace') { e.preventDefault(); key('del'); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); key('skip'); }
  });

  let tickId = null;
  function startClock() {
    stopClock();
    const step = () => {
      if (!round || round.over) return;
      const left = Math.max(0, (round.ends - performance.now()) / 1000);
      const el = $('#clock');
      el.textContent = fmt(Math.ceil(left));
      el.classList.toggle('low', left <= 10);
      if (left <= 0) endRound();
    };
    step();
    tickId = setInterval(step, 200);
  }
  function stopClock() { if (tickId) clearInterval(tickId); tickId = null; }
  function endRound() {
    if (!round || round.over) return;
    round.over = true;
    stopClock();
    const r = round;
    setTimeout(() => r.onEnd(r), 300);
  }
  const accuracy = (r) => (r.right + r.wrong ? Math.round((r.right / (r.right + r.wrong)) * 100) : 0);

  /* ================= Sozinho ================= */
  function solo() {
    play((Math.random() * 2 ** 31) | 0, '', (r) => {
      const key = 'best:' + cfgKey();
      const best = store.get(key, 0);
      if (r.score > best) store.set(key, r.score);
      show('end');
      $('#endScore').textContent = r.score;
      $('#endSub').textContent = r.score > best ? (best ? `Novo recorde! Antes: ${best}.` : 'Primeiro recorde!') : `Recorde: ${best}.`;
      $('#endStats').innerHTML = `<div><b>${r.right}</b><span>acertos</span></div><div><b>${accuracy(r)}%</b><span>de precisão</span></div><div><b>${r.best}</b><span>maior sequência</span></div>`;
      $('#againBtn').onclick = solo;
    });
  }
  $('#soloBtn').addEventListener('click', solo);

  /* ================= Duelo ================= */
  const D = window.Duelo;
  let duel = null;
  function duelSetup() {
    show('duel');
    D.setup({
      el: $('#duel'), game: 'contas', title: 'Duelo de Contas',
      text: `Todo mundo recebe as mesmas contas (${LEVELS[level]}, ${time} s cada um). O placar só aparece no fim.`,
      onStart: (names) => startDuel(names),
      onBack: renderHome,
    });
  }
  function startDuel(names) {
    duel = { names, seed: (Math.random() * 2 ** 31) | 0, i: 0, results: [] };
    nextTurn();
  }
  function nextTurn() {
    show('duel');
    D.handoff({
      el: $('#duel'), name: duel.names[duel.i], index: duel.i, total: duel.names.length,
      info: `Nível ${LEVELS[level]} · ${time} segundos.`,
      onGo: () => play(duel.seed, duel.names[duel.i], (r) => {
        duel.results.push({ name: duel.names[duel.i], score: r.score, detail: `${plural(r.right, 'acerto', 'acertos')} · ${accuracy(r)}% de precisão · maior sequência ${r.best}` });
        duel.i++;
        if (duel.i < duel.names.length) nextTurn();
        else {
          show('duel');
          D.results({ el: $('#duel'), game: 'contas', players: duel.results, unit: 'pontos', onRematch: () => startDuel(duel.names), onNew: duelSetup, onMenu: renderHome });
        }
      }),
    });
  }
  $('#duelBtn').addEventListener('click', duelSetup);

  /* ================= Início ================= */
  renderHome();
  const mode = new URLSearchParams(location.search).get('mode');
  if (mode === 'solo') solo();
  else if (mode === 'duelo') duelSetup();
})();
