/* Motor da Travessia: regras, verificação de viagens e busca da menor solução.
   Funciona no navegador (window.TravessiaEngine) e no Node.

   Uma fase tem:
     chars: [{ id, name, emoji, rows (sabe remar), w (peso, opcional) }]
     seats: lugares no barco; maxW: peso máximo (opcional)
     rules: lista de regras
       { t: 'bank', a, b, unless: [ids], msg }  a e b não podem ficar na mesma margem sem alguém de `unless`
       { t: 'boat', a, b, msg }                 a e b não podem ir juntos no barco
       { t: 'outnumber', big: [ids], small: [ids], msg }  numa margem com alguém de `small`,
                                                o grupo `big` não pode ser maior que o `small`
       { t: 'guard', pairs: [[x, dono], ...], msg }  x não pode ficar com o dono de outro sem o próprio dono
       { t: 'needs', a, any: [ids], msg }       a não pode ficar numa margem sem alguém de `any`
                                                (vale também se a ficar sozinho)
   Estado: bit i = margem do personagem i (0 = esquerda, 1 = direita); bit n = margem do barco. */
(function (root) {
  'use strict';

  function prep(level) {
    const idx = {};
    level.chars.forEach((c, i) => { idx[c.id] = i; });
    const bit = (id) => 1 << idx[id];
    const mask = (ids) => ids.reduce((m, id) => m | bit(id), 0);
    const rules = level.rules.map((r) => {
      if (r.t === 'bank') return { ...r, A: bit(r.a), B: bit(r.b), U: mask(r.unless || []) };
      if (r.t === 'boat') return { ...r, A: bit(r.a), B: bit(r.b) };
      if (r.t === 'outnumber') return { ...r, BIG: r.big.map(bit), SMALL: r.small.map(bit) };
      if (r.t === 'guard') return { ...r, P: r.pairs.map(([x, o]) => [bit(x), bit(o)]), OWN: mask(r.pairs.map((p) => p[1])) };
      if (r.t === 'needs') return { ...r, A: bit(r.a), ANY: mask(r.any) };
      return r;
    });
    const n = level.chars.length;
    return { n, idx, bit, rules, all: (1 << n) - 1, rowers: mask(level.chars.filter((c) => c.rows).map((c) => c.id)) };
  }
  const count = (m) => { let k = 0; while (m) { m &= m - 1; k++; } return k; };

  // Confere um grupo (os que estão numa margem). Devolve a regra quebrada ou null.
  function bankBroken(P, group) {
    for (const r of P.rules) {
      if (r.t === 'bank' && (group & r.A) && (group & r.B) && !(group & r.U)) return r;
      if (r.t === 'outnumber') {
        const small = r.SMALL.filter((b) => group & b).length;
        const big = r.BIG.filter((b) => group & b).length;
        if (small > 0 && big > small) return r;
      }
      if (r.t === 'guard') {
        for (const [x, o] of r.P) {
          if ((group & x) && !(group & o) && (group & r.OWN & ~o)) return r;
        }
      }
      if (r.t === 'needs' && (group & r.A) && !(group & r.ANY)) return r;
    }
    return null;
  }

  // Confere quem embarca. Devolve { ok, msg, rule }.
  function boatCheck(level, P, boat) {
    if (!boat) return { ok: false, msg: 'O barco está vazio.' };
    if (count(boat) > level.seats) return { ok: false, msg: `O barco leva no máximo ${level.seats}.` };
    if (!(boat & P.rowers)) return { ok: false, msg: 'Ninguém no barco sabe remar.' };
    if (level.maxW) {
      const w = level.chars.reduce((s, c, i) => s + (boat & (1 << i) ? c.w || 0 : 0), 0);
      if (w > level.maxW) return { ok: false, msg: `Peso demais: o barco aguenta ${level.maxW} e vocês somam ${w}.` };
    }
    for (const r of P.rules) {
      if (r.t === 'boat' && (boat & r.A) && (boat & r.B)) return { ok: false, msg: r.msg, rule: r };
      // Regras de margem marcadas com `boat: true` valem também dentro do barco.
      if (r.boat && bankBroken({ rules: [r] }, boat)) return { ok: false, msg: r.msg + ' (no barco)', rule: r };
    }
    return { ok: true };
  }

  // Faz a viagem. Devolve { state, broken } (broken = regra quebrada numa das margens, ou null).
  function cross(level, P, state, boat) {
    const next = state ^ boat ^ (1 << P.n);
    const right = next & P.all, left = ~next & P.all;
    const broken = bankBroken(P, left) || bankBroken(P, right);
    return { state: next, broken };
  }

  // Busca em largura: menor número de viagens. Devolve a lista de barcos (máscaras) ou null.
  function solve(level, start = 0) {
    const P = prep(level);
    const goal = P.all | (1 << P.n);
    const prev = new Map([[start, null]]);
    const queue = [start];
    // todos os barcos possíveis
    const boats = [];
    for (let m = 1; m <= P.all; m++) if (boatCheck(level, P, m).ok) boats.push(m);
    while (queue.length) {
      const s = queue.shift();
      if (s === goal) break;
      const side = (s >> P.n) & 1;
      const here = side ? s & P.all : ~s & P.all;
      for (const b of boats) {
        if ((b & here) !== b) continue;
        const { state, broken } = cross(level, P, s, b);
        if (broken || prev.has(state)) continue;
        prev.set(state, [s, b]);
        queue.push(state);
      }
    }
    if (!prev.has(goal)) return null;
    const path = [];
    for (let s = goal; prev.get(s); s = prev.get(s)[0]) path.unshift(prev.get(s)[1]);
    return path;
  }

  const api = { prep, bankBroken, boatCheck, cross, solve, count };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TravessiaEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);
