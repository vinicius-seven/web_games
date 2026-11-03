/* Fases da Travessia. Cada uma foi conferida pela busca do motor (tools: node games/travessia/conferir.js):
   tem solução, e `best` é o menor número de viagens possível. */
(function (root) {
  'use strict';
  const FASES = [
    {
      id: 'feira',
      title: 'Volta da feira',
      story: 'Seu Zé comprou uma cabra e um maço de couve na feira, e uma onça mansa resolveu seguir ele até o rio. Só ele rema, e a canoa leva duas criaturas.',
      seats: 2,
      chars: [
        { id: 'ze', name: 'Seu Zé', emoji: '👨‍🌾', rows: true },
        { id: 'onca', name: 'Onça', emoji: '🐆' },
        { id: 'cabra', name: 'Cabra', emoji: '🐐' },
        { id: 'couve', name: 'Couve', emoji: '🥬' },
      ],
      rules: [
        { t: 'bank', a: 'onca', b: 'cabra', unless: ['ze'], msg: 'Sem o Seu Zé por perto, a onça avança na cabra.' },
        { t: 'bank', a: 'cabra', b: 'couve', unless: ['ze'], msg: 'Sem o Seu Zé por perto, a cabra come a couve.' },
      ],
    },
    {
      id: 'familia',
      title: 'Família na canoa',
      story: 'A canoa aguenta 100 kg. Todo mundo rema, mas ninguém pode afundar a canoa.',
      seats: 2,
      maxW: 100,
      chars: [
        { id: 'pai', name: 'Pai', emoji: '👨', rows: true, w: 80 },
        { id: 'mae', name: 'Mãe', emoji: '👩', rows: true, w: 70 },
        { id: 'bia', name: 'Bia', emoji: '👧', rows: true, w: 40 },
        { id: 'teo', name: 'Téo', emoji: '👦', rows: true, w: 45 },
      ],
      rules: [],
    },
    {
      id: 'gatos',
      title: 'Gatos e ratos',
      story: 'Três ratos e três gatos precisam cruzar. Todos remam. Se numa margem houver mais gatos do que ratos, os gatos perdem a cerimônia.',
      seats: 2,
      chars: [
        { id: 'r1', name: 'Rato', emoji: '🐭', rows: true, tone: 1 },
        { id: 'r2', name: 'Rato', emoji: '🐭', rows: true, tone: 2 },
        { id: 'r3', name: 'Rato', emoji: '🐭', rows: true, tone: 3 },
        { id: 'g1', name: 'Gato', emoji: '🐱', rows: true, tone: 1 },
        { id: 'g2', name: 'Gato', emoji: '🐱', rows: true, tone: 2 },
        { id: 'g3', name: 'Gato', emoji: '🐱', rows: true, tone: 3 },
      ],
      rules: [
        { t: 'outnumber', big: ['g1', 'g2', 'g3'], small: ['r1', 'r2', 'r3'], msg: 'Numa margem ficaram mais gatos do que ratos.' },
      ],
    },
    {
      id: 'magicos',
      title: 'Mestres e aprendizes',
      story: 'Três mágicos viajam com seus aprendizes. Todos remam. Um aprendiz só pode ficar perto de outro mágico se o seu próprio mestre estiver junto — senão, segredos de truque mudam de dono.',
      seats: 2,
      chars: [
        { id: 'm1', name: 'Mestre', emoji: '🧙‍♂️', rows: true, tone: 1 },
        { id: 'm2', name: 'Mestra', emoji: '🧙‍♀️', rows: true, tone: 2 },
        { id: 'm3', name: 'Mestre', emoji: '🧙', rows: true, tone: 3 },
        { id: 'a1', name: 'Aprendiz', emoji: '🧒', rows: true, tone: 1 },
        { id: 'a2', name: 'Aprendiz', emoji: '👧', rows: true, tone: 2 },
        { id: 'a3', name: 'Aprendiz', emoji: '👦', rows: true, tone: 3 },
      ],
      rules: [
        { t: 'guard', pairs: [['a1', 'm1'], ['a2', 'm2'], ['a3', 'm3']], msg: 'Um aprendiz ficou com outro mágico sem o próprio mestre.' },
      ],
    },
    {
      id: 'circo',
      title: 'O circo vai à cidade',
      story: 'O circo precisa cruzar o rio numa jangada de dois lugares. Só os artistas remam. O leão só se comporta com o domador por perto, e o coelho da mágica adora bolo.',
      seats: 2,
      chars: [
        { id: 'dom', name: 'Domadora', emoji: '🧑‍🎤', rows: true },
        { id: 'leao', name: 'Leão', emoji: '🦁' },
        { id: 'mag', name: 'Mágico', emoji: '🧙‍♂️', rows: true },
        { id: 'coelho', name: 'Coelho', emoji: '🐇' },
        { id: 'pal', name: 'Palhaço', emoji: '🤡', rows: true },
        { id: 'bolo', name: 'Bolo', emoji: '🎂' },
      ],
      rules: [
        { t: 'bank', a: 'leao', b: 'pal', unless: ['dom'], msg: 'Sem a domadora, o leão assusta o palhaço.' },
        { t: 'bank', a: 'leao', b: 'mag', unless: ['dom'], msg: 'Sem a domadora, o leão assusta o mágico.' },
        { t: 'bank', a: 'leao', b: 'coelho', unless: ['dom'], msg: 'Sem a domadora, o leão vai atrás do coelho.' },
        { t: 'bank', a: 'coelho', b: 'bolo', unless: ['mag'], msg: 'Sem o mágico, o coelho come o bolo.' },
        { t: 'boat', a: 'pal', b: 'mag', msg: 'Palhaço e mágico brigam por quem rema.' },
      ],
    },
    {
      id: 'primos',
      title: 'Primos briguentos',
      story: 'Cinco primos voltam da pescaria numa canoa de dois lugares. Só Ana, Beto e Duda remam. Alguns brigam se dividirem a canoa, e há quem não fique longe de certos primos.',
      seats: 2,
      chars: [
        { id: 'ana', name: 'Ana', emoji: '👧', rows: true },
        { id: 'beto', name: 'Beto', emoji: '👦', rows: true },
        { id: 'duda', name: 'Duda', emoji: '👩', rows: true },
        { id: 'caio', name: 'Caio', emoji: '🧒' },
        { id: 'nina', name: 'Nina', emoji: '👶' },
      ],
      rules: [
        { t: 'boat', a: 'ana', b: 'beto', msg: 'Ana e Beto brigam se forem juntos na canoa.' },
        { t: 'boat', a: 'beto', b: 'duda', msg: 'Beto e Duda brigam se forem juntos na canoa.' },
        { t: 'needs', a: 'nina', any: ['ana', 'duda', 'caio'], msg: 'A Nina, a caçula, só fica numa margem com Ana, Duda ou Caio.' },
        { t: 'needs', a: 'duda', any: ['beto', 'caio'], msg: 'A Duda só fica numa margem com Beto ou Caio.' },
      ],
    },
    {
      id: 'galinhas',
      title: 'Galinhas e raposas',
      story: 'Quatro galinhas e quatro raposas, um bote de três lugares, e todo mundo rema. Numa margem (ou no bote) com galinhas, as raposas nunca podem ser maioria.',
      seats: 3,
      chars: [
        { id: 'c1', name: 'Galinha', emoji: '🐔', rows: true, tone: 1 },
        { id: 'c2', name: 'Galinha', emoji: '🐔', rows: true, tone: 2 },
        { id: 'c3', name: 'Galinha', emoji: '🐔', rows: true, tone: 3 },
        { id: 'c4', name: 'Galinha', emoji: '🐔', rows: true, tone: 4 },
        { id: 'f1', name: 'Raposa', emoji: '🦊', rows: true, tone: 1 },
        { id: 'f2', name: 'Raposa', emoji: '🦊', rows: true, tone: 2 },
        { id: 'f3', name: 'Raposa', emoji: '🦊', rows: true, tone: 3 },
        { id: 'f4', name: 'Raposa', emoji: '🦊', rows: true, tone: 4 },
      ],
      rules: [
        { t: 'outnumber', big: ['f1', 'f2', 'f3', 'f4'], small: ['c1', 'c2', 'c3', 'c4'], boat: true, msg: 'Ficaram mais raposas do que galinhas.' },
      ],
    },
    {
      id: 'junina',
      title: 'Festa junina',
      story: 'A família atravessa o rio para a festa com os bichos. A canoa leva dois, e todos os humanos remam. O cachorro não fica com o gato, nem o gato com a galinha, sem um adulto. As crianças também não ficam com os bichos sem um adulto.',
      seats: 2,
      chars: [
        { id: 'seu', name: 'Seu Tião', emoji: '👨‍🌾', rows: true },
        { id: 'dona', name: 'Dona Rosa', emoji: '👩‍🌾', rows: true },
        { id: 'zeca', name: 'Zeca', emoji: '👦', rows: true },
        { id: 'lia', name: 'Lia', emoji: '👧', rows: true },
        { id: 'cao', name: 'Cachorro', emoji: '🐕' },
        { id: 'gato', name: 'Gato', emoji: '🐈' },
        { id: 'gal', name: 'Galinha', emoji: '🐓' },
      ],
      rules: [
        { t: 'bank', a: 'cao', b: 'gato', unless: ['seu', 'dona'], msg: 'Sem um adulto, o cachorro corre atrás do gato.' },
        { t: 'bank', a: 'gato', b: 'gal', unless: ['seu', 'dona'], msg: 'Sem um adulto, o gato assusta a galinha.' },
        { t: 'bank', a: 'zeca', b: 'cao', unless: ['seu', 'dona'], msg: 'As crianças não ficam com os bichos sem um adulto.' },
        { t: 'bank', a: 'zeca', b: 'gato', unless: ['seu', 'dona'], msg: 'As crianças não ficam com os bichos sem um adulto.' },
        { t: 'bank', a: 'zeca', b: 'gal', unless: ['seu', 'dona'], msg: 'As crianças não ficam com os bichos sem um adulto.' },
        { t: 'bank', a: 'lia', b: 'cao', unless: ['seu', 'dona'], msg: 'As crianças não ficam com os bichos sem um adulto.' },
        { t: 'bank', a: 'lia', b: 'gato', unless: ['seu', 'dona'], msg: 'As crianças não ficam com os bichos sem um adulto.' },
        { t: 'bank', a: 'lia', b: 'gal', unless: ['seu', 'dona'], msg: 'As crianças não ficam com os bichos sem um adulto.' },
        { t: 'boat', a: 'zeca', b: 'lia', msg: 'Zeca e Lia não vão juntos: brigam pelo remo.' },
        { t: 'boat', a: 'seu', b: 'dona', msg: 'Seu Tião e Dona Rosa não cabem juntos com a roupa de festa.' },
      ],
    },
    {
      id: 'mestres4',
      title: 'Congresso de mágica',
      story: 'Agora são quatro mágicos e quatro aprendizes, com um bote de três lugares. Todos remam. Mesma regra: aprendiz perto de outro mágico só com o próprio mestre junto — inclusive dentro do bote.',
      seats: 3,
      chars: [
        { id: 'm1', name: 'Mestre', emoji: '🧙‍♂️', rows: true, tone: 1 },
        { id: 'm2', name: 'Mestra', emoji: '🧙‍♀️', rows: true, tone: 2 },
        { id: 'm3', name: 'Mestre', emoji: '🧙', rows: true, tone: 3 },
        { id: 'm4', name: 'Mestra', emoji: '🧙‍♀️', rows: true, tone: 4 },
        { id: 'a1', name: 'Aprendiz', emoji: '🧒', rows: true, tone: 1 },
        { id: 'a2', name: 'Aprendiz', emoji: '👧', rows: true, tone: 2 },
        { id: 'a3', name: 'Aprendiz', emoji: '👦', rows: true, tone: 3 },
        { id: 'a4', name: 'Aprendiz', emoji: '🧒', rows: true, tone: 4 },
      ],
      rules: [
        { t: 'guard', pairs: [['a1', 'm1'], ['a2', 'm2'], ['a3', 'm3'], ['a4', 'm4']], boat: true, msg: 'Um aprendiz ficou com outro mágico sem o próprio mestre.' },
      ],
    },
  ];
  if (typeof module !== 'undefined' && module.exports) module.exports = FASES;
  else root.TravessiaFases = FASES;
})(typeof window !== 'undefined' ? window : globalThis);
