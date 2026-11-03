// Confere as fases: node games/travessia/conferir.js
const E = require('./engine.js');
const FASES = require('./fases.js');
for (const f of FASES) {
  const t0 = Date.now();
  const path = E.solve(f);
  const P = E.prep(f);
  const fmt = (b) => f.chars.filter((c, i) => b & (1 << i)).map((c) => c.id).join('+');
  console.log(`${f.id.padEnd(10)} ${path ? `mínimo ${path.length} viagens` : 'SEM SOLUÇÃO'} (${Date.now() - t0} ms)${process.argv[2] ? '\n   ' + (path || []).map(fmt).join(' | ') : ''}`);
}
