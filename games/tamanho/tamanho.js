(() => {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const LIVES = 3;
  const COLORS = { a: '#5ab0ff', b: '#ffcf3f', ok: '#46d369', ink: '#e6edf5' };
  const TYPE_NAMES = { match: 'Igualar', fraction: 'Fração', ratio: 'Quantas vezes?', memory: 'Memória' };

  /* ================= Utilidades ================= */
  const store = {
    get(k, d = null) {
      try { const v = localStorage.getItem('tamanho:' + k); return v == null ? d : JSON.parse(v); }
      catch { return d; }
    },
    set(k, v) { try { localStorage.setItem('tamanho:' + k, JSON.stringify(v)); } catch { /* sem armazenamento */ } },
  };
  const rand = (a, b) => a + Math.random() * (b - a);
  const randi = (a, b) => Math.floor(rand(a, b + 1));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const fmt1 = (n) => n.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const fmtInt = (n) => Math.round(n).toLocaleString('pt-BR');

  /* ================= Figuras ================= */
  const SHAPES = {
    square: { name: 'quadrado', area: (s) => s * s },
    circle: { name: 'círculo', area: (s) => (Math.PI * s * s) / 4 },
    triangle: { name: 'triângulo', area: (s) => (Math.sqrt(3) / 4) * s * s },
  };
  const KINDS = Object.keys(SHAPES);

  // s = lado (quadrado, triângulo equilátero) ou diâmetro (círculo).
  function shapeSvg(kind, cx, cy, s, rot, { fill = 'none', stroke = 'none', dash = false, width = 3, opacity = 1 } = {}) {
    const a = `fill="${fill}" stroke="${stroke}" stroke-width="${width}"${dash ? ' stroke-dasharray="7 6"' : ''} opacity="${opacity}" transform="rotate(${rot.toFixed(2)} ${cx} ${cy})" stroke-linejoin="round"`;
    if (kind === 'square') return `<rect x="${(cx - s / 2).toFixed(2)}" y="${(cy - s / 2).toFixed(2)}" width="${s.toFixed(2)}" height="${s.toFixed(2)}" rx="2" ${a}/>`;
    if (kind === 'circle') return `<circle cx="${cx}" cy="${cy}" r="${(s / 2).toFixed(2)}" ${a}/>`;
    const h = (s * Math.sqrt(3)) / 2;
    // centralizado no meio da altura, para caber no espaço de forma previsível
    const top = cy - h / 2, base = cy + h / 2;
    return `<polygon points="${cx},${top.toFixed(2)} ${(cx - s / 2).toFixed(2)},${base.toFixed(2)} ${(cx + s / 2).toFixed(2)},${base.toFixed(2)}" ${a}/>`;
  }
  // Maior tamanho que cabe numa caixa w×h com a rotação dada.
  function fitSize(kind, rot, w, h) {
    const m = Math.min(w, h);
    if (kind === 'circle') return m;
    if (kind === 'square') {
      const r = (Math.abs(rot) * Math.PI) / 180;
      return m / (Math.abs(Math.cos(r)) + Math.abs(Math.sin(r)));
    }
    return rot ? m * 0.85 : Math.min(w, h / 0.866);
  }
  const label = (x, y, text, color) =>
    `<text x="${x}" y="${y}" text-anchor="middle" font-size="18" fill="${color}">${text}</text>`;

  /* ================= Desafios =================
     Cada desafio devolve:
       prompt, lo/hi/scale (como o controle vira valor), target,
       err(g) → erro (0 = perfeito), tol (erro máximo aceito), tolLabel(tol),
       render(g, reveal, phase) → SVG, detail(g) → texto do resultado,
       readout(g, reveal) opcional, showMs/showPrompt opcional (fase de memorizar). */

  function makeMatch(level) {
    const variants = ['same'];
    if (level >= 4) variants.push('half', 'double');
    if (level >= 7) variants.push('rot');
    if (level >= 9) variants.push('cross');
    const v = pick(variants);
    const kindA = pick(KINDS);
    const kindB = v === 'cross' ? pick(KINDS.filter((k) => k !== kindA)) : kindA;
    const rotB = v === 'rot' ? pick([-1, 1]) * randi(18, 40) : 0;
    const maxA = fitSize(kindA, 0, 170, 190);
    const maxB = fitSize(kindB, rotB, 185, 200);
    const areaMode = v === 'double' || v === 'cross';

    const targetFor = (sA) => {
      if (v === 'half') return sA / 2;
      const want = SHAPES[kindA].area(sA) * (v === 'double' ? 2 : 1);
      return Math.sqrt(want / SHAPES[kindB].area(1));
    };
    let sA = v === 'half' ? rand(90, Math.min(160, maxA)) : rand(50, Math.min(115, maxA));
    let t = targetFor(sA);
    if (t > maxB * 0.75) { sA *= (maxB * 0.75) / t; t = targetFor(sA); }
    const lo = t * rand(0.35, 0.6);
    const hi = Math.max(t * 1.2, Math.min(maxB, t * rand(1.45, 1.9)));

    const nameA = SHAPES[kindA].name, nameB = SHAPES[kindB].name;
    const prompts = {
      same: 'Deixe <b class="b">B</b> do mesmo tamanho que <b class="a">A</b>.',
      rot: 'Deixe <b class="b">B</b> do mesmo tamanho que <b class="a">A</b>. Cuidado: B está girado.',
      half: 'Deixe <b class="b">B</b> com <u>metade da largura</u> de <b class="a">A</b>.',
      double: 'Deixe a <u>área</u> de <b class="b">B</b> igual ao <u>dobro</u> da área de <b class="a">A</b>.',
      cross: `Deixe o ${nameB} <b class="b">B</b> com a <u>mesma área</u> do ${nameA} <b class="a">A</b>.`,
    };
    const q = (g) => (areaMode ? (g / t) ** 2 : g / t); // razão medida (1 = perfeito)

    return {
      type: 'match', lo, hi, scale: 'lin', target: t,
      prompt: prompts[v],
      tol: areaMode ? 0.2 : 0.1,
      tolLabel: (tol) => `Margem de acerto: ±${fmt1(tol * 100)}% ${areaMode ? 'na área' : 'no tamanho'}`,
      err: (g) => Math.abs(q(g) - 1),
      render(g, reveal) {
        let out = shapeSvg(kindA, 100, 120, sA, 0, { fill: COLORS.a, opacity: 0.92 });
        out += shapeSvg(kindB, 300, 120, g, rotB, { fill: COLORS.b, opacity: 0.92 });
        if (reveal) out += shapeSvg(kindB, 300, 120, t, rotB, { stroke: COLORS.ok, dash: true, width: 3 });
        out += label(100, 248, 'A', COLORS.a) + label(300, 248, 'B', COLORS.b);
        return out;
      },
      detail(g) {
        const d = (q(g) - 1) * 100;
        const what = areaMode ? ' em área' : '';
        if (Math.abs(d) < 0.5) return 'Praticamente exato.';
        return `B ficou ${fmt1(Math.abs(d))}% ${d > 0 ? 'maior' : 'menor'}${what} do que deveria. O contorno verde mostra o tamanho certo.`;
      },
    };
  }

  function makeFraction(level) {
    const vertical = level >= 3 && Math.random() < 0.5;
    let t;
    do { t = randi(4, 96) / 100; } while (Math.abs(t - 0.5) < 0.04 || (level < 3 && Math.abs(t - 0.25) < 0.02) || (level < 3 && Math.abs(t - 0.75) < 0.02));
    // Mapeamento com folga nas pontas: a posição do controle não revela a resposta.
    const lo = rand(-0.14, -0.02), hi = rand(1.02, 1.14);
    let geo;
    if (vertical) {
      const H = rand(150, 215), x = rand(150, 250), bottom = 236;
      geo = { x, y: bottom - H, w: 34, h: H };
    } else {
      const L = rand(220, 360), x = rand(20, 380 - L);
      geo = { x, y: 110, w: L, h: 34 };
    }
    const g2 = (g) => clamp(g, 0, 1);

    return {
      type: 'fraction', lo, hi, scale: 'lin', target: t,
      prompt: `Marque <b class="b">${Math.round(t * 100)}%</b> da barra, contando ${vertical ? 'de baixo para cima' : 'da esquerda para a direita'}.`,
      tol: 0.06,
      tolLabel: (tol) => `Margem de acerto: ±${fmt1(tol * 100)} pontos percentuais`,
      err: (g) => Math.abs(g2(g) - t),
      render(g, reveal) {
        const f = g2(g);
        const { x, y, w, h } = geo;
        let out = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="rgba(90,176,255,.12)" stroke="${COLORS.a}" stroke-width="2"/>`;
        if (vertical) {
          const my = y + h * (1 - f);
          out += `<rect x="${x}" y="${my}" width="${w}" height="${y + h - my}" rx="4" fill="${COLORS.a}" opacity=".55"/>`;
          out += `<line x1="${x - 16}" x2="${x + w + 16}" y1="${my}" y2="${my}" stroke="${COLORS.b}" stroke-width="4" stroke-linecap="round"/>`;
          out += `<polygon points="${x - 18},${my - 8} ${x - 18},${my + 8} ${x - 6},${my}" fill="${COLORS.b}"/>`;
          if (reveal) {
            const ty = y + h * (1 - t);
            out += `<line x1="${x - 22}" x2="${x + w + 22}" y1="${ty}" y2="${ty}" stroke="${COLORS.ok}" stroke-width="3" stroke-dasharray="6 5"/>`;
            out += `<text x="${x + w + 28}" y="${ty + 5}" font-size="14" fill="${COLORS.ok}">${Math.round(t * 100)}%</text>`;
          }
        } else {
          const mx = x + w * f;
          out += `<rect x="${x}" y="${y}" width="${mx - x}" height="${h}" rx="4" fill="${COLORS.a}" opacity=".55"/>`;
          out += `<line x1="${mx}" x2="${mx}" y1="${y - 16}" y2="${y + h + 16}" stroke="${COLORS.b}" stroke-width="4" stroke-linecap="round"/>`;
          out += `<polygon points="${mx - 8},${y - 20} ${mx + 8},${y - 20} ${mx},${y - 8}" fill="${COLORS.b}"/>`;
          if (reveal) {
            const tx = x + w * t;
            out += `<line x1="${tx}" x2="${tx}" y1="${y - 26}" y2="${y + h + 26}" stroke="${COLORS.ok}" stroke-width="3" stroke-dasharray="6 5"/>`;
            out += `<text x="${tx}" y="${y + h + 46}" text-anchor="middle" font-size="14" fill="${COLORS.ok}">${Math.round(t * 100)}%</text>`;
          }
        }
        return out;
      },
      detail(g) {
        const f = g2(g);
        return `Você marcou ${fmt1(f * 100)}%. Diferença de ${fmt1(Math.abs(f - t) * 100)} pontos.`;
      },
    };
  }

  function makeRatio(level) {
    const area = level >= 4 && Math.random() < 0.7;
    const kind = pick(KINDS);
    const t = Math.round((area ? rand(1.6, 8) : rand(1.3, 4)) * 10) / 10;
    const linear = area ? Math.sqrt(t) : t;
    const maxB = fitSize(kind, 0, 210, 200);
    const sA = Math.min(rand(32, 70), maxB / linear);
    const sB = sA * linear;
    const hi = area ? 10 : 5;
    const round1 = (g) => Math.round(g * 10) / 10;

    return {
      type: 'ratio', lo: 1, hi, scale: 'log', target: t,
      prompt: area
        ? 'Quantas vezes a <u>área</u> de <b class="b">B</b> é maior que a de <b class="a">A</b>?'
        : 'Quantas vezes <b class="b">B</b> é <u>mais largo</u> que <b class="a">A</b>?',
      tol: area ? 0.22 : 0.14,
      tolLabel: (tol) => `Margem de acerto: ±${fmt1((Math.exp(tol) - 1) * 100)}%`,
      err: (g) => Math.abs(Math.log(round1(g) / t)),
      render() {
        const cyA = 105, cyB = 105;
        let out = shapeSvg(kind, 85, cyA, sA, 0, { fill: COLORS.a, opacity: 0.92 });
        out += shapeSvg(kind, 285, cyB, sB, 0, { fill: COLORS.b, opacity: 0.92 });
        out += label(85, cyA + sA / 2 + 24, 'A', COLORS.a);
        out += label(285, cyB + 7, 'B', '#0d1622');
        return out;
      },
      readout(g, reveal) {
        const v = round1(g);
        if (!reveal) return `×${fmt1(v)}`;
        return `×${fmt1(v)} <small>certo: ×${fmt1(t)}</small>`;
      },
      detail(g) {
        const v = round1(g);
        if (v === t) return 'Exato!';
        return `Você disse ×${fmt1(v)}; o certo era ×${fmt1(t)}.`;
      },
    };
  }

  function makeMemory(level) {
    const Lt = rand(90, 240);
    const ang = pick([-1, 1]) * rand(15, 55);
    const lo = Lt * rand(0.35, 0.6);
    const hi = Math.min(370, Math.max(Lt * 1.2, Lt * rand(1.5, 1.9)));
    const line = (x1, y1, x2, y2, color, dash) =>
      `<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" stroke="${color}" stroke-width="6" stroke-linecap="round"${dash ? ' stroke-dasharray="8 7" stroke-width="4"' : ''}/>`;

    return {
      type: 'memory', lo, hi, scale: 'lin', target: Lt,
      showMs: Math.max(900, 1800 - level * 30),
      showPrompt: 'Memorize o comprimento da linha <b class="a">azul</b>…',
      prompt: 'Agora deixe a linha <b class="b">amarela</b> do mesmo comprimento.',
      tol: 0.1,
      tolLabel: (tol) => `Margem de acerto: ±${fmt1(tol * 100)}% no comprimento`,
      err: (g) => Math.abs(g / Lt - 1),
      render(g, reveal, phase) {
        if (phase === 'show') {
          const r = (ang * Math.PI) / 180, dx = (Math.cos(r) * Lt) / 2, dy = (Math.sin(r) * Lt) / 2;
          return line(200 - dx, 125 - dy, 200 + dx, 125 + dy, COLORS.a);
        }
        let out = line(200 - g / 2, 170, 200 + g / 2, 170, COLORS.b);
        if (reveal) {
          out += line(200 - Lt / 2, 130, 200 + Lt / 2, 130, COLORS.ok, true);
          out += `<text x="200" y="110" text-anchor="middle" font-size="14" fill="${COLORS.ok}">comprimento certo</text>`;
        }
        return out;
      },
      detail(g) {
        const d = (g / Lt - 1) * 100;
        if (Math.abs(d) < 0.5) return 'Praticamente exato.';
        return `Sua linha ficou ${fmt1(Math.abs(d))}% ${d > 0 ? 'mais longa' : 'mais curta'}.`;
      },
    };
  }

  const MAKERS = { match: makeMatch, fraction: makeFraction, ratio: makeRatio, memory: makeMemory };

  /* ================= Telas ================= */
  let current = 'home';
  function show(id) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === 's-' + id));
    current = id;
    window.scrollTo(0, 0);
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

  function renderHome() {
    stopRun();
    const best = store.get('best', 0);
    const bestRounds = store.get('bestRounds', 0);
    document.querySelector('[data-best="ilimitado"]').textContent =
      best > 0 ? `Recorde: ${fmtInt(best)} pts · ${bestRounds} rodadas` : '';
    $('#barRight').textContent = '';
    show('home');
  }

  document.addEventListener('click', (e) => {
    const go = e.target.closest('[data-go]');
    if (go) startMode(go.dataset.go);
    const tp = e.target.closest('[data-type]');
    if (tp) startRun('treino', tp.dataset.type);
  });
  $('#homeBtn').addEventListener('click', renderHome);

  function startMode(mode) {
    if (mode === 'ilimitado') startRun('ilimitado');
    else if (mode === 'treino') { stopRun(); show('treino'); }
    else renderHome();
  }

  /* ================= Partida ================= */
  let run = null;
  let showTimer = null;
  const knob = $('#knob');

  function stopRun() { clearTimeout(showTimer); run = null; }

  function startRun(mode, type = null) {
    stopRun();
    run = { mode, type, level: 1, score: 0, lives: LIVES, streak: 0, history: [], lastType: null, ch: null, phase: 'input', done: false };
    show('play');
    $('#hudLives').hidden = mode !== 'ilimitado';
    $('#quit').hidden = mode !== 'treino';
    $('#hudScoreLabel').textContent = mode === 'treino' ? 'Precisão média' : 'Pontos';
    $('#hudRoundLabel').textContent = mode === 'treino' ? TYPE_NAMES[type] : 'Rodada';
    newRound();
  }

  function chooseType() {
    if (run.mode === 'treino') return run.type;
    const order = ['match', 'fraction', 'ratio', 'memory'];
    if (run.level <= 4) return order[run.level - 1];
    return pick(order.filter((t) => t !== run.lastType));
  }

  // A margem de erro fecha 3% por rodada, até 45% da margem inicial.
  const difficulty = () => (run.mode === 'treino' ? 1 : Math.max(0.45, 1 - (run.level - 1) * 0.03));

  function newRound() {
    const type = chooseType();
    run.lastType = type;
    run.ch = MAKERS[type](run.mode === 'treino' ? 12 : run.level);
    run.answered = false;
    knob.value = Math.round(rand(0.15, 0.85) * 1000);
    $('#feedback').hidden = true;
    $('#controls').hidden = false;
    $('#margin').textContent = run.ch.tolLabel(run.ch.tol * difficulty());
    updateHud();

    if (run.ch.showMs) {
      run.phase = 'show';
      setControls(false);
      render();
      showTimer = setTimeout(() => { run.phase = 'input'; setControls(true); render(); knob.focus({ preventScroll: true }); }, run.ch.showMs);
    } else {
      run.phase = 'input';
      setControls(true);
      render();
    }
  }

  function setControls(on) {
    [knob, $('#minus'), $('#plus'), $('#confirm')].forEach((el) => { el.disabled = !on; });
  }

  function value() {
    const ch = run.ch, u = knob.value / 1000;
    if (ch.scale === 'log') return Math.exp(Math.log(ch.lo) + u * (Math.log(ch.hi) - Math.log(ch.lo)));
    return ch.lo + u * (ch.hi - ch.lo);
  }

  function render(reveal = false) {
    const ch = run.ch, g = value();
    $('#prompt').innerHTML = run.phase === 'show' ? ch.showPrompt : ch.prompt;
    $('#stage').innerHTML = ch.render(g, reveal, run.phase);
    $('#readout').innerHTML = ch.readout && run.phase === 'input' ? ch.readout(g, reveal) : '';
  }

  function updateHud() {
    if (run.mode === 'treino') {
      const hits = run.history;
      $('#hudRound').textContent = hits.length;
      $('#hudScore').textContent = hits.length ? `${Math.round(hits.reduce((a, h) => a + h.precision, 0) / hits.length)}%` : '–';
      $('#barRight').textContent = `${hits.length} tentativas`;
      return;
    }
    $('#hudRound').textContent = run.level;
    $('#hudScore').textContent = fmtInt(run.score);
    $('#hudLives').innerHTML = Array.from({ length: LIVES }, (_, i) => `<i class="${i < run.lives ? '' : 'off'}">♥</i>`).join('');
    $('#hudLives').setAttribute('aria-label', `${run.lives} de ${LIVES} vidas`);
    $('#barRight').textContent = run.streak > 0 ? `${run.streak} na mosca seguidos` : '';
  }

  knob.addEventListener('input', () => { if (run && !run.answered) render(); });

  // Botões − e +: um toque = passo pequeno; segurar = repete.
  function nudge(dir) {
    if (!run || run.answered || knob.disabled) return;
    knob.value = clamp(+knob.value + dir * 3, 0, 1000);
    render();
  }
  [['#minus', -1], ['#plus', 1]].forEach(([sel, dir]) => {
    const el = $(sel);
    let hold = null, rep = null;
    const stop = () => { clearTimeout(hold); clearInterval(rep); };
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      nudge(dir);
      hold = setTimeout(() => { rep = setInterval(() => nudge(dir), 40); }, 350);
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => el.addEventListener(ev, stop));
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); nudge(dir); } });
  });

  // Arrastar para os lados sobre a figura também ajusta.
  const stageBox = $('#stageBox');
  let drag = null;
  stageBox.addEventListener('pointerdown', (e) => {
    if (!run || run.answered || knob.disabled) return;
    drag = { x: e.clientX, v: +knob.value, w: stageBox.clientWidth };
    stageBox.setPointerCapture(e.pointerId);
  });
  stageBox.addEventListener('pointermove', (e) => {
    if (!drag) return;
    knob.value = clamp(drag.v + ((e.clientX - drag.x) / drag.w) * 900, 0, 1000);
    render();
  });
  ['pointerup', 'pointercancel'].forEach((ev) => stageBox.addEventListener(ev, () => { drag = null; }));

  $('#confirm').addEventListener('click', confirm);
  $('#next').addEventListener('click', next);
  $('#quit').addEventListener('click', renderHome);

  function verdict(acc) {
    if (acc >= 0.85) return 'Na mosca! 🎯';
    if (acc >= 0.6) return 'Muito bom';
    if (acc >= 0.3) return 'Bom';
    if (acc >= 0) return 'Passou raspando';
    return 'Errou feio';
  }

  function confirm() {
    if (!run || run.answered || run.phase !== 'input') return;
    run.answered = true;
    const ch = run.ch, g = value();
    const tol = ch.tol * difficulty();
    const err = ch.err(g);
    const acc = 1 - err / tol;
    const miss = acc < 0;
    // Precisão em %, comparável entre desafios (100 = exato, 0 = no limite da margem inicial ×2).
    const precision = clamp(100 * (1 - err / (ch.tol * 2)), 0, 100);
    let pts = 0, gotLife = false;

    if (run.mode === 'ilimitado') {
      if (miss) { run.lives -= 1; run.streak = 0; }
      else {
        pts = Math.round(10 + 90 * acc);
        if (acc >= 0.85) {
          run.streak += 1;
          if (run.streak % 3 === 0 && run.lives < LIVES) { run.lives += 1; gotLife = true; }
        } else run.streak = 0;
        run.score += pts;
      }
    }
    run.history.push({ type: ch.type, acc, miss, pts, precision });

    const fb = $('#feedback');
    fb.classList.toggle('miss', miss);
    $('#fbVerdict').textContent = verdict(acc);
    $('#fbPts').textContent = run.mode === 'treino'
      ? `${Math.round(precision)}%`
      : (miss ? '−1 vida' : `+${pts}${gotLife ? ' · +1 vida' : ''}`);
    $('#fbDetail').textContent = ch.detail(g);
    const over = run.mode === 'ilimitado' && run.lives <= 0;
    $('#next').textContent = over ? 'Ver resultado' : 'Próxima';
    $('#controls').hidden = true;
    fb.hidden = false;
    render(true);
    updateHud();
    if (gotLife) {
      const hearts = document.querySelectorAll('#hudLives i');
      const h = hearts[run.lives - 1];
      if (h) h.classList.add('pop');
    }
    $('#next').focus({ preventScroll: true });
  }

  function next() {
    if (!run) return;
    if (run.mode === 'ilimitado' && run.lives <= 0) { finish(); return; }
    run.level += 1;
    newRound();
  }

  function finish() {
    const r = run;
    const rounds = r.history.length;
    const hits = r.history.filter((h) => !h.miss);
    const avg = rounds ? r.history.reduce((a, h) => a + h.precision, 0) / rounds : 0;
    const bullseyes = r.history.filter((h) => h.acc >= 0.85).length;
    const prev = store.get('best', 0);
    if (r.score > prev) { store.set('best', r.score); store.set('bestRounds', rounds); }

    show('end');
    $('#barRight').textContent = '';
    $('#endScore').innerHTML = `${fmtInt(r.score)}<small> pts</small>`;
    $('#endSub').textContent = r.score > prev
      ? (prev ? `Novo recorde! Antes: ${fmtInt(prev)} pts` : 'Primeiro recorde registrado!')
      : `Seu recorde: ${fmtInt(prev)} pts`;
    $('#endStats').innerHTML = `
      <div>Rodadas<b>${rounds}</b></div>
      <div>Na mosca<b>${bullseyes}</b></div>
      <div>Precisão média<b>${Math.round(avg)}%</b></div>`;
    const color = (h) => (h.miss ? '#ff5d73' : h.acc >= 0.85 ? '#46d369' : h.acc >= 0.4 ? '#ffcf3f' : '#ff9f43');
    $('#endStrip').innerHTML = r.history.map((h, i) => `<i style="background:${color(h)}" title="Rodada ${i + 1}: ${TYPE_NAMES[h.type]}"></i>`).join('');

    const sq = (h) => (h.miss ? '🟥' : h.acc >= 0.85 ? '🟩' : h.acc >= 0.4 ? '🟨' : '🟧');
    const strip = r.history.slice(0, 30).map(sq).join('') + (rounds > 30 ? '…' : '');
    $('#endShare').onclick = () => share(
      `Tamanho Certo · Ilimitado\n📏 ${fmtInt(r.score)} pts em ${rounds} rodadas (${hits.length} acertos)\n${strip}\n${location.origin}${location.pathname}`,
    );
    run = null;
  }
  $('#endAgain').addEventListener('click', () => startRun('ilimitado'));
  $('#endHome').addEventListener('click', renderHome);

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || e.repeat || current !== 'play' || !run) return;
    if (e.target.closest && e.target.closest('button')) return; // botão focado já trata o Enter
    e.preventDefault();
    if (run.answered) next(); else confirm();
  });

  // Início: ?mode=ilimitado|treino abre direto o modo.
  renderHome();
  const mode = new URLSearchParams(location.search).get('mode');
  if (mode) startMode(mode);
})();
