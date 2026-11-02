// Gera games/kakuro/banco.js: grades de Kakuro prontas (todas com solução única, que fecham só com raciocínio).
// Uso: node tools/kakuro_banco.js [segundos_por_tamanho] [processos]
// Cada grade é guardada como texto n×n: '#' = casa preta, algarismo = solução da casa branca.
// Gerar 10×10 e 12×12 é lento (segundos por grade), por isso o jogo usa este banco pronto.
const fs = require('fs');
const path = require('path');
const { fork } = require('child_process');
const E = require('../games/kakuro/engine.js');

function mulberry32(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const WANT = { 6: 150, 8: 150, 10: 100, 12: 60 };

// Processo auxiliar: gera grades de um tamanho até o tempo acabar e devolve a lista.
if (process.argv[2] === '--worker') {
  const n = +process.argv[3], seed = +process.argv[4], budget = +process.argv[5], want = +process.argv[6];
  const rnd = mulberry32(seed), list = [], t0 = Date.now();
  while (list.length < want && Date.now() - t0 < budget) {
    try {
      const g = E.generate(n, rnd, 10, n >= 10 ? 120 : 80);
      const runs = E.runsOf(n, g.white).map((r) => ({ ...r, sum: r.cells.reduce((a, i) => a + g.solution[i], 0) }));
      const res = E.logicSolve(n, runs); // confere de novo, do zero, só a partir das somas
      if (res.solved && res.grid.every((d, i) => d === (g.white[i] ? g.solution[i] : 0))) {
        list.push(g.white.map((w, i) => (w ? String(g.solution[i]) : '#')).join(''));
        process.send({ progress: 1 });
      }
    } catch (e) { /* tenta de novo */ }
  }
  process.send({ list });
  process.exit(0);
}

const budget = (+process.argv[2] || 240) * 1000;
const procs = +process.argv[3] || 4;
(async () => {
  const out = {};
  for (const n of [6, 8, 10, 12]) {
    let count = 0;
    const parts = await Promise.all(Array.from({ length: procs }, (_, k) => new Promise((resolve) => {
      const w = fork(__filename, ['--worker', n, 1000 * n + k, budget, Math.ceil(WANT[n] / procs)]);
      w.on('message', (m) => {
        if (m.progress) { count++; process.stderr.write(`${n}x${n}: ${count}/${WANT[n]}\n`); }
        if (m.list) resolve(m.list);
      });
    })));
    out[n] = [...new Set(parts.flat())].slice(0, WANT[n]);
  }
  const file = path.join(__dirname, '..', 'games', 'kakuro', 'banco.js');
  fs.writeFileSync(file, `/* Banco de grades do Kakuro, gerado por tools/kakuro_banco.js.
   Cada grade: texto n×n, '#' = casa preta, algarismo = solução. Todas conferidas pelo resolvedor lógico. */
(function (root) {
  'use strict';
  const BANCO = ${JSON.stringify(out)};
  if (typeof module !== 'undefined' && module.exports) module.exports = BANCO;
  else root.KakuroBanco = BANCO;
})(typeof window !== 'undefined' ? window : globalThis);
`);
  console.log(Object.entries(out).map(([n, l]) => `${n}x${n}: ${l.length}`).join(' | '));
})();
