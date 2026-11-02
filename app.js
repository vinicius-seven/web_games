(() => {
  'use strict';

  /* ---------- Catálogo ---------- */
  // Para adicionar um jogo: inclua um objeto aqui e (se tiver arte própria) uma classe .art-<id> no style.css.
  const GAMES = [
    {
      id: 'croma',
      title: 'Croma',
      status: 'available',
      href: 'games/croma/index.html',
      tagline: 'Quão afiado é o seu olho para cores?',
      description:
        'Memorize uma cor e recrie-a de cabeça, encare o desafio diário — as mesmas cores para todo mundo — ou ache o quadrado de tom diferente antes que o tempo acabe.',
      tags: ['Cores', 'Percepção', 'Memória', 'Casual'],
      year: 2026,
      age: 'L',
      meta: '3 modos',
      match: 98,
      duration: '1–5 min por partida',
    },
    {
      id: 'tamanho',
      title: 'Tamanho Certo',
      subtitle: 'Ilimitado',
      status: 'available',
      href: 'games/tamanho/index.html',
      tagline: 'Seu olho mede bem?',
      description:
        'Iguale figuras, marque frações de uma barra, diga quantas vezes uma forma é maior que a outra e reproduza comprimentos de memória. Rodadas sem fim, com a margem de erro fechando a cada acerto.',
      tags: ['Percepção', 'Estimativa', 'Casual'],
      year: 2026,
      age: 'L',
      meta: '2 modos',
      match: 96,
      duration: 'Partidas sem fim',
    },
    {
      id: 'sudoku',
      title: 'Sudoku',
      status: 'available',
      href: 'games/sudoku/index.html',
      tagline: 'O clássico dos números, sem pressa.',
      description:
        'Grades novas a cada partida, sempre com solução única, em quatro dificuldades. Anotações, desfazer, dicas e progresso salvo, além de um Sudoku do dia igual para todo mundo.',
      tags: ['Lógica', 'Números', 'Clássico'],
      year: 2026,
      age: 'L',
      meta: '4 dificuldades',
      match: 97,
      duration: '5–30 min por grade',
    },
    {
      id: 'canteiros',
      title: 'Canteiros',
      status: 'available',
      href: 'games/canteiros/index.html',
      tagline: 'Uma flor por linha, por coluna e por canteiro.',
      description:
        'Quebra-cabeça de lógica num jardim: plante uma flor em cada linha, coluna e canteiro, sem que duas flores se encostem. Tabuleiros novos a cada partida, sempre com uma única solução, e um jardim do dia igual para todo mundo.',
      tags: ['Lógica', 'Quebra-cabeça', 'Casual'],
      year: 2026,
      age: 'L',
      meta: '4 tamanhos',
      match: 97,
      duration: '2–15 min por jardim',
    },
  ];

  const MODES = [
    { id: 'memoria', game: 'croma', title: 'Memória', text: 'Veja uma cor por alguns segundos e recrie-a de cabeça. 5 rodadas, até 50 pontos.' },
    { id: 'diario', game: 'croma', title: 'Desafio Diário', text: 'As mesmas 5 cores para todo mundo. Uma tentativa por dia — compartilhe o resultado.' },
    { id: 'olho', game: 'croma', title: 'Olho Clínico', text: 'Ache o quadrado de tom diferente. Cada acerto deixa tudo mais difícil. 60 segundos.' },
    { id: 'ilimitado', game: 'tamanho', title: 'Ilimitado', text: 'Rodadas sem fim com 4 tipos de desafio e 3 vidas. A margem de erro fecha a cada rodada.' },
    { id: 'treino', game: 'tamanho', title: 'Treino', text: 'Escolha um tipo de desafio e pratique sem vidas e sem pontuação.' },
    { id: 'diario', game: 'sudoku', art: 'sudoku-dia', title: 'Sudoku do dia', text: 'A mesma grade (Médio) para todo mundo hoje. Compare o tempo.' },
    { id: 'facil', game: 'sudoku', art: 'sudoku-1', title: 'Fácil', text: 'Muitas pistas. Bom para aquecer.' },
    { id: 'medio', game: 'sudoku', art: 'sudoku-2', title: 'Médio', text: 'Pede um pouco de raciocínio além do óbvio.' },
    { id: 'dificil', game: 'sudoku', art: 'sudoku-3', title: 'Difícil', text: 'Poucas pistas. Anotações ajudam muito.' },
    { id: 'especialista', game: 'sudoku', art: 'sudoku-4', title: 'Especialista', text: 'O mínimo de pistas que a grade permite.' },
    { id: 'diario', game: 'canteiros', art: 'canteiros-dia', title: 'Jardim do dia', text: 'O mesmo jardim 8×8 para todo mundo hoje. Compare o tempo.' },
    { id: '6', game: 'canteiros', art: 'canteiros-6', title: 'Broto', text: '6×6. Ótimo para aprender as regras.' },
    { id: '7', game: 'canteiros', art: 'canteiros-7', title: 'Muda', text: '7×7. Começa a pedir raciocínio.' },
    { id: '8', game: 'canteiros', art: 'canteiros-8', title: 'Canteiro', text: '8×8. O tamanho clássico.' },
    { id: '9', game: 'canteiros', art: 'canteiros-9', title: 'Estufa', text: '9×9. Para quem já pegou o jeito.' },
  ];

  /* ---------- Armazenamento local (tolerante a falhas) ---------- */
  const store = {
    get(key, fallback = null) {
      try { const v = localStorage.getItem(key); return v == null ? fallback : JSON.parse(v); }
      catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* sem armazenamento */ }
    },
  };
  const LIST_KEY = 'jogateca:lista';
  const getList = () => store.get(LIST_KEY, []);
  const inList = (id) => getList().includes(id);
  function toggleList(id) {
    const list = getList();
    const i = list.indexOf(id);
    if (i >= 0) list.splice(i, 1); else list.push(id);
    store.set(LIST_KEY, list);
    render();
  }

  function todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  function fmtTime(sec) {
    const m = Math.floor(sec / 60), s = sec % 60;
    return m >= 60 ? `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}` : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  function modeRecord(m) {
    const key = `${m.game}:${m.id}`;
    if (key === 'croma:memoria') {
      const best = Math.max(...['facil', 'normal', 'dificil'].map((d) => store.get(`croma:best:memoria:${d}`, 0)));
      return best > 0 ? `Recorde ${best.toFixed(2)}` : '';
    }
    if (key === 'croma:diario') {
      const r = store.get(`croma:daily:${todayKey()}`);
      return r ? `Hoje ${r.total.toFixed(2)}` : 'Novo hoje';
    }
    if (key === 'croma:olho') {
      const best = store.get('croma:best:olho', 0);
      return best > 0 ? `Recorde nível ${best}` : '';
    }
    if (key === 'tamanho:ilimitado') {
      const best = store.get('tamanho:best', 0);
      return best > 0 ? `Recorde ${best} pts` : '';
    }
    if (key === 'sudoku:diario') {
      const r = store.get(`sudoku:daily:${todayKey()}`);
      return r ? `Hoje ${fmtTime(r.time)}` : 'Novo hoje';
    }
    if (key === 'canteiros:diario') {
      const r = store.get(`canteiros:daily:${todayKey()}`);
      return r ? `Hoje ${fmtTime(r.time)}` : 'Novo hoje';
    }
    if (m.game === 'canteiros') {
      const best = store.get(`canteiros:best:${m.id}`);
      return best ? `Melhor ${fmtTime(best)}` : '';
    }
    if (m.game === 'sudoku') {
      const best = store.get(`sudoku:best:${m.id}`);
      return best ? `Melhor ${fmtTime(best)}` : '';
    }
    return '';
  }

  /* ---------- Arte (só CSS) ---------- */
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function art(kind, big = false) {
    if (kind === 'croma') {
      const colors = ['#ff3d6e', '#ffd23f', '#3ddc97', '#3a86ff', '#b14aed', '#ff8c42', '#00c2d1', '#f15bb5', '#9ef01a'];
      return `<div class="art art-croma${big ? ' big' : ''}"><div class="swatches">${colors.map((c) => `<i style="background:${c}"></i>`).join('')}</div></div>`;
    }
    if (kind === 'tamanho') {
      return '<div class="art art-tamanho"><div class="ruler"></div><div class="shapes"><i></i><i></i><i></i></div></div>';
    }
    if (kind === 'memoria') return '<div class="art art-memoria"></div>';
    if (kind === 'diario') {
      const c = ['#e76f51', '#f4a261', '#e9c46a', '#2a9d8f', '#8ab17d'];
      return `<div class="art art-diario">${c.map((x) => `<i style="background:${x}"></i>`).join('')}</div>`;
    }
    if (kind.startsWith('canteiros')) {
      // Um tabuleiro 6×6 de verdade (com solução única), usado como ilustração.
      const regions = [2, 0, 1, 1, 1, 1, 2, 0, 1, 1, 1, 1, 2, 3, 3, 3, 1, 1, 5, 3, 3, 5, 4, 4, 5, 5, 5, 5, 4, 4, 5, 5, 5, 5, 4, 4];
      const sol = [1, 4, 0, 2, 5, 3];
      const colors = ['#f2c14e', '#f4978e', '#9bd4a4', '#a9b7f0', '#d8b4e2', '#8ecae6'];
      const flower = '<svg viewBox="-50 -50 100 100"><g fill="#6d1f3f">' +
        [0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="-24" rx="15" ry="22" transform="rotate(${a})"/>`).join('') +
        '</g><circle r="12" fill="#f2c14e"/></svg>';
      const size = kind.match(/^canteiros-(\d)$/);
      const badge = kind === 'canteiros-dia'
        ? `<span class="sudoku-badge day"><b>${new Date().getDate()}</b>${new Date().toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</span>`
        : size ? `<span class="sudoku-badge">${size[1]}×${size[1]}</span>` : '';
      return `<div class="art art-canteiros${big ? ' big' : ''}"><div class="cgrid">${regions.map((g, i) =>
        `<i style="background:${colors[g]}">${sol[Math.floor(i / 6)] === i % 6 ? flower : ''}</i>`).join('')}</div>${badge}</div>`;
    }
    if (kind.startsWith('sudoku')) {
      // Trecho de uma grade: 0 = vazio, negativo = número do jogador (tinta azul).
      const sample = [5, 3, 0, 0, 7, 0, 0, 0, 0, 6, 0, 0, 1, 9, 5, 0, 0, 0, 0, 9, 8, 0, 0, 0, 0, 6, 0,
        8, 0, -9, 0, 6, 0, 0, 0, 3, 4, 0, 0, 8, 0, 3, 0, 0, 1];
      const dots = kind.match(/^sudoku-(\d)$/);
      const badge = kind === 'sudoku-dia'
        ? `<span class="sudoku-badge day"><b>${new Date().getDate()}</b>${new Date().toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</span>`
        : dots ? `<span class="sudoku-badge">${'●'.repeat(+dots[1])}${'○'.repeat(4 - dots[1])}</span>` : '';
      return `<div class="art art-sudoku${big ? ' big' : ''}"><div class="sgrid">${sample.map((v) => `<i${v < 0 ? ' class="u"' : ''}>${v ? Math.abs(v) : ''}</i>`).join('')}</div>${badge}</div>`;
    }
    if (kind === 'ilimitado') return '<div class="art art-ilimitado"><b>∞</b></div>';
    if (kind === 'treino') return '<div class="art art-treino"><i></i><i></i><i></i><i></i></div>';
    if (kind === 'olho') {
      return `<div class="art art-olho">${Array.from({ length: 24 }, (_, i) => `<i${i === 15 ? ' class="odd"' : ''}></i>`).join('')}</div>`;
    }
    return '<div class="art"></div>';
  }

  /* ---------- Hero ---------- */
  function renderHero() {
    const g = GAMES[0];
    document.getElementById('hero').innerHTML = `
      <div class="hero-art">${art(g.id, true)}</div>
      <div class="hero-content">
        <span class="kicker"><b>J</b> Original Jogateca</span>
        <h1 class="hero-title">${esc(g.title)}</h1>
        <p class="hero-tagline">${esc(g.tagline)}</p>
        <div class="meta">
          <span class="match">${g.match}% relevante</span><span>${g.year}</span>
          <span class="age">${g.age}</span><span>${esc(g.meta)}</span>
        </div>
        <p class="hero-desc">${esc(g.description)}</p>
        <div class="actions">
          <a class="btn btn-play" href="${g.href}">▶ Jogar</a>
          <button class="btn btn-ghost" data-info="${g.id}">ⓘ Mais informações</button>
        </div>
      </div>`;
  }

  /* ---------- Fileiras ---------- */
  function gameCard(g) {
    const soon = g.status === 'soon';
    return `
      <article class="card${soon ? ' soon' : ''}" tabindex="0" data-info="${g.id}" aria-label="${esc(g.title)}${soon ? ', em breve' : ''}">
        ${art(g.id)}
        ${soon ? '<span class="badge soon">EM BREVE</span>' : '<span class="badge">NOVO</span>'}
        <div class="card-title">${esc(g.title)}${g.subtitle ? `<small>${esc(g.subtitle)}</small>` : ''}</div>
        <div class="card-hover">
          ${soon
            ? '<span class="btn-round" aria-hidden="true">⏳</span>'
            : `<a class="btn-round play" href="${g.href}" aria-label="Jogar ${esc(g.title)}" data-stop>▶</a>`}
          <button class="btn-round${inList(g.id) ? ' on' : ''}" data-list="${g.id}" data-stop
            aria-label="${inList(g.id) ? 'Remover da' : 'Adicionar à'} minha lista">${inList(g.id) ? '✓' : '+'}</button>
          <span class="info">${soon ? 'Em breve' : `<span class="match">${g.match}%</span>`} · ${esc(g.tags.slice(0, 2).join(' · '))}</span>
        </div>
      </article>`;
  }

  function modeCard(m) {
    const g = GAMES.find((x) => x.id === m.game);
    const rec = modeRecord(m);
    return `
      <a class="card mode" href="${g.href}?mode=${m.id}" aria-label="${esc(g.title)}: ${esc(m.title)}">
        ${art(m.art || m.id)}
        ${rec ? `<span class="record">${esc(rec)}</span>` : ''}
        <div class="card-title">${esc(m.title)}<small>${esc(g.title)}</small></div>
      </a>`;
  }

  // Partidas salvas pelos jogos que guardam progresso (Sudoku e Canteiros).
  function continueCards() {
    let html = '';
    const sv = store.get('sudoku:save');
    if (sv && !sv.won && Array.isArray(sv.values)) {
      const names = { facil: 'Fácil', medio: 'Médio', dificil: 'Difícil', especialista: 'Especialista' };
      const empty = sv.puzzle.filter((v) => !v).length;
      const filled = sv.values.filter((v, i) => v && !sv.puzzle[i]).length;
      const pct = empty ? Math.round((filled / empty) * 100) : 0;
      html += `
      <a class="card mode" href="games/sudoku/index.html?mode=continuar" aria-label="Continuar Sudoku, ${pct}% preenchido">
        ${art('sudoku')}
        <span class="record">${fmtTime(Math.floor(sv.elapsed / 1000))}</span>
        <div class="card-title">Sudoku<small>${esc(sv.daily ? 'Do dia' : names[sv.diff] || '')}</small></div>
        <span class="progress" style="--p:${pct}%"></span>
      </a>`;
    }
    const cv = store.get('canteiros:save');
    if (cv && !cv.won && Array.isArray(cv.cells)) {
      const flowers = cv.cells.filter((v) => v === 2).length;
      const pct = Math.round((flowers / cv.n) * 100);
      html += `
      <a class="card mode" href="games/canteiros/index.html?mode=continuar" aria-label="Continuar Canteiros, ${flowers} de ${cv.n} flores">
        ${art('canteiros')}
        <span class="record">${fmtTime(Math.floor(cv.elapsed / 1000))}</span>
        <div class="card-title">Canteiros<small>${esc(cv.daily ? 'Do dia' : `${cv.n}×${cv.n}`)}</small></div>
        <span class="progress" style="--p:${pct}%"></span>
      </a>`;
    }
    return html;
  }

  function row(id, title, cardsHtml, note = '') {
    if (!cardsHtml) return '';
    return `
      <section class="row" id="row-${id}">
        <h2>${title}${note ? `<small>${note}</small>` : ''}</h2>
        <div class="row-track-wrap">
          <button class="row-arrow left" aria-label="Rolar para a esquerda" data-scroll="-1">‹</button>
          <div class="row-track">${cardsHtml}</div>
          <button class="row-arrow right" aria-label="Rolar para a direita" data-scroll="1">›</button>
        </div>
      </section>`;
  }

  function renderRows() {
    const available = GAMES.filter((g) => g.status === 'available');
    const soon = GAMES.filter((g) => g.status === 'soon');
    const list = getList().map((id) => GAMES.find((g) => g.id === id)).filter(Boolean);
    const perception = GAMES.filter((g) => g.tags.includes('Percepção'));

    document.getElementById('rows').innerHTML = [
      row('continuar', 'Continuar jogando', continueCards()),
      row('jogar', 'Jogue agora', available.map(gameCard).join('')),
      row('minha-lista', 'Minha lista', list.map(gameCard).join('')),
      ...available.map((g) => row(`modos-${g.id}`, `Modos de ${esc(g.title)}`,
        MODES.filter((m) => m.game === g.id).map(modeCard).join(''), 'escolha e vá direto pro jogo')),
      row('em-breve', 'Em breve', soon.map(gameCard).join('')),
      row('percepcao', 'Para treinar a percepção', perception.map(gameCard).join('')),
    ].join('');
    document.getElementById('navLista').hidden = list.length === 0;
    document.getElementById('navBreve').hidden = soon.length === 0;
  }

  /* ---------- Modal ---------- */
  const modal = document.getElementById('modal');
  let lastFocus = null;

  function openModal(id) {
    const g = GAMES.find((x) => x.id === id);
    if (!g) return;
    const soon = g.status === 'soon';
    const modes = MODES.filter((m) => m.game === g.id);
    document.getElementById('modalBody').innerHTML = `
      <div class="modal-art">
        ${art(g.id, true)}
        <div class="modal-head">
          <h2 id="modalTitle">${esc(g.title)}${g.subtitle ? ` <small style="font-size:.4em;letter-spacing:.2em">${esc(g.subtitle.toUpperCase())}</small>` : ''}</h2>
          <div class="actions">
            ${soon
              ? '<span class="btn btn-disabled">⏳ Em breve</span>'
              : `<a class="btn btn-play" href="${g.href}">▶ Jogar</a>`}
            <button class="btn-round${inList(g.id) ? ' on' : ''}" data-list="${g.id}"
              aria-label="${inList(g.id) ? 'Remover da' : 'Adicionar à'} minha lista">${inList(g.id) ? '✓' : '+'}</button>
          </div>
        </div>
      </div>
      <div class="modal-content">
        <div>
          <div class="meta">
            ${soon ? '<span class="match">Em breve</span>' : `<span class="match">${g.match}% relevante</span>`}
            <span>${g.year}</span><span class="age">${g.age}</span><span>${esc(g.meta)}</span>
          </div>
          <p><strong>${esc(g.tagline)}</strong></p>
          <p>${esc(g.description)}</p>
        </div>
        <div class="modal-side">
          <div><b>Gêneros:</b> ${esc(g.tags.join(', '))}</div>
          <div><b>Duração:</b> ${esc(g.duration)}</div>
          <div><b>Plataforma:</b> navegador (celular e computador)</div>
        </div>
        ${soon ? '<div class="soon-note">Este jogo está em produção. Adicione à sua lista para encontrá-lo rápido quando sair.</div>' : ''}
        ${modes.length ? `<h3>Modos</h3><div class="mode-list">${modes.map((m, i) => `
          <a class="mode-item" href="${g.href}?mode=${m.id}">
            <span class="n">${i + 1}</span>
            <span class="thumb">${art(m.art || m.id)}</span>
            <span><strong>${esc(m.title)}</strong><span>${esc(m.text)}</span></span>
            <span class="rec">${esc(modeRecord(m))}</span>
          </a>`).join('')}</div>` : ''}
      </div>`;
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    modal.querySelector('.modal-close').focus();
  }

  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
  }

  /* ---------- Eventos ---------- */
  document.addEventListener('click', (e) => {
    const listBtn = e.target.closest('[data-list]');
    if (listBtn) {
      e.preventDefault();
      const id = listBtn.dataset.list;
      toggleList(id);
      if (!modal.hidden) openModal(id);
      return;
    }
    if (e.target.closest('[data-stop]')) return; // links/botões dentro do card
    if (e.target.closest('[data-close]')) { closeModal(); return; }
    const scrollBtn = e.target.closest('[data-scroll]');
    if (scrollBtn) {
      const track = scrollBtn.parentElement.querySelector('.row-track');
      track.scrollBy({ left: Number(scrollBtn.dataset.scroll) * track.clientWidth * 0.85, behavior: 'smooth' });
      return;
    }
    const info = e.target.closest('[data-info]');
    if (info) openModal(info.dataset.info);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.hidden) closeModal();
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.card[data-info]')) {
      e.preventDefault();
      openModal(e.target.dataset.info);
    }
  });

  const topbar = document.getElementById('topbar');
  const onScroll = () => topbar.classList.toggle('solid', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true });

  // Recordes podem mudar quando o jogador volta do jogo (bfcache).
  window.addEventListener('pageshow', (e) => { if (e.persisted) renderRows(); });

  function render() { renderRows(); }
  renderHero();
  render();
  onScroll();
})();
