/* Service worker da Jogateca: deixa o app instalável e jogável offline.
   Estratégia: rede primeiro (sempre pega a versão nova quando há internet),
   cache como reserva quando está offline.
   Ao adicionar arquivos ou jogos, inclua-os em ASSETS e aumente VERSION. */
const VERSION = 'jogateca-v21';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './pwa.js',
  './manifest.webmanifest',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './games/croma/index.html',
  './games/croma/croma.css',
  './games/croma/croma.js',
  './games/tamanho/index.html',
  './games/tamanho/tamanho.css',
  './games/tamanho/tamanho.js',
  './games/sudoku/index.html',
  './games/sudoku/sudoku.css',
  './games/sudoku/sudoku.js',
  './games/sudoku/engine.js',
  './games/canteiros/index.html',
  './games/canteiros/canteiros.css',
  './games/canteiros/canteiros.js',
  './games/canteiros/engine.js',
  './games/pontocruz/index.html',
  './games/pontocruz/pontocruz.css',
  './games/pontocruz/pontocruz.js',
  './games/pontocruz/engine.js',
  './games/pontocruz/pictures.js',
  './games/pontes/index.html',
  './games/pontes/pontes.css',
  './games/pontes/pontes.js',
  './games/pontes/engine.js',
  './games/prensa/index.html',
  './games/prensa/prensa.css',
  './games/prensa/prensa.js',
  './games/prensa/palavras.js',
  './shared/duelo.js',
  './shared/duelo.css',
  './games/sopa/index.html',
  './games/sopa/sopa.css',
  './games/sopa/sopa.js',
  './games/sopa/engine.js',
  './games/sopa/palavras.js',
  './games/contas/index.html',
  './games/contas/contas.css',
  './games/contas/contas.js',
  './games/contas/engine.js',
  './games/binario/index.html',
  './games/binario/binario.css',
  './games/binario/binario.js',
  './games/binario/engine.js',
  './games/garimpo/index.html',
  './games/garimpo/garimpo.css',
  './games/garimpo/garimpo.js',
  './games/garimpo/engine.js',
  './games/escada/index.html',
  './games/escada/escada.css',
  './games/escada/escada.js',
  './games/escada/palavras.js',
  './games/fios/index.html',
  './games/fios/fios.css',
  './games/fios/fios.js',
  './games/fios/engine.js',
  './games/lampioes/index.html',
  './games/lampioes/lampioes.css',
  './games/lampioes/lampioes.js',
  './games/lampioes/engine.js',
  './games/cerca/index.html',
  './games/cerca/cerca.css',
  './games/cerca/cerca.js',
  './games/cerca/engine.js',
  './games/einstein/index.html',
  './games/einstein/einstein.css',
  './games/einstein/einstein.js',
  './games/einstein/engine.js',
  './games/einstein/dados.js',
  './games/travessia/index.html',
  './games/travessia/travessia.css',
  './games/travessia/travessia.js',
  './games/travessia/engine.js',
  './games/travessia/fases.js',
  './games/acampamento/index.html',
  './games/acampamento/acampamento.css',
  './games/acampamento/acampamento.js',
  './games/acampamento/engine.js',
  './games/kakuro/index.html',
  './games/kakuro/kakuro.css',
  './games/kakuro/kakuro.js',
  './games/kakuro/engine.js',
  './games/kakuro/banco.js',
  './games/palavradodia/index.html',
  './games/palavradodia/comum.css',
  './games/palavradodia/colmeia.html',
  './games/palavradodia/colmeia.css',
  './games/palavradodia/colmeia.js',
  './games/palavradodia/colmeia-dados.js',
  './games/palavradodia/proximidade.html',
  './games/palavradodia/proximidade.css',
  './games/palavradodia/proximidade.js',
  './games/palavradodia/proximidade/vocab.js',
  // As listas de proximidade (proximidade/r/*.txt) são guardadas no cache conforme cada dia é jogado.
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Páginas com ?mode=... usam a mesma entrada de cache da página sem parâmetros.
  const isPage = req.mode === 'navigate';
  const key = isPage ? url.origin + url.pathname : req;

  event.respondWith((async () => {
    const cache = await caches.open(VERSION);
    try {
      const res = await fetch(req);
      if (res.ok && res.type === 'basic') cache.put(key, res.clone());
      return res;
    } catch {
      const cached = await cache.match(key, { ignoreSearch: isPage });
      if (cached) return cached;
      if (isPage) {
        const home = await cache.match('./index.html');
        if (home) return home;
      }
      return Response.error();
    }
  })());
});
