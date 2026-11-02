/* Coleção de figuras do Ponto-Cruz. Cada letra é uma casa bordada com aquela cor de linha; '.' é tecido.
   Todas foram conferidas: fecham só com raciocínio linha a linha (engine.logicSolve). */
(function (root) {
  'use strict';

  const THREADS = {
    k: '#2b2a33', r: '#d1342f', p: '#ec7fa9', o: '#ef8a22', y: '#f2c12e', g: '#3f9b41', d: '#22663a',
    b: '#2f6fd1', c: '#53b6dc', w: '#fbf8f0', n: '#8a5a2b', v: '#7d4fb5', s: '#8d939e',
  };

  const PICTURES = [
    // 5×5
    { id: 'coracao', name: 'Coração', rows: ['.r.r.', 'rrrrr', 'rrrrr', '.rrr.', '..r..'] },
    { id: 'casa', name: 'Casinha', rows: ['..r..', '.rrr.', 'rrrrr', '.ncn.', '.nnn.'] },
    { id: 'estrela', name: 'Estrela', rows: ['..y..', '.yyy.', 'yyyyy', '.yyy.', '.y.y.'] },
    { id: 'cogumelo5', name: 'Cogumelo', rows: ['.rrr.', 'rrrrr', 'r.r.r', '..w..', '.www.'] },
    { id: 'sorriso', name: 'Sorriso', rows: ['.yyy.', 'y.y.y', 'yyyyy', 'y...y', '.yyy.'] },
    { id: 'seta', name: 'Seta', rows: ['..b..', '.bbb.', 'bbbbb', '..b..', '..b..'] },
    // 10×10
    { id: 'gato', name: 'Gato', rows: [
      '.k......k.', '.kk....kk.', '.kkkkkkkk.', 'kk.kkkk.kk', 'kk.kkkk.kk',
      'kkkkppkkkk', 'kkkkkkkkkk', '.kkk..kkk.', '..kkkkkk..', '...kkkk...'] },
    { id: 'peixe', name: 'Peixe', rows: [
      '........c.', '.....ooo..', 'o..oooooo.', 'ooooooo.oo', 'oooooooooo',
      'o..ooooooo', '.....oooo.', '..........', '.g...g..g.', '.g.g.g.gg.'] },
    { id: 'cogumelo', name: 'Cogumelo', rows: [
      '...rrrr...', '.rrrrrrrr.', 'rr..rrr.rr', 'rr..rrrrrr', 'rrrrrr..rr',
      '.rrrrrrrr.', '...wwww...', '...wwww...', '...wwww...', '..wwwwww..'] },
    { id: 'barco', name: 'Barco à vela', rows: [
      '....w.....', '....ww....', '....www...', '....wwww..', '....wwwww.',
      '....n.....', 'nnnnnnnnnn', '.nnnnnnnn.', '..nnnnnn..', 'b.b.b.b.b.'] },
    { id: 'arvore', name: 'Pinheiro', rows: [
      '....gg....', '...gggg...', '..gggggg..', '...gggg...', '..gggggg..',
      '.gggggggg.', 'gggggggggg', '....nn....', '....nn....', '..nnnnnn..'] },
    { id: 'guardachuva', name: 'Guarda-chuva', rows: [
      '....rr....', '..rrrrrr..', '.rrrrrrrr.', 'rrrrrrrrrr', 'rr.rrrr.rr',
      '....k.....', '....k.....', '....k.....', '....k..k..', '.....kk...'] },
    { id: 'xicara', name: 'Xícara', rows: [
      '...s..s...', '..s..s....', '...s..s...', '..........', '.ccccccc..',
      '.cccccccc.', '.ccccccc.c', '.cccccccc.', '..ccccc...', '.ccccccc..'] },
    { id: 'flor', name: 'Flor', rows: [
      '....pp....', '..pppppp..', '.ppyyyypp.', '.ppyyyypp.', '..pppppp..',
      '....pp....', '....g.....', '.gg.g.....', '..ggg.....', '....g.....'] },
    { id: 'nota', name: 'Nota musical', rows: [
      '....kkkkkk', '....kkkkkk', '....k....k', '....k....k', '....k....k',
      '....k....k', '..kkk..kkk', '.kkkk.kkkk', '.kkkk.kkkk', '..kk...kk.'] },
    // 15×15
    { id: 'foguete', name: 'Foguete', rows: [
      '.......r.......', '......rrr......', '.....rrrrr.....', '.....sssss.....', '.....s...s.....',
      '.....s...s.....', '.....sssss.....', '.....sssss.....', '....rsssssr....', '...rrsssssrr...',
      '..rrrsssssrrr..', '..rr.sssss.rr..', '......o.o......', '.....o.o.o.....', '......o.o......'] },
    { id: 'cacto', name: 'Cacto', rows: [
      '.......g.......', '......ggg......', '......ggg......', '......ggg...g..', '..g...ggg..ggg.',
      '.ggg..ggg..ggg.', '.ggg..ggg..ggg.', '.ggg..ggggggg..', '..gggggggggg...', '......ggg......',
      '......ggg......', '....nnnnnnn....', '....nnnnnnn....', '.....nnnnn.....', '.....nnnnn.....'] },
  ];

  // Converte o desenho em grade 0/1 + cor de cada casa.
  for (const p of PICTURES) {
    p.h = p.rows.length;
    p.w = p.rows[0].length;
    p.grid = [];
    p.colors = [];
    for (const row of p.rows) for (const ch of row) {
      p.grid.push(ch === '.' ? 0 : 1);
      p.colors.push(ch === '.' ? null : THREADS[ch]);
    }
  }

  const api = { PICTURES, THREADS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PontoCruzPictures = api;
})(typeof window !== 'undefined' ? window : globalThis);
