/* Service worker da Jogateca: deixa o app instalável e jogável offline.
   Estratégia: rede primeiro (sempre pega a versão nova quando há internet),
   cache como reserva quando está offline.
   Ao adicionar arquivos ou jogos, inclua-os em ASSETS e aumente VERSION. */
const VERSION = 'jogateca-v12';
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
