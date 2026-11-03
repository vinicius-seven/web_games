/* Duelo local da Jogateca: 2 a 4 pessoas jogam a mesma rodada no mesmo aparelho, uma de cada vez.
   Cada jogo usa as telas daqui (escolha dos jogadores, "passe o aparelho", placar) e cuida só da partida.
   Os nomes ficam salvos no aparelho, junto com o histórico de duelos de cada jogo. */
(function (root) {
  'use strict';

  const KEY_NAMES = 'jogateca:duelo:nomes';
  const KEY_HIST = (g) => `jogateca:duelo:hist:${g}`;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const get = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } };
  const set = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sem armazenamento */ } };
  const MEDALS = ['🥇', '🥈', '🥉', '4º'];

  function names() {
    const n = get(KEY_NAMES, null);
    return Array.isArray(n) && n.length >= 2 ? n : ['Jogador 1', 'Jogador 2'];
  }

  /* Tela de escolha. opts.extra: HTML de opções do jogo (ex.: tempo). onStart(nomes, form). */
  function setup({ el, game, title = 'Duelo', text = '', extra = '', onStart, onBack }) {
    el.dataset.game = game;
    let list = names();
    const draw = () => {
      el.innerHTML = `<div class="duelo-box">
        <h2 class="duelo-title">${esc(title)}</h2>
        <p class="duelo-text">${text || 'Todo mundo joga a mesma rodada, um de cada vez, no mesmo aparelho. No fim, o placar.'}</p>
        <div class="duelo-count" role="group" aria-label="Quantas pessoas">
          ${[2, 3, 4].map((k) => `<button type="button" class="chip${list.length === k ? ' on' : ''}" data-count="${k}">${k} pessoas</button>`).join('')}
        </div>
        <form class="duelo-form" autocomplete="off">
          <div class="duelo-names">${list.map((n, i) => `<label><span>${['🙂', '😎', '🤓', '😃'][i]}</span><input name="p${i}" maxlength="14" value="${esc(n)}" aria-label="Nome ${i + 1}"></label>`).join('')}</div>
          ${extra ? `<div class="duelo-extra">${extra}</div>` : ''}
          <div class="duelo-actions">
            <button class="btn primary" type="submit">Começar o duelo</button>
            ${onBack ? '<button class="btn ghost" type="button" data-back>Voltar</button>' : ''}
          </div>
        </form>
        ${historyHtml(el.dataset.game)}
      </div>`;
    };
    draw();
    el.onclick = (e) => {
      const c = e.target.closest('[data-count]');
      if (c) {
        const k = +c.dataset.count;
        const cur = [...el.querySelectorAll('.duelo-names input')].map((x) => x.value.trim());
        list = Array.from({ length: k }, (_, i) => cur[i] || names()[i] || `Jogador ${i + 1}`);
        draw();
      }
      if (e.target.closest('[data-back]')) onBack();
      if (e.target.closest('[data-clear-hist]')) { set(KEY_HIST(el.dataset.game), []); draw(); }
    };
    el.onsubmit = (e) => {
      e.preventDefault();
      const form = e.target;
      const ns = [...form.querySelectorAll('.duelo-names input')].map((x, i) => x.value.trim().slice(0, 14) || `Jogador ${i + 1}`);
      // nomes repetidos ganham número
      const seen = {};
      const final = ns.map((n) => { seen[n] = (seen[n] || 0) + 1; return seen[n] > 1 ? `${n} ${seen[n]}` : n; });
      set(KEY_NAMES, final);
      onStart(final, form);
    };
  }

  /* Tela entre as vezes: ninguém vê a pontuação dos outros até o fim. */
  function handoff({ el, name, index, total, info = '', onGo }) {
    el.innerHTML = `<div class="duelo-box center">
      <p class="duelo-step">Vez ${index + 1} de ${total}</p>
      <div class="duelo-avatar" aria-hidden="true">${['🙂', '😎', '🤓', '😃'][index] || '🙂'}</div>
      <h2 class="duelo-title">Vez de ${esc(name)}</h2>
      <p class="duelo-text">${index ? 'Passe o aparelho. Quem já jogou não conta o resultado!' : 'Os outros esperam sem olhar a tela.'}</p>
      ${info ? `<p class="duelo-info">${info}</p>` : ''}
      <button class="btn primary big" type="button" data-go>Estou pronto — começar</button>
    </div>`;
    el.onclick = (e) => { if (e.target.closest('[data-go]')) onGo(); };
    el.onsubmit = null;
  }

  /* Placar final. players: [{ name, score, detail }]. Guarda no histórico do jogo. */
  function results({ el, game, players, unit = 'pontos', onRematch, onNew, onMenu }) {
    const ranked = players.map((p, i) => ({ ...p, i })).sort((a, b) => b.score - a.score);
    let place = 0;
    ranked.forEach((p, k) => { if (k && p.score < ranked[k - 1].score) place = k; p.place = place; });
    const top = ranked.filter((p) => p.place === 0);
    const hist = get(KEY_HIST(game), []);
    hist.unshift({ t: Date.now(), p: players.map((p) => [p.name, p.score]) });
    set(KEY_HIST(game), hist.slice(0, 50));
    el.dataset.game = game;
    el.innerHTML = `<div class="duelo-box center">
      <p class="duelo-step">Fim do duelo</p>
      <h2 class="duelo-title">${top.length > 1 ? 'Empate!' : `${esc(top[0].name)} venceu!`}</h2>
      <ol class="duelo-rank">${ranked.map((p) => `<li class="${p.place === 0 ? 'win' : ''}">
        <span class="m">${MEDALS[p.place]}</span><span class="n">${esc(p.name)}</span>
        <span class="s"><b>${p.score}</b> ${unit}</span>${p.detail ? `<span class="d">${p.detail}</span>` : ''}</li>`).join('')}</ol>
      <div class="duelo-actions">
        <button class="btn primary" type="button" data-rematch>Revanche</button>
        <button class="btn" type="button" data-new>Mudar jogadores</button>
        <button class="btn ghost" type="button" data-menu>Menu</button>
      </div>
      ${historyHtml(game)}
    </div>`;
    el.onclick = (e) => {
      if (e.target.closest('[data-rematch]')) onRematch();
      else if (e.target.closest('[data-new]')) onNew();
      else if (e.target.closest('[data-menu]')) onMenu();
      else if (e.target.closest('[data-clear-hist]')) { set(KEY_HIST(game), []); const h = el.querySelector('.duelo-hist'); if (h) h.remove(); }
    };
    el.onsubmit = null;
  }

  // Quantas vitórias cada nome tem nos últimos duelos deste jogo.
  function historyHtml(game) {
    if (!game) return '';
    const hist = get(KEY_HIST(game), []);
    if (!hist.length) return '';
    const wins = {}, played = {};
    for (const h of hist) {
      const best = Math.max(...h.p.map((x) => x[1]));
      for (const [n, s] of h.p) { played[n] = (played[n] || 0) + 1; if (s === best) wins[n] = (wins[n] || 0) + 1; }
    }
    const rows = Object.keys(played).sort((a, b) => (wins[b] || 0) - (wins[a] || 0) || played[b] - played[a]).slice(0, 8);
    return `<details class="duelo-hist"><summary>Histórico: ${hist.length} ${hist.length === 1 ? 'duelo' : 'duelos'}</summary>
      <table><thead><tr><th>Nome</th><th>Vitórias</th><th>Duelos</th></tr></thead><tbody>
      ${rows.map((n) => `<tr><td>${esc(n)}</td><td>${wins[n] || 0}</td><td>${played[n]}</td></tr>`).join('')}</tbody></table>
      <button class="btn ghost small" type="button" data-clear-hist>Apagar histórico</button></details>`;
  }

  root.Duelo = { setup, handoff, results, names };
})(typeof window !== 'undefined' ? window : globalThis);
