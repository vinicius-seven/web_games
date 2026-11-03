/* Categorias do Enigma de Einstein e o jeito de falar de cada valor nas pistas. */
(function (root) {
  'use strict';
  const CATS = {
    cor: {
      name: 'Cor', icon: '🎨', kind: 'cor',
      values: [
        { id: 'vermelha', color: '#e5484d' }, { id: 'azul', color: '#3e7bd6' }, { id: 'verde', color: '#3fa34d' },
        { id: 'amarela', color: '#f2c14e' }, { id: 'branca', color: '#f4f1ea' }, { id: 'roxa', color: '#8e5bd0' },
      ],
    },
    morador: {
      name: 'Morador', icon: '🙂', kind: 'pessoa',
      values: [
        { id: 'Ana', emoji: '👩', art: 'a' }, { id: 'Bruno', emoji: '👨', art: 'o' }, { id: 'Carla', emoji: '👩‍🦰', art: 'a' },
        { id: 'Davi', emoji: '👨‍🦱', art: 'o' }, { id: 'Elisa', emoji: '👱‍♀️', art: 'a' }, { id: 'Fábio', emoji: '🧔', art: 'o' },
      ],
    },
    bicho: {
      name: 'Bicho', icon: '🐾',
      values: [
        { id: 'cachorro', emoji: '🐶', pred: 'tem o cachorro' }, { id: 'gato', emoji: '🐱', pred: 'tem o gato' },
        { id: 'papagaio', emoji: '🦜', pred: 'tem o papagaio' }, { id: 'peixe', emoji: '🐟', pred: 'tem o peixe' },
        { id: 'tartaruga', emoji: '🐢', pred: 'tem a tartaruga' }, { id: 'coelho', emoji: '🐰', pred: 'tem o coelho' },
      ],
    },
    bebida: {
      name: 'Bebida', icon: '🥤',
      values: [
        { id: 'café', emoji: '☕', pred: 'bebe café' }, { id: 'chá', emoji: '🍵', pred: 'bebe chá' },
        { id: 'leite', emoji: '🥛', pred: 'bebe leite' }, { id: 'suco', emoji: '🧃', pred: 'bebe suco' },
        { id: 'água', emoji: '💧', pred: 'bebe água' }, { id: 'refri', emoji: '🥤', pred: 'bebe refrigerante' },
      ],
    },
    esporte: {
      name: 'Esporte', icon: '🏅',
      values: [
        { id: 'futebol', emoji: '⚽', pred: 'joga futebol' }, { id: 'vôlei', emoji: '🏐', pred: 'joga vôlei' },
        { id: 'tênis', emoji: '🎾', pred: 'joga tênis' }, { id: 'basquete', emoji: '🏀', pred: 'joga basquete' },
        { id: 'xadrez', emoji: '♟️', pred: 'joga xadrez' }, { id: 'natação', emoji: '🏊', pred: 'faz natação' },
      ],
    },
    fruta: {
      name: 'Fruta', icon: '🍎',
      values: [
        { id: 'maçã', emoji: '🍎', pred: 'gosta de maçã' }, { id: 'banana', emoji: '🍌', pred: 'gosta de banana' },
        { id: 'uva', emoji: '🍇', pred: 'gosta de uva' }, { id: 'manga', emoji: '🥭', pred: 'gosta de manga' },
        { id: 'abacaxi', emoji: '🍍', pred: 'gosta de abacaxi' }, { id: 'morango', emoji: '🍓', pred: 'gosta de morango' },
      ],
    },
    musica: {
      name: 'Instrumento', icon: '🎵',
      values: [
        { id: 'violão', emoji: '🎸', pred: 'toca violão' }, { id: 'bateria', emoji: '🥁', pred: 'toca bateria' },
        { id: 'piano', emoji: '🎹', pred: 'toca piano' }, { id: 'trompete', emoji: '🎺', pred: 'toca trompete' },
        { id: 'violino', emoji: '🎻', pred: 'toca violino' }, { id: 'sanfona', emoji: '🪗', pred: 'toca sanfona' },
      ],
    },
  };
  const OPTIONAL = ['bicho', 'bebida', 'esporte', 'fruta', 'musica'];

  // Frases. `v` é o objeto do valor, `cat` a categoria.
  const subj = (cat, v) => (cat.kind === 'cor' ? `a casa ${v.id}` : cat.kind === 'pessoa' ? `${v.art} ${v.id}` : `quem ${v.pred}`);
  const pred = (cat, v) => (cat.kind === 'cor' ? `mora na casa ${v.id}` : cat.kind === 'pessoa' ? `é ${v.art} ${v.id}` : v.pred);
  const ref = (cat, v) => (cat.kind === 'cor' ? `da casa ${v.id}` : cat.kind === 'pessoa' ? `${v.art === 'a' ? 'da' : 'do'} ${v.id}` : `de quem ${v.pred}`);
  const verb = (cat) => (cat.kind === 'cor' ? 'fica' : 'mora');
  const ORD = ['primeira', 'segunda', 'terceira', 'quarta', 'quinta', 'sexta'];
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  // get(item) → { cat, v } ; item = [categoria, valor] no enigma
  function sentence(q, get, n) {
    let A = get(q.a), B = q.b ? get(q.b) : null;
    if ((q.t === 'same' || q.t === 'not') && A.cat.kind === 'cor') [A, B] = [B, A];
    switch (q.t) {
      case 'same': return `${cap(subj(A.cat, A.v))} ${pred(B.cat, B.v)}.`;
      case 'not': return `${cap(subj(A.cat, A.v))} não ${pred(B.cat, B.v)}.`;
      case 'pos': {
        const where = q.k === n - 1 ? 'última' : ORD[q.k];
        if (A.cat.kind === 'cor') return `A casa ${A.v.id} é a ${where} da rua.`;
        if (n % 2 === 1 && q.k === (n - 1) / 2 && n > 3) return `${cap(subj(A.cat, A.v))} mora na casa do meio.`;
        return `${cap(subj(A.cat, A.v))} mora na ${where} casa.`;
      }
      case 'next': return `${cap(subj(A.cat, A.v))} ${verb(A.cat)} ao lado ${ref(B.cat, B.v)}.`;
      case 'left': return `${cap(subj(A.cat, A.v))} ${verb(A.cat)} logo à esquerda ${ref(B.cat, B.v)}.`;
      case 'before': return `${cap(subj(A.cat, A.v))} ${verb(A.cat)} em algum lugar à esquerda ${ref(B.cat, B.v)}.`;
      default: return '';
    }
  }

  const api = { CATS, OPTIONAL, sentence };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.EinsteinDados = api;
})(typeof window !== 'undefined' ? window : globalThis);
