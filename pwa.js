/* Instalação como app (PWA), compartilhado pelo catálogo e pelos jogos.
   Qualquer elemento com [data-pwa-install] vira um botão "Instalar app":
   ele só aparece quando o navegador permite instalar e o app ainda não está instalado. */
(() => {
  'use strict';
  const script = document.currentScript;
  const root = new URL('./', script.src);
  const buttons = () => document.querySelectorAll('[data-pwa-install]');

  const ua = navigator.userAgent;
  const isIOS = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isMacSafari = !isIOS && /macintosh/i.test(ua) && /safari/i.test(ua) && !/chrome|chromium|crios|edg|firefox|fxios|opr/i.test(ua);
  const isAndroidFirefox = /android/i.test(ua) && /firefox/i.test(ua);
  const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

  let deferred = null;   // evento beforeinstallprompt (Chrome, Edge, Samsung Internet…)
  let swReady = false;

  function update() {
    const manual = isIOS || isMacSafari || isAndroidFirefox;
    const can = swReady && !isStandalone() && (deferred || manual);
    buttons().forEach((b) => { b.hidden = !can; });
  }

  if ('serviceWorker' in navigator && window.isSecureContext) {
    navigator.serviceWorker.register(new URL('sw.js', root), { scope: root.pathname })
      .then(() => { swReady = true; update(); })
      .catch(() => { /* ambiente sem suporte (ex.: pré-visualização): segue sem instalar */ });
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e;
    update();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    update();
    toast('Jogateca instalada! Procure o ícone na sua tela inicial.');
  });

  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-pwa-install]');
    if (!btn) return;
    e.preventDefault();
    if (deferred) {
      const ev = deferred;
      deferred = null;
      ev.prompt();
      try { await ev.userChoice; } catch { /* ignorado */ }
      update();
      return;
    }
    showHelp();
  });

  /* ---------- Instruções para navegadores sem botão automático ---------- */
  function helpSteps() {
    if (isIOS) {
      return [
        'Toque no botão <b>Compartilhar</b> <span aria-hidden="true">(quadrado com seta ↑)</span> na barra do navegador.',
        'Role a lista e toque em <b>Adicionar à Tela de Início</b>.',
        'Confirme em <b>Adicionar</b>. O ícone da Jogateca aparece na tela inicial.',
      ];
    }
    if (isMacSafari) {
      return [
        'No menu do Safari, abra <b>Arquivo</b>.',
        'Clique em <b>Adicionar ao Dock…</b>',
        'Confirme em <b>Adicionar</b>. A Jogateca abre como um app, em janela própria.',
      ];
    }
    return [
      'Abra o menu do navegador <b>⋮</b>.',
      'Toque em <b>Instalar</b> ou <b>Adicionar à tela inicial</b>.',
      'Confirme. O ícone da Jogateca aparece com os seus apps.',
    ];
  }

  function injectStyles() {
    if (document.getElementById('pwa-style')) return;
    const s = document.createElement('style');
    s.id = 'pwa-style';
    s.textContent = `
      .pwa-help { border: 0; padding: 0; background: transparent; color: #f4f4f6; max-width: min(420px, calc(100% - 32px)); }
      .pwa-help::backdrop { background: rgba(0,0,0,.7); }
      .pwa-help-box { background: #16161d; border: 1px solid rgba(255,255,255,.12); border-radius: 16px; padding: 22px 22px 18px;
        font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; box-shadow: 0 20px 60px rgba(0,0,0,.6); }
      .pwa-help-head { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
      .pwa-help-head img { width: 48px; height: 48px; border-radius: 12px; }
      .pwa-help h2 { margin: 0; font-size: 19px; }
      .pwa-help p { margin: 2px 0 0; color: #a3a3b2; font-size: 13px; }
      .pwa-help ol { margin: 0 0 18px; padding-left: 22px; display: grid; gap: 10px; line-height: 1.45; font-size: 15px; }
      .pwa-help button { width: 100%; padding: 12px; border-radius: 999px; border: 0; background: #fff; color: #000;
        font: inherit; font-weight: 700; cursor: pointer; }
      .pwa-help button:focus-visible { outline: 3px solid #ff2e4d; outline-offset: 3px; }
      .pwa-toast { position: fixed; left: 50%; bottom: max(24px, env(safe-area-inset-bottom, 0px)); transform: translateX(-50%);
        background: #fff; color: #000; padding: 10px 18px; border-radius: 999px; font: 700 14px system-ui, sans-serif;
        z-index: 200; box-shadow: 0 8px 24px rgba(0,0,0,.4); max-width: calc(100% - 32px); text-align: center; }`;
    document.head.appendChild(s);
  }

  function showHelp() {
    injectStyles();
    let dlg = document.getElementById('pwaHelp');
    if (!dlg) {
      dlg = document.createElement('dialog');
      dlg.id = 'pwaHelp';
      dlg.className = 'pwa-help';
      dlg.addEventListener('click', (e) => { if (e.target === dlg || e.target.closest('[data-pwa-close]')) dlg.close(); });
      document.body.appendChild(dlg);
    }
    dlg.innerHTML = `
      <div class="pwa-help-box" role="document">
        <div class="pwa-help-head">
          <img src="${new URL('icons/icon-192.png', root)}" alt="">
          <div><h2>Instalar a Jogateca</h2><p>Abre em tela cheia e funciona sem internet.</p></div>
        </div>
        <ol>${helpSteps().map((s) => `<li>${s}</li>`).join('')}</ol>
        <button type="button" data-pwa-close>Entendi</button>
      </div>`;
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
    dlg.querySelector('button').focus();
  }

  function toast(msg) {
    injectStyles();
    const t = document.createElement('div');
    t.className = 'pwa-toast';
    t.setAttribute('role', 'status');
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3500);
  }

  matchMedia('(display-mode: standalone)').addEventListener?.('change', update);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', update);
  else update();
})();
