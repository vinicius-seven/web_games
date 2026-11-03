(() => {
  'use strict';

  /* ---------- Catálogo ---------- */
  // Para adicionar um jogo: inclua um objeto aqui e (se tiver arte própria) uma classe .art-<id> no style.css.
  const GAMES = [
    {
      id: 'croma',
      title: 'Croma',
      status: 'available',
      href: 'games/croma/index.html',
      tagline: 'Quão afiado é o seu olho para cores?',
      description:
        'Memorize uma cor e recrie-a de cabeça, encare o desafio diário — as mesmas cores para todo mundo — ou ache o quadrado de tom diferente antes que o tempo acabe.',
      tags: ['Cores', 'Percepção', 'Memória', 'Casual'],
      year: 2026,
      age: 'L',
      meta: '3 modos',
      match: 98,
      duration: '1–5 min por partida',
    },
    {
      id: 'tamanho',
      title: 'Tamanho Certo',
      subtitle: 'Ilimitado',
      status: 'available',
      href: 'games/tamanho/index.html',
      tagline: 'Seu olho mede bem?',
      description:
        'Iguale figuras, marque frações de uma barra, diga quantas vezes uma forma é maior que a outra e reproduza comprimentos de memória. Rodadas sem fim, com a margem de erro fechando a cada acerto.',
      tags: ['Percepção', 'Estimativa', 'Casual'],
      year: 2026,
      age: 'L',
      meta: '2 modos',
      match: 96,
      duration: 'Partidas sem fim',
    },
    {
      id: 'sudoku',
      title: 'Sudoku',
      status: 'available',
      href: 'games/sudoku/index.html',
      tagline: 'O clássico dos números, sem pressa.',
      description:
        'Grades novas a cada partida, sempre com solução única, em quatro dificuldades. Anotações, desfazer, dicas e progresso salvo, além de um Sudoku do dia igual para todo mundo.',
      tags: ['Lógica', 'Números', 'Clássico'],
      year: 2026,
      age: 'L',
      meta: '4 dificuldades',
      match: 97,
      duration: '5–30 min por grade',
    },
    {
      id: 'canteiros',
      title: 'Canteiros',
      status: 'available',
      href: 'games/canteiros/index.html',
      tagline: 'Uma flor por linha, por coluna e por canteiro.',
      description:
        'Quebra-cabeça de lógica num jardim: plante uma flor em cada linha, coluna e canteiro, sem que duas flores se encostem. Tabuleiros novos a cada partida, sempre com uma única solução, e um jardim do dia igual para todo mundo.',
      tags: ['Lógica', 'Quebra-cabeça', 'Casual'],
      year: 2026,
      age: 'L',
      meta: '4 tamanhos',
      match: 97,
      duration: '2–15 min por jardim',
    },
    {
      id: 'pontocruz',
      title: 'Ponto-Cruz',
      subtitle: 'Nonograma',
      status: 'available',
      href: 'games/pontocruz/index.html',
      tagline: 'Siga os números e descubra o desenho bordado.',
      description:
        'Nonogramas num tecido de bordado: os números dizem quantos pontos seguidos vão em cada linha e coluna. Complete a coleção de desenhos, borde motivos simétricos sem fim ou encare o motivo do dia.',
      tags: ['Lógica', 'Quebra-cabeça', 'Desenho'],
      year: 2026,
      age: 'L',
      meta: 'Coleção + motivos',
      match: 96,
      duration: '2–20 min por bordado',
    },
    {
      id: 'pontes',
      title: 'Pontes',
      status: 'available',
      href: 'games/pontes/index.html',
      tagline: 'Ligue as ilhas do arquipélago.',
      description:
        'Quebra-cabeça de lógica num mar tropical: cada ilha diz quantas pontes saem dela. Pontes retas, no máximo duas entre as mesmas ilhas, sem cruzar, e todas as ilhas ligadas no fim. Mapas novos a cada partida e um mapa do dia.',
      tags: ['Lógica', 'Quebra-cabeça', 'Casual'],
      year: 2026,
      age: 'L',
      meta: '4 tamanhos',
      match: 96,
      duration: '3–20 min por mapa',
    },
    {
      id: 'sopa',
      title: 'Sopa Relâmpago',
      status: 'available',
      href: 'games/sopa/index.html',
      tagline: 'Palavras contra o relógio — sozinho ou em duelo.',
      description:
        'Uma tigela de sopa de letrinhas e 2 minutos para achar palavras ligando letras vizinhas. Jogue sozinho atrás do recorde ou em duelo com até 4 pessoas no mesmo aparelho: todo mundo recebe a mesma tigela e o placar aparece no fim.',
      tags: ['Palavras', 'Duelo', 'Rápido'],
      year: 2026,
      age: 'L',
      meta: 'Duelo até 4',
      match: 98,
      duration: '1–3 min por rodada',
    },
    {
      id: 'contas',
      title: 'Contas Relâmpago',
      status: 'available',
      href: 'games/contas/index.html',
      tagline: 'Quantas contas de cabeça em 60 segundos?',
      description:
        'Soma, subtração, multiplicação e divisão num placar de LED, cada vez mais difíceis. Acertos seguidos valem bônus. Sozinho ou em duelo com até 4 pessoas no mesmo aparelho, com as mesmas contas para todos.',
      tags: ['Números', 'Duelo', 'Rápido'],
      year: 2026,
      age: 'L',
      meta: 'Duelo até 4',
      match: 96,
      duration: '1–2 min por rodada',
    },
    {
      id: 'binario',
      title: 'Binário',
      status: 'available',
      href: 'games/binario/index.html',
      tagline: 'Zeros e uns num painel de azulejos.',
      description:
        'Complete o painel com azulejos brancos (0) e azuis (1): nunca três iguais seguidos, metade de cada em toda linha e coluna, e nenhuma linha ou coluna repetida. Painéis novos a cada partida, sempre com uma única solução, e um painel do dia.',
      tags: ['Lógica', 'Casual'],
      year: 2026,
      age: 'L',
      meta: '4 tamanhos',
      match: 97,
      duration: '2–15 min por painel',
    },
    {
      id: 'garimpo',
      title: 'Garimpo',
      status: 'available',
      href: 'games/garimpo/index.html',
      tagline: 'Cave sem cair nos buracos — e sem precisar chutar.',
      description:
        'Os números dizem quantos buracos há nas oito casas em volta. Cave todo o terreno seguro e marque os buracos com estacas. Todo terreno é gerado para fechar só com lógica, sem aquele chute no fim. Quatro tamanhos e um terreno do dia.',
      tags: ['Lógica', 'Clássico'],
      year: 2026,
      age: 'L',
      meta: '4 tamanhos',
      match: 98,
      duration: '2–15 min por terreno',
    },
    {
      id: 'escada',
      title: 'Escada',
      status: 'available',
      href: 'games/escada/index.html',
      tagline: 'De uma palavra a outra, uma letra por vez.',
      description:
        'Suba de GATO a PELO trocando uma letra por degrau, sempre formando palavras de verdade. Escadas do dia de 4 e de 5 letras, iguais para todo mundo, e escadas livres sem limite. Chegue no mínimo de degraus para levar 3 estrelas.',
      tags: ['Palavras', 'Diário', 'Raciocínio'],
      year: 2026,
      age: 'L',
      meta: '4 modos',
      match: 96,
      duration: '1–5 min por escada',
    },
    {
      id: 'fios',
      title: 'Fios',
      status: 'available',
      href: 'games/fios/index.html',
      tagline: 'Ligue os pinos da mesma cor e use a placa inteira.',
      description:
        'Quebra-cabeça numa placa de circuito: puxe um fio entre os dois pinos de cada cor, sem cruzar outros fios, até preencher todas as casas. Placas novas a cada partida, sempre com uma única solução, e uma placa do dia.',
      tags: ['Lógica', 'Casual'],
      year: 2026,
      age: 'L',
      meta: '4 tamanhos',
      match: 97,
      duration: '1–10 min por placa',
    },
    {
      id: 'lampioes',
      title: 'Lampiões',
      status: 'available',
      href: 'games/lampioes/index.html',
      tagline: 'Ilumine a praça sem um lampião iluminar outro.',
      description:
        'Quebra-cabeça de lógica numa praça antiga à noite: cada lampião ilumina em linha reta até bater num muro. Ilumine todo o calçamento sem que um lampião ilumine outro, respeitando os números nos muros. Praças novas a cada partida, sempre com uma única solução, e uma praça do dia.',
      tags: ['Lógica', 'Clássico'],
      year: 2026,
      age: 'L',
      meta: '4 tamanhos',
      match: 96,
      duration: '3–20 min por praça',
    },
    {
      id: 'cerca',
      title: 'Cerca',
      status: 'available',
      href: 'games/cerca/index.html',
      tagline: 'Um cercado só, e os números dizem quantos lados têm cerca.',
      description:
        'Quebra-cabeça de lógica num pasto: ligue os postes formando um único cercado fechado, sem cruzar nem encostar. Cada número diz quantos lados daquela casa têm cerca. Pastos novos a cada partida, sempre com uma única solução, e um pasto do dia.',
      tags: ['Lógica', 'Clássico'],
      year: 2026,
      age: 'L',
      meta: '4 tamanhos',
      match: 97,
      duration: '3–25 min por pasto',
    },
    {
      id: 'einstein',
      title: 'Enigma de Einstein',
      status: 'available',
      href: 'games/einstein/index.html',
      tagline: 'Quem mora em cada casa da rua?',
      description:
        'O clássico enigma de lógica: casas em fila, moradores, cores, bichos, bebidas e mais, e uma lista de pistas como "quem tem o gato mora ao lado de quem bebe café". Risque e escolha numa grade até descobrir tudo. Enigmas novos a cada partida, sempre com solução única, e um enigma do dia.',
      tags: ['Lógica', 'Dedução', 'Clássico'],
      year: 2026,
      age: 'L',
      meta: '4 tamanhos',
      match: 97,
      duration: '5–30 min por enigma',
    },
    {
      id: 'travessia',
      title: 'Travessia',
      status: 'available',
      href: 'games/travessia/index.html',
      tagline: 'Todo mundo para o outro lado do rio.',
      description:
        'Quebra-cabeças de travessia: leve personagens e bichos para a outra margem num barco pequeno. Há quem não pode ficar junto numa margem, quem não pode ir junto no barco, peso máximo e quem não sabe remar. Nove fases, cada uma com o menor número de viagens para buscar as 3 estrelas.',
      tags: ['Lógica', 'Raciocínio', 'Casual'],
      year: 2026,
      age: 'L',
      meta: '9 fases',
      match: 96,
      duration: '2–10 min por fase',
    },
    {
      id: 'acampamento',
      title: 'Acampamento',
      status: 'available',
      href: 'games/acampamento/index.html',
      tagline: 'Uma barraca ao lado de cada árvore.',
      description:
        'Quebra-cabeça de lógica num camping: arme uma barraca encostada em cada árvore, sem que duas barracas se encostem, seguindo quantas barracas há em cada linha e coluna. Campos novos a cada partida, sempre com uma única solução, e um camping do dia igual para todo mundo.',
      tags: ['Lógica', 'Clássico'],
      year: 2026,
      age: 'L',
      meta: '4 tamanhos',
      match: 97,
      duration: '3–20 min por campo',
    },
    {
      id: 'kakuro',
      title: 'Kakuro',
      status: 'available',
      href: 'games/kakuro/index.html',
      tagline: 'Somas cruzadas na lousa.',
      description:
        'Cada sequência de casas soma o número da pista, sem repetir algarismo. Quatro tamanhos e uma lousa do dia, todas resolvíveis só com raciocínio, com ajuda das combinações possíveis de cada soma.',
      tags: ['Lógica', 'Números', 'Clássico'],
      year: 2026,
      age: 'L',
      meta: '4 tamanhos',
      match: 95,
      duration: '5–30 min por lousa',
    },
    {
      id: 'prensa',
      title: 'Prensa',
      status: 'available',
      href: 'games/prensa/index.html',
      tagline: 'Descubra a palavra do dia.',
      description:
        'Jogo de palavras numa oficina de tipografia: adivinhe a palavra de cinco letras e a tinta mostra o quanto você chegou perto. Uma, duas ou quatro palavras por dia, iguais para todo mundo, e um modo livre para treinar.',
      tags: ['Palavras', 'Diário', 'Casual'],
      year: 2026,
      age: 'L',
      meta: '4 modos',
      match: 99,
      duration: '2–10 min',
    },
    {
      id: 'palavradodia',
      title: 'Palavra do Dia',
      status: 'available',
      href: 'games/palavradodia/index.html',
      tagline: 'Dois jogos de palavras novos todo dia.',
      description:
        'Colmeia: forme palavras com 7 letras, sempre usando a do centro, e ache a palavra-chave. Proximidade: digite palavras e veja o quão perto, em sentido, cada uma está da palavra secreta. Iguais para todo mundo, com modo livre.',
      tags: ['Palavras', 'Diário', 'Raciocínio'],
      year: 2026,
      age: 'L',
      meta: '2 jogos diários',
      match: 98,
      duration: '5–20 min',
    },
  ];

  const MODES = [
    { id: 'memoria', game: 'croma', title: 'Memória', text: 'Veja uma cor por alguns segundos e recrie-a de cabeça. 5 rodadas, até 50 pontos.' },
    { id: 'diario', game: 'croma', title: 'Desafio Diário', text: 'As mesmas 5 cores para todo mundo. Uma tentativa por dia — compartilhe o resultado.' },
    { id: 'olho', game: 'croma', title: 'Olho Clínico', text: 'Ache o quadrado de tom diferente. Cada acerto deixa tudo mais difícil. 60 segundos.' },
    { id: 'ilimitado', game: 'tamanho', title: 'Ilimitado', text: 'Rodadas sem fim com 4 tipos de desafio e 3 vidas. A margem de erro fecha a cada rodada.' },
    { id: 'treino', game: 'tamanho', title: 'Treino', text: 'Escolha um tipo de desafio e pratique sem vidas e sem pontuação.' },
    { id: 'diario', game: 'sudoku', art: 'sudoku-dia', title: 'Sudoku do dia', text: 'A mesma grade (Médio) para todo mundo hoje. Compare o tempo.' },
    { id: 'facil', game: 'sudoku', art: 'sudoku-1', title: 'Fácil', text: 'Muitas pistas. Bom para aquecer.' },
    { id: 'medio', game: 'sudoku', art: 'sudoku-2', title: 'Médio', text: 'Pede um pouco de raciocínio além do óbvio.' },
    { id: 'dificil', game: 'sudoku', art: 'sudoku-3', title: 'Difícil', text: 'Poucas pistas. Anotações ajudam muito.' },
    { id: 'especialista', game: 'sudoku', art: 'sudoku-4', title: 'Especialista', text: 'O mínimo de pistas que a grade permite.' },
    { id: 'diario', game: 'canteiros', art: 'canteiros-dia', title: 'Jardim do dia', text: 'O mesmo jardim 8×8 para todo mundo hoje. Compare o tempo.' },
    { id: '6', game: 'canteiros', art: 'canteiros-6', title: 'Broto', text: '6×6. Ótimo para aprender as regras.' },
    { id: '7', game: 'canteiros', art: 'canteiros-7', title: 'Muda', text: '7×7. Começa a pedir raciocínio.' },
    { id: '8', game: 'canteiros', art: 'canteiros-8', title: 'Canteiro', text: '8×8. O tamanho clássico.' },
    { id: '9', game: 'canteiros', art: 'canteiros-9', title: 'Estufa', text: '9×9. Para quem já pegou o jeito.' },
    { id: 'diario', game: 'pontocruz', art: 'pontocruz-dia', title: 'Motivo do dia', text: 'O mesmo motivo 10×10 para todo mundo hoje.' },
    { id: 'colecao', game: 'pontocruz', art: 'pontocruz-colecao', title: 'Coleção', text: 'Desenhos feitos à mão: descubra o próximo.' },
    { id: '5', game: 'pontocruz', art: 'pontocruz-5', title: 'Rápido', text: 'Motivo 5×5, para aprender.' },
    { id: '10', game: 'pontocruz', art: 'pontocruz-10', title: 'Clássico', text: 'Motivo 10×10, o tamanho tradicional.' },
    { id: 'colmeia', game: 'palavradodia', art: 'pdd-colmeia', title: 'Colmeia', text: 'Forme palavras com as 7 letras do dia, sempre usando a do centro.' },
    { id: 'proximidade', game: 'palavradodia', art: 'pdd-prox', title: 'Proximidade', text: 'Ache a palavra secreta pela proximidade de sentido de cada palpite.' },
    { id: 'colmeia-livre', game: 'palavradodia', art: 'pdd-colmeia', title: 'Colmeia livre', text: 'Colmeias sorteadas, sem limite.' },
    { id: 'proximidade-livre', game: 'palavradodia', art: 'pdd-prox', title: 'Proximidade livre', text: 'Palavras secretas sorteadas, sem limite.' },
    { id: 'um', game: 'prensa', art: 'prensa-1', title: '1 palavra', text: 'A palavra do dia em 6 tentativas.' },
    { id: 'dois', game: 'prensa', art: 'prensa-2', title: '2 palavras', text: 'Duas palavras ao mesmo tempo, 7 tentativas.' },
    { id: 'quatro', game: 'prensa', art: 'prensa-4', title: '4 palavras', text: 'Quatro palavras ao mesmo tempo, 9 tentativas.' },
    { id: 'livre', game: 'prensa', art: 'prensa-livre', title: 'Livre', text: 'Palavras sorteadas sem limite, para treinar.' },
    { id: 'solo', game: 'sopa', art: 'sopa', title: 'Sozinho', text: 'Bata o seu recorde de palavras.' },
    { id: 'duelo', game: 'sopa', art: 'sopa-duelo', title: 'Duelo', text: '2 a 4 pessoas, a mesma tigela para todos.' },
    { id: 'solo', game: 'contas', art: 'contas', title: 'Sozinho', text: 'Bata o seu recorde de contas.' },
    { id: 'duelo', game: 'contas', art: 'contas-duelo', title: 'Duelo', text: '2 a 4 pessoas, as mesmas contas para todos.' },
    { id: 'diario', game: 'binario', art: 'binario-dia', title: 'Painel do dia', text: 'O mesmo painel 10×10 para todo mundo hoje.' },
    { id: '6', game: 'binario', art: 'binario-6', title: 'Fácil', text: '6×6, para aprender as regras.' },
    { id: '8', game: 'binario', art: 'binario-8', title: 'Médio', text: '8×8, pede olhar a linha inteira.' },
    { id: '10', game: 'binario', art: 'binario-10', title: 'Difícil', text: '10×10, com deduções em cadeia.' },
    { id: '12', game: 'binario', art: 'binario-12', title: 'Desafio', text: '12×12, para sessões longas.' },
    { id: 'diario', game: 'garimpo', art: 'garimpo-dia', title: 'Terreno do dia', text: 'O mesmo terreno para todo mundo hoje.' },
    { id: 'facil', game: 'garimpo', art: 'garimpo-1', title: 'Fácil', text: '8×10, 13 buracos.' },
    { id: 'medio', game: 'garimpo', art: 'garimpo-2', title: 'Médio', text: '10×13, 25 buracos.' },
    { id: 'dificil', game: 'garimpo', art: 'garimpo-3', title: 'Difícil', text: '12×16, 44 buracos.' },
    { id: 'desafio', game: 'garimpo', art: 'garimpo-4', title: 'Desafio', text: '14×20, 66 buracos.' },
    { id: 'dia4', game: 'escada', art: 'escada-4', title: 'Do dia · 4 letras', text: 'A mesma escada para todo mundo hoje.' },
    { id: 'dia5', game: 'escada', art: 'escada-5', title: 'Do dia · 5 letras', text: 'A escada mais longa do dia.' },
    { id: 'livre4', game: 'escada', art: 'escada-4', title: 'Livre · 4 letras', text: 'Escadas sorteadas, sem limite.' },
    { id: 'livre5', game: 'escada', art: 'escada-5', title: 'Livre · 5 letras', text: 'Escadas sorteadas, sem limite.' },
    { id: 'diario', game: 'fios', art: 'fios-dia', title: 'Placa do dia', text: 'A mesma placa 8×8 para todo mundo hoje.' },
    { id: '5', game: 'fios', art: 'fios-5', title: 'Fácil', text: '5×5, para pegar o jeito.' },
    { id: '7', game: 'fios', art: 'fios-7', title: 'Médio', text: '7×7, mais fios para encaixar.' },
    { id: '9', game: 'fios', art: 'fios-9', title: 'Difícil', text: '9×9, caminhos longos.' },
    { id: '10', game: 'fios', art: 'fios-10', title: 'Desafio', text: '10×10, para sessões longas.' },
    { id: 'diario', game: 'lampioes', art: 'lampioes-dia', title: 'Praça do dia', text: 'A mesma praça 10×10 para todo mundo hoje.' },
    { id: '7', game: 'lampioes', art: 'lampioes-7', title: 'Fácil', text: '7×7, para aprender as regras.' },
    { id: '9', game: 'lampioes', art: 'lampioes-9', title: 'Médio', text: '9×9, pede pensar nas sombras.' },
    { id: '10', game: 'lampioes', art: 'lampioes-10', title: 'Difícil', text: '10×10, com deduções em cadeia.' },
    { id: '12', game: 'lampioes', art: 'lampioes-12', title: 'Desafio', text: '12×12, para sessões longas.' },
    { id: 'diario', game: 'cerca', art: 'cerca-dia', title: 'Pasto do dia', text: 'O mesmo pasto 8×8 para todo mundo hoje.' },
    { id: '5', game: 'cerca', art: 'cerca-5', title: 'Fácil', text: '5×5, para aprender as regras.' },
    { id: '7', game: 'cerca', art: 'cerca-7', title: 'Médio', text: '7×7, pede pensar em dentro e fora.' },
    { id: '8', game: 'cerca', art: 'cerca-8', title: 'Difícil', text: '8×8, com deduções em cadeia.' },
    { id: '10', game: 'cerca', art: 'cerca-10', title: 'Desafio', text: '10×10, para sessões longas.' },
    { id: 'diario', game: 'einstein', art: 'einstein-dia', title: 'Enigma do dia', text: 'O mesmo enigma de 5 casas para todo mundo hoje.' },
    { id: 'facil', game: 'einstein', art: 'einstein-3', title: 'Fácil', text: '3 casas e 3 categorias, para aprender.' },
    { id: 'medio', game: 'einstein', art: 'einstein-4', title: 'Médio', text: '4 casas e 4 categorias.' },
    { id: 'dificil', game: 'einstein', art: 'einstein-5', title: 'Difícil', text: '5 casas e 5 categorias, como o clássico.' },
    { id: 'genio', game: 'einstein', art: 'einstein-6', title: 'Gênio', text: '5 casas e 6 categorias. Muitas pistas.' },
    { id: 'proxima', game: 'travessia', art: 'travessia', title: 'Próxima fase', text: 'Continue a trilha de onde parou.' },
    { id: 'feira', game: 'travessia', art: 'travessia-1', title: 'Volta da feira', text: 'Fase 1: a onça, a cabra e a couve.' },
    { id: 'gatos', game: 'travessia', art: 'travessia-3', title: 'Gatos e ratos', text: 'Fase 3: os gatos nunca podem ser maioria.' },
    { id: 'circo', game: 'travessia', art: 'travessia-5', title: 'O circo vai à cidade', text: 'Fase 5: leão, coelho, bolo e artistas.' },
    { id: 'junina', game: 'travessia', art: 'travessia-8', title: 'Festa junina', text: 'Fase 8: família, bichos e uma canoa só.' },
    { id: 'diario', game: 'acampamento', art: 'acampamento-dia', title: 'Camping do dia', text: 'O mesmo campo 8×8 para todo mundo hoje.' },
    { id: '6', game: 'acampamento', art: 'acampamento-6', title: 'Fácil', text: '6×6, para aprender as regras.' },
    { id: '8', game: 'acampamento', art: 'acampamento-8', title: 'Médio', text: '8×8, o tamanho clássico.' },
    { id: '10', game: 'acampamento', art: 'acampamento-10', title: 'Difícil', text: '10×10, pede contas de linha.' },
    { id: '12', game: 'acampamento', art: 'acampamento-12', title: 'Desafio', text: '12×12, para sessões longas.' },
    { id: 'diario', game: 'kakuro', art: 'kakuro-dia', title: 'Lousa do dia', text: 'A mesma lousa 8×8 para todo mundo hoje.' },
    { id: '6', game: 'kakuro', art: 'kakuro-6', title: 'Fácil', text: '6×6, para aprender as combinações.' },
    { id: '8', game: 'kakuro', art: 'kakuro-8', title: 'Médio', text: '8×8, o tamanho clássico.' },
    { id: '10', game: 'kakuro', art: 'kakuro-10', title: 'Difícil', text: '10×10, somas longas.' },
    { id: '12', game: 'kakuro', art: 'kakuro-12', title: 'Desafio', text: '12×12, para sessões longas.' },
    { id: 'diario', game: 'pontes', art: 'pontes-dia', title: 'Mapa do dia', text: 'O mesmo mapa 9×9 para todo mundo hoje.' },
    { id: '7', game: 'pontes', art: 'pontes-7', title: 'Enseada', text: '7×7, poucas ilhas. Bom para aprender.' },
    { id: '9', game: 'pontes', art: 'pontes-9', title: 'Baía', text: '9×9, o tamanho clássico.' },
    { id: '11', game: 'pontes', art: 'pontes-11', title: 'Arquipélago', text: '11×11, mais ilhas e mais cruzamentos.' },
    { id: '13', game: 'pontes', art: 'pontes-13', title: 'Oceano', text: '13×13, para sessões longas.' },
    { id: '15', game: 'pontocruz', art: 'pontocruz-15', title: 'Grande', text: 'Motivo 15×15, para sessões mais longas.' },
  ];

  /* ---------- Armazenamento local (tolerante a falhas) ---------- */
  const store = {
    get(key, fallback = null) {
      try { const v = localStorage.getItem(key); return v == null ? fallback : JSON.parse(v); }
      catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* sem armazenamento */ }
    },
  };
  const LIST_KEY = 'jogateca:lista';
  const getList = () => store.get(LIST_KEY, []);
  const inList = (id) => getList().includes(id);
  function toggleList(id) {
    const list = getList();
    const i = list.indexOf(id);
    if (i >= 0) list.splice(i, 1); else list.push(id);
    store.set(LIST_KEY, list);
    render();
  }

  function todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  function fmtTime(sec) {
    const m = Math.floor(sec / 60), s = sec % 60;
    return m >= 60 ? `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}` : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  function modeRecord(m) {
    const key = `${m.game}:${m.id}`;
    if (key === 'croma:memoria') {
      const best = Math.max(...['facil', 'normal', 'dificil'].map((d) => store.get(`croma:best:memoria:${d}`, 0)));
      return best > 0 ? `Recorde ${best.toFixed(2)}` : '';
    }
    if (key === 'croma:diario') {
      const r = store.get(`croma:daily:${todayKey()}`);
      return r ? `Hoje ${r.total.toFixed(2)}` : 'Novo hoje';
    }
    if (key === 'croma:olho') {
      const best = store.get('croma:best:olho', 0);
      return best > 0 ? `Recorde nível ${best}` : '';
    }
    if (key === 'tamanho:ilimitado') {
      const best = store.get('tamanho:best', 0);
      return best > 0 ? `Recorde ${best} pts` : '';
    }
    if (key === 'sudoku:diario') {
      const r = store.get(`sudoku:daily:${todayKey()}`);
      return r ? `Hoje ${fmtTime(r.time)}` : 'Novo hoje';
    }
    if (key === 'canteiros:diario') {
      const r = store.get(`canteiros:daily:${todayKey()}`);
      return r ? `Hoje ${fmtTime(r.time)}` : 'Novo hoje';
    }
    if (m.game === 'palavradodia') {
      const d = new Date();
      const day = Math.round((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(2026, 0, 1)) / 86400000) + 1;
      if (m.id === 'colmeia') { const c = store.get(`colmeia:dia:${day}`); return c && c.found.length ? `Hoje ${c.found.length} palavras` : 'Novo hoje'; }
      if (m.id === 'proximidade') { const p = store.get(`proximidade:dia:${day}`); return p && p.won ? `Hoje ✓ ${p.guesses.length} tentativas` : 'Novo hoje'; }
      return '';
    }
    if (m.game === 'prensa') {
      const d = new Date();
      const day = Math.round((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(2026, 0, 1)) / 86400000) + 1;
      const stats = store.get(`prensa:stats:${m.id}`);
      if (m.id === 'livre') return stats && stats.wins ? `${stats.wins} ${stats.wins === 1 ? 'acerto' : 'acertos'}` : '';
      const today = store.get(`prensa:state:${m.id}:${day}`);
      if (today && today.done) return today.won ? `Hoje ✓ · sequência ${stats ? stats.streak : 1}` : 'Hoje ✗';
      return 'Novo hoje';
    }
    if (m.game === 'sopa' || m.game === 'contas') {
      if (m.id === 'duelo') {
        const h = store.get(`jogateca:duelo:hist:${m.game}`, []);
        return h.length ? `${h.length} ${h.length === 1 ? 'duelo' : 'duelos'}` : '';
      }
      let best = 0;
      try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith(`${m.game}:best:`)) best = Math.max(best, +localStorage.getItem(k) || 0); } } catch { /* sem armazenamento */ }
      return best ? `Recorde ${best}` : '';
    }
    if (key === 'binario:diario') {
      const r = store.get(`binario:daily:${todayKey()}`);
      return r ? `Hoje ${fmtTime(r.time)}` : 'Novo hoje';
    }
    if (m.game === 'binario') {
      const best = store.get(`binario:best:${m.id}`);
      return best ? `Melhor ${fmtTime(best)}` : '';
    }
    if (key === 'garimpo:diario') {
      const r = store.get(`garimpo:daily:${todayKey()}`);
      return r ? `Hoje ${fmtTime(r.time)}` : 'Novo hoje';
    }
    if (m.game === 'garimpo') {
      const best = store.get(`garimpo:best:${m.id}`);
      return best ? `Melhor ${fmtTime(best)}` : '';
    }
    if (m.game === 'escada') {
      const L = m.id.slice(-1);
      if (m.id.startsWith('livre')) { const w = store.get(`escada:wins:${L}`, 0); return w ? `${w} ${w === 1 ? 'escada' : 'escadas'}` : ''; }
      const d = new Date();
      const day = Math.round((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(2026, 0, 1)) / 86400000) + 1;
      const r = store.get(`escada:dia:${L}:${day}`);
      return r && r.done ? (r.won ? `Hoje ${'★'.repeat(r.stars)}${'☆'.repeat(3 - r.stars)}` : 'Hoje ✗') : 'Novo hoje';
    }
    if (key === 'fios:diario') {
      const r = store.get(`fios:daily:${todayKey()}`);
      return r ? `Hoje ${fmtTime(r.time)}` : 'Novo hoje';
    }
    if (m.game === 'fios') {
      const best = store.get(`fios:best:${m.id}`);
      return best ? `Melhor ${fmtTime(best)}` : '';
    }
    if (key === 'lampioes:diario') {
      const r = store.get(`lampioes:daily:${todayKey()}`);
      return r ? `Hoje ${fmtTime(r.time)}` : 'Novo hoje';
    }
    if (m.game === 'lampioes') {
      const best = store.get(`lampioes:best:${m.id}`);
      return best ? `Melhor ${fmtTime(best)}` : '';
    }
    if (key === 'cerca:diario') {
      const r = store.get(`cerca:daily:${todayKey()}`);
      return r ? `Hoje ${fmtTime(r.time)}` : 'Novo hoje';
    }
    if (m.game === 'cerca') {
      const best = store.get(`cerca:best:${m.id}`);
      return best ? `Melhor ${fmtTime(best)}` : '';
    }
    if (key === 'einstein:diario') {
      const r = store.get(`einstein:daily:${todayKey()}`);
      return r ? `Hoje ${fmtTime(r.time)}` : 'Novo hoje';
    }
    if (m.game === 'einstein') {
      const best = store.get(`einstein:best:${m.id}`);
      return best ? `Melhor ${fmtTime(best)}` : '';
    }
    if (m.game === 'travessia') {
      const prog = store.get('travessia:prog', {});
      if (m.id === 'proxima') {
        const stars = Object.values(prog).reduce((t, r) => t + r.stars, 0);
        return stars ? `${stars} ★` : '';
      }
      return prog[m.id] ? '★'.repeat(prog[m.id].stars) : '';
    }
    if (key === 'acampamento:diario') {
      const r = store.get(`acampamento:daily:${todayKey()}`);
      return r ? `Hoje ${fmtTime(r.time)}` : 'Novo hoje';
    }
    if (m.game === 'acampamento') {
      const best = store.get(`acampamento:best:${m.id}`);
      return best ? `Melhor ${fmtTime(best)}` : '';
    }
    if (key === 'kakuro:diario') {
      const r = store.get(`kakuro:daily:${todayKey()}`);
      return r ? `Hoje ${fmtTime(r.time)}` : 'Novo hoje';
    }
    if (m.game === 'kakuro') {
      const best = store.get(`kakuro:best:${m.id}`);
      return best ? `Melhor ${fmtTime(best)}` : '';
    }
    if (key === 'pontes:diario') {
      const r = store.get(`pontes:daily:${todayKey()}`);
      return r ? `Hoje ${fmtTime(r.time)}` : 'Novo hoje';
    }
    if (m.game === 'pontes') {
      const best = store.get(`pontes:best:${m.id}`);
      return best ? `Melhor ${fmtTime(best)}` : '';
    }
    if (key === 'pontocruz:diario') {
      const r = store.get(`pontocruz:daily:${todayKey()}`);
      return r ? `Hoje ${fmtTime(r.time)}` : 'Novo hoje';
    }
    if (key === 'pontocruz:colecao') return '';
    if (m.game === 'pontocruz') {
      const best = store.get(`pontocruz:best:${m.id}`);
      return best ? `Melhor ${fmtTime(best)}` : '';
    }
    if (m.game === 'canteiros') {
      const best = store.get(`canteiros:best:${m.id}`);
      return best ? `Melhor ${fmtTime(best)}` : '';
    }
    if (m.game === 'sudoku') {
      const best = store.get(`sudoku:best:${m.id}`);
      return best ? `Melhor ${fmtTime(best)}` : '';
    }
    return '';
  }

  /* ---------- Arte (só CSS) ---------- */
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function art(kind, big = false) {
    if (kind === 'croma') {
      const colors = ['#ff3d6e', '#ffd23f', '#3ddc97', '#3a86ff', '#b14aed', '#ff8c42', '#00c2d1', '#f15bb5', '#9ef01a'];
      return `<div class="art art-croma${big ? ' big' : ''}"><div class="swatches">${colors.map((c) => `<i style="background:${c}"></i>`).join('')}</div></div>`;
    }
    if (kind === 'tamanho') {
      return '<div class="art art-tamanho"><div class="ruler"></div><div class="shapes"><i></i><i></i><i></i></div></div>';
    }
    if (kind === 'memoria') return '<div class="art art-memoria"></div>';
    if (kind === 'diario') {
      const c = ['#e76f51', '#f4a261', '#e9c46a', '#2a9d8f', '#8ab17d'];
      return `<div class="art art-diario">${c.map((x) => `<i style="background:${x}"></i>`).join('')}</div>`;
    }
    if (kind.startsWith('sopa')) {
      const letters = ['C', 'A', 'L', 'D', 'O', 'S', 'E', 'R', 'M', 'U', 'P', 'A', 'T', 'I', 'N', 'O'];
      const badge = kind === 'sopa-duelo' ? '<span class="sudoku-badge">👥 Duelo</span>' : '';
      return `<div class="art art-sopa${big ? ' big' : ''}"><div class="sbowl"><div class="sgr">${letters.map((l, i) => `<i style="--r:${((i * 37) % 13) - 6}deg"${i === 0 || i === 1 || i === 2 || i === 3 ? ' class="on"' : ''}>${l}</i>`).join('')}</div></div>${badge}</div>`;
    }
    if (kind.startsWith('contas')) {
      const badge = kind === 'contas-duelo' ? '<span class="sudoku-badge">👥 Duelo</span>' : '';
      return `<div class="art art-contas${big ? ' big' : ''}"><div class="cled"><span>7 × 8</span><b>56</b><small>🔥 6 seguidas</small></div>${badge}</div>`;
    }
    if (kind.startsWith('binario')) {
      // Painel 4×4 de azulejos brancos (0) e azuis (1), já resolvido.
      const g = [1, 0, 0, 1, 0, 1, 1, 0, 1, 1, 0, 0, 0, 0, 1, 1];
      const size = kind.match(/^binario-(\d+)$/);
      const badge = kind === 'binario-dia'
        ? `<span class="sudoku-badge day"><b>${new Date().getDate()}</b>${new Date().toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</span>`
        : size ? `<span class="sudoku-badge">${size[1]}×${size[1]}</span>` : '';
      return `<div class="art art-binario${big ? ' big' : ''}"><div class="bgrid">${g.map((v) => `<i class="b${v}">${v}</i>`).join('')}</div>${badge}</div>`;
    }
    if (kind.startsWith('garimpo')) {
      // Terreno 5×5: capim (h), terra cavada com números e uma estaca.
      const g = ['h h 1 . .', 'h f 2 1 .', 'h h h 1 .', '1 2 2 1 .', '. . . . .'].map((r) => r.split(' ')).flat();
      const stake = '<svg viewBox="0 0 100 100"><path d="M44 20 H54 V88 L49 96 L44 88 Z" fill="#8a5a2b"/><path d="M54 20 L86 32 L54 46 Z" fill="#e5483b"/></svg>';
      const lvl = kind.match(/^garimpo-(\d)$/);
      const badge = kind === 'garimpo-dia'
        ? `<span class="sudoku-badge day"><b>${new Date().getDate()}</b>${new Date().toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</span>`
        : lvl ? `<span class="sudoku-badge">${'●'.repeat(+lvl[1])}${'○'.repeat(4 - lvl[1])}</span>` : '';
      return `<div class="art art-garimpo${big ? ' big' : ''}"><div class="ggrid">${g.map((x) => (x === 'h' ? '<i class="h"></i>' : x === 'f' ? `<i class="h">${stake}</i>` : `<i class="n${x}">${x === '.' ? '' : x}</i>`)).join('')}</div>${badge}</div>`;
    }
    if (kind.startsWith('escada')) {
      // Escada de madeira com três degraus de palavras.
      const five = kind === 'escada-5';
      const rungs = five ? [['PRATO', -1], ['PRATA', 4], ['PRAIA', 3]] : [['GALO', -1], ['GELO', 1], ['PELO', 0]];
      return `<div class="art art-escada${big ? ' big' : ''}"><div class="eladder">${rungs.map(([w, c]) => `<div>${[...w].map((ch, i) => `<i${i === c ? ' class="c"' : ''}>${ch}</i>`).join('')}</div>`).join('')}</div>${kind === 'escada-4' || five ? `<span class="sudoku-badge">${five ? 5 : 4} letras</span>` : ''}</div>`;
    }
    if (kind.startsWith('fios')) {
      // Placa 5×5 resolvida, com fios coloridos.
      const wires = [['#ff5d5d', [[0, 0], [3, 0], [3, 1], [1, 1]]], ['#ffd23f', [[4, 0], [4, 4], [2, 4]]], ['#4fa3ff', [[0, 1], [0, 4], [1, 4]]],
        ['#5ee07a', [[1, 2], [3, 2], [3, 3]]], ['#b583ff', [[1, 3], [2, 3]]]];
      const size = kind.match(/^fios-(\d+)$/);
      const badge = kind === 'fios-dia'
        ? `<span class="sudoku-badge day"><b>${new Date().getDate()}</b>${new Date().toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</span>`
        : size ? `<span class="sudoku-badge">${size[1]}×${size[1]}</span>` : '';
      const P = (x) => x + 0.5;
      const svg = wires.map(([c, pts]) => {
        const d = pts.map(([x, y], j) => `${j ? 'L' : 'M'}${P(x)} ${P(y)}`).join(' ');
        const a = pts[0], z = pts[pts.length - 1];
        return `<path d="${d}" stroke="${c}" stroke-width=".38" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` +
          [a, z].map(([x, y]) => `<circle cx="${P(x)}" cy="${P(y)}" r=".33" fill="${c}" stroke="#0b1512" stroke-width=".06"/>`).join('');
      }).join('');
      return `<div class="art art-fios${big ? ' big' : ''}"><svg class="fboard" viewBox="0 0 5 5"><rect width="5" height="5" fill="#12493a"/>${svg}</svg>${badge}</div>`;
    }
    if (kind.startsWith('lampioes')) {
      // Trecho de praça 5×5: muros (w), lampiões (L), casas iluminadas (o) e no escuro (.).
      const g = ['L o w 0 o', 'o w L o o', 'o 1 o w L', 'w L o o o', '. o w 0 o'].map((r) => r.split(' '));
      const lamp = '<svg viewBox="0 0 100 100"><path d="M34 24 H66 L60 70 H40 Z" fill="#ffd36b"/><path d="M50 36 C58 46 56 56 50 60 C44 56 42 46 50 36 Z" fill="#ff8f2e"/><path d="M30 22 H70 M38 70 H62 M48 72 H52 V92 H48 Z" stroke="#2b2b3a" stroke-width="5"/></svg>';
      const size = kind.match(/^lampioes-(\d+)$/);
      const badge = kind === 'lampioes-dia'
        ? `<span class="sudoku-badge day"><b>${new Date().getDate()}</b>${new Date().toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</span>`
        : size ? `<span class="sudoku-badge">${size[1]}×${size[1]}</span>` : '';
      const cell = (x) => (x === 'L' ? `<i class="l">${lamp}</i>` : x === 'o' ? '<i class="o"></i>' : x === '.' ? '<i></i>' : `<i class="w">${x === 'w' ? '' : `<b>${x}</b>`}</i>`);
      return `<div class="art art-lampioes${big ? ' big' : ''}"><div class="lgrid">${g.flat().map(cell).join('')}</div>${badge}</div>`;
    }
    if (kind.startsWith('cerca')) {
      // Pasto 4×4 com um cercado de madeira e números.
      const loop = 'M10 10 H30 V20 H40 V40 H20 V30 H10 Z';
      const clues = [[5, 5, '0'], [25, 5, '1'], [15, 15, '2'], [5, 25, '1'], [35, 15, '2'], [25, 35, '2'], [15, 35, '2']];
      const posts = [[10, 10], [30, 10], [30, 20], [40, 20], [40, 40], [20, 40], [20, 30], [10, 30]];
      const size = kind.match(/^cerca-(\d+)$/);
      const badge = kind === 'cerca-dia'
        ? `<span class="sudoku-badge day"><b>${new Date().getDate()}</b>${new Date().toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</span>`
        : size ? `<span class="sudoku-badge">${size[1]}×${size[1]}</span>` : '';
      const dots = [];
      for (let y = 0; y <= 40; y += 10) for (let x = 0; x <= 40; x += 10) dots.push(`<circle cx="${x}" cy="${y}" r="0.9" fill="#3a2a18"/>`);
      return `<div class="art art-cerca${big ? ' big' : ''}"><svg class="cfield" viewBox="-5 -5 50 50"><rect x="-5" y="-5" width="50" height="50" fill="#cfe3a6"/><path d="${loop}" fill="#a9cf74" stroke="#8a5a2b" stroke-width="2.2" stroke-linejoin="round"/>${dots.join('')}${posts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.3" fill="#3a2a18"/>`).join('')}${clues.map(([x, y, t]) => `<text x="${x}" y="${y + 2.2}" font-size="6.5" font-family="Georgia,serif" font-weight="700" text-anchor="middle" fill="#3a2a18">${t}</text>`).join('')}<text x="24" y="25" font-size="6" text-anchor="middle">🐑</text></svg>${badge}</div>`;
    }
    if (kind.startsWith('einstein')) {
      // Rua de casas coloridas com moradores e uma casa ainda em aberto.
      const houses = [['#e5484d', '👩', '🐱'], ['#3e7bd6', '🧔', '☕'], ['#cbbd9e', '?', '?'], ['#3fa34d', '👨', '🐟']];
      const size = kind.match(/^einstein-(\d)$/);
      const badge = kind === 'einstein-dia'
        ? `<span class="sudoku-badge day"><b>${new Date().getDate()}</b>${new Date().toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</span>`
        : size ? `<span class="sudoku-badge">${size[1] === '6' ? '5 casas · 6' : `${size[1]} casas`}</span>` : '';
      return `<div class="art art-einstein${big ? ' big' : ''}"><div class="erow">${houses.map(([c, a, b]) => `<span class="eh"><i style="--hc:${c}"></i><b>${a}</b><b>${b}</b></span>`).join('')}</div>${badge}</div>`;
    }
    if (kind.startsWith('travessia')) {
      // Rio com a canoa no meio e personagens nas margens.
      const num = kind.match(/^travessia-(\d+)$/);
      const cast = { 1: ['👨‍🌾', '🐆', '🐐', '🥬'], 3: ['🐭', '🐱', '🐭', '🐱'], 5: ['🦁', '🐇', '🤡', '🎂'], 8: ['👩‍🌾', '🐕', '🐈', '🐓'] }[num ? num[1] : 0] || ['🐆', '🐐', '🧙‍♂️', '🐔'];
      const badge = num ? `<span class="sudoku-badge">Fase ${num[1]}</span>` : '';
      return `<div class="art art-travessia${big ? ' big' : ''}"><div class="tv-scene"><span class="tv-bank">${cast.slice(0, 2).map((e) => `<i>${e}</i>`).join('')}</span><span class="tv-river"><b>🛶</b></span><span class="tv-bank">${cast.slice(2).map((e) => `<i>${e}</i>`).join('')}</span></div>${badge}</div>`;
    }
    if (kind.startsWith('acampamento')) {
      // Campo 5×5 resolvido: cada árvore com a sua barraca, nenhuma barraca encostada em outra.
      const g = ['tT.Pt', '.....', 'Pt..P', '....t', '.tT..'];
      const pine = '<svg viewBox="0 0 100 100"><rect x="45" y="72" width="10" height="20" fill="#7a4a26"/><path d="M50 6 L76 40 H62 L84 64 H66 L88 84 H12 L34 64 H16 L38 40 H24 Z" fill="#1f5e3a"/></svg>';
      const oak = '<svg viewBox="0 0 100 100"><rect x="45" y="64" width="10" height="28" fill="#7a4a26"/><circle cx="32" cy="50" r="20" fill="#2f7a3a"/><circle cx="68" cy="50" r="20" fill="#28693a"/><circle cx="50" cy="32" r="25" fill="#358a40"/></svg>';
      const tent = (c, d) => `<svg viewBox="0 0 100 100"><path d="M50 12 L92 86 H8 Z" fill="${c}"/><path d="M50 12 L92 86 H50 Z" fill="${d}"/><path d="M50 40 L63 86 H37 Z" fill="#3a1f14"/></svg>`;
      const cols = [['#f08a3c', '#c9622a'], ['#f2c14e', '#d39a24'], ['#4fb3bf', '#2f8a96'], ['#e45b6b', '#b83a4b']];
      let k = 0;
      const cell = (ch) => ch === 'T' ? oak : ch === 'P' ? pine : ch === 't' ? tent(...cols[k++ % cols.length]) : '';
      const size = kind.match(/^acampamento-(\d+)$/);
      const badge = kind === 'acampamento-dia'
        ? `<span class="sudoku-badge day"><b>${new Date().getDate()}</b>${new Date().toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</span>`
        : size ? `<span class="sudoku-badge">${size[1]}×${size[1]}</span>` : '';
      return `<div class="art art-acampamento${big ? ' big' : ''}"><div class="agrid">${g.join('').split('').map((ch, i) => `<i${(Math.floor(i / 5) + i) % 2 ? ' class="a"' : ''}>${cell(ch)}</i>`).join('')}</div>${badge}</div>`;
    }
    if (kind.startsWith('kakuro')) {
      // Trecho de lousa: pistas em giz branco e algarismos em giz amarelo.
      const g = ['k', 'k:16', 'k:9', 'k', 'k:23\\', '7', '9', 'k:4', '\\17', '9', '8', '3', 'k', '\\6', '2', '1'];
      const size = kind.match(/^kakuro-(\d+)$/);
      const badge = kind === 'kakuro-dia'
        ? `<span class="sudoku-badge day"><b>${new Date().getDate()}</b>${new Date().toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</span>`
        : size ? `<span class="sudoku-badge">${size[1]}×${size[1]}</span>` : '';
      const cell = (x) => {
        if (/^\d$/.test(x)) return `<i class="w">${x}</i>`;
        if (x === 'k') return '<i class="k"></i>';
        if (x.startsWith('\\')) return `<i class="k c"><b class="a">${x.slice(1)}</b></i>`;
        const v = x.slice(2).replace('\\', '');
        return `<i class="k c"><b class="${x.endsWith('\\') ? 'a' : 'd'}">${v}</b></i>`;
      };
      return `<div class="art art-kakuro${big ? ' big' : ''}"><div class="kgrid">${g.map(cell).join('')}</div>${badge}</div>`;
    }
    if (kind === 'palavradodia' || kind.startsWith('pdd-')) {
      const hexes = '<span class="hexes"><i class="c" style="left:33%;top:33%">a</i><i style="left:33%;top:0">r</i><i style="left:58%;top:16%">m</i><i style="left:58%;top:50%">e</i><i style="left:33%;top:66%">c</i><i style="left:8%;top:50%">o</i><i style="left:8%;top:16%">l</i></span>';
      const bars = '<span class="pbars"><i style="width:100%;background:#63d2b4"></i><i style="width:80%;background:#ff7a59"></i><i style="width:58%;background:#f2c14e"></i><i style="width:32%;background:#4f8fd6"></i></span>';
      const inner = kind === 'pdd-colmeia' ? hexes : kind === 'pdd-prox' ? bars : hexes + bars;
      return `<div class="art art-pdd ${kind === 'pdd-prox' ? 'prox' : ''}${big ? ' big' : ''}">${inner}</div>`;
    }
    if (kind.startsWith('prensa')) {
      // Tipos de madeira com a tinta do resultado.
      const row = (word, marks) => `<div class="prow">${[...word].map((ch, i) => `<i class="${marks[i] || ''}">${ch}</i>`).join('')}</div>`;
      let rows;
      if (kind === 'prensa-2') rows = row('TINTA', ['m', 'o', 'n', 'm', 'm']) + row('PRELO', ['o', 'n', 'o', 'm', 'n']);
      else if (kind === 'prensa-4') rows = row('TIPOS', ['o', 'n', 'm', 'm', 'o']) + row('LETRA', ['n', 'm', 'o', 'n', 'm']) + row('PAPEL', ['m', 'o', 'n', 'm', 'o']);
      else if (kind === 'prensa-livre') rows = row('LIVRE', ['o', 'o', 'n', 'm', 'o']) + row('∞', []);
      else rows = row('PRENSA'.slice(0, 5), ['n', 'm', 'o', 'm', 'n']) + row('PRESA', ['o', 'o', 'o', 'o', 'o']);
      return `<div class="art art-prensa${big ? ' big' : ''}"><div class="ptype">${rows}</div></div>`;
    }
    if (kind.startsWith('pontes')) {
      // Pequeno arquipélago 5×5 com pontes simples e duplas.
      const isl = [[0, 0, 4], [0, 4, 3], [2, 0, 3], [2, 2, 3], [4, 2, 3], [4, 4, 2]];
      const br = [[0, 1, 2], [0, 2, 2], [2, 3, 1], [3, 4, 2], [4, 5, 1], [1, 5, 1]];
      const size = kind.match(/^pontes-(\d+)$/);
      const badge = kind === 'pontes-dia'
        ? `<span class="sudoku-badge day"><b>${new Date().getDate()}</b>${new Date().toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</span>`
        : size ? `<span class="sudoku-badge">${size[1]}×${size[1]}</span>` : '';
      const lines = br.map(([a, b, c]) => {
        const [r1, c1] = isl[a], [r2, c2] = isl[b];
        const h = r1 === r2;
        return (c === 2 ? [-0.12, 0.12] : [0]).map((o) =>
          `<line x1="${c1 + 0.5 + (h ? 0 : o)}" y1="${r1 + 0.5 + (h ? o : 0)}" x2="${c2 + 0.5 + (h ? 0 : o)}" y2="${r2 + 0.5 + (h ? o : 0)}" stroke="#8b5a2b" stroke-width="${c === 2 ? 0.13 : 0.18}"/>`).join('');
      }).join('');
      const dots = isl.map(([r, c, v]) => `<circle cx="${c + 0.5}" cy="${r + 0.5}" r="0.38" fill="#f2dca6" stroke="#4e9a3c" stroke-width="0.07"/><text x="${c + 0.5}" y="${r + 0.66}" font-size="0.45" font-weight="700" text-anchor="middle" fill="#3b2a14" font-family="system-ui,sans-serif">${v}</text>`).join('');
      return `<div class="art art-pontes${big ? ' big' : ''}"><svg class="pmap" viewBox="0 0 5 5">${lines}${dots}</svg>${badge}</div>`;
    }
    if (kind.startsWith('pontocruz')) {
      // Motivo de bordado 9×9 em ponto-cruz sobre etamina.
      const motif = ['r...r...r', '.r.rbr.r.', '..rbbbr..', '.rbb.bbr.', 'rbb.y.bbr', '.rbb.bbr.', '..rbbbr..', '.r.rbr.r.', 'r...r...r'];
      const col = { r: '#b8243b', b: '#1f3f8a', y: '#d9962a' };
      const size = kind.match(/^pontocruz-(\d+)$/);
      const badge = kind === 'pontocruz-dia'
        ? `<span class="sudoku-badge day"><b>${new Date().getDate()}</b>${new Date().toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</span>`
        : kind === 'pontocruz-colecao' ? '<span class="sudoku-badge">? ? ?</span>'
          : size ? `<span class="sudoku-badge">${size[1]}×${size[1]}</span>` : '';
      return `<div class="art art-pontocruz${big ? ' big' : ''}"><div class="hoopmini"><div class="pgrid">${motif.join('').split('').map((ch) =>
        `<i${ch !== '.' ? ` style="--st:${col[ch]}"` : ''}></i>`).join('')}</div></div>${badge}</div>`;
    }
    if (kind.startsWith('canteiros')) {
      // Um tabuleiro 6×6 de verdade (com solução única), usado como ilustração.
      const regions = [2, 0, 1, 1, 1, 1, 2, 0, 1, 1, 1, 1, 2, 3, 3, 3, 1, 1, 5, 3, 3, 5, 4, 4, 5, 5, 5, 5, 4, 4, 5, 5, 5, 5, 4, 4];
      const sol = [1, 4, 0, 2, 5, 3];
      // Cor do canteiro e da flor dele (as mesmas do jogo).
      const beds = [['#f6d77a', '#c87f0a'], ['#f7b2aa', '#b3263e'], ['#a9dbb0', '#ffffff'], ['#b7c2f4', '#3d42b5'], ['#ddc2e8', '#7a3aa0'], ['#9fd3ea', '#2a6fc0']];
      const flower = (fp) => `<svg viewBox="-50 -50 100 100"><g fill="${fp}" stroke="rgba(0,0,0,.15)" stroke-width="2">` +
        [0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="-24" rx="15" ry="22" transform="rotate(${a})"/>`).join('') +
        '</g><circle r="12" fill="#f2c14e"/></svg>';
      const size = kind.match(/^canteiros-(\d)$/);
      const badge = kind === 'canteiros-dia'
        ? `<span class="sudoku-badge day"><b>${new Date().getDate()}</b>${new Date().toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</span>`
        : size ? `<span class="sudoku-badge">${size[1]}×${size[1]}</span>` : '';
      return `<div class="art art-canteiros${big ? ' big' : ''}"><div class="cgrid">${regions.map((g, i) =>
        `<i style="background:${beds[g][0]}">${sol[Math.floor(i / 6)] === i % 6 ? flower(beds[g][1]) : ''}</i>`).join('')}</div>${badge}</div>`;
    }
    if (kind.startsWith('sudoku')) {
      // Trecho de uma grade: 0 = vazio, negativo = número do jogador (tinta azul).
      const sample = [5, 3, 0, 0, 7, 0, 0, 0, 0, 6, 0, 0, 1, 9, 5, 0, 0, 0, 0, 9, 8, 0, 0, 0, 0, 6, 0,
        8, 0, -9, 0, 6, 0, 0, 0, 3, 4, 0, 0, 8, 0, 3, 0, 0, 1];
      const dots = kind.match(/^sudoku-(\d)$/);
      const badge = kind === 'sudoku-dia'
        ? `<span class="sudoku-badge day"><b>${new Date().getDate()}</b>${new Date().toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</span>`
        : dots ? `<span class="sudoku-badge">${'●'.repeat(+dots[1])}${'○'.repeat(4 - dots[1])}</span>` : '';
      return `<div class="art art-sudoku${big ? ' big' : ''}"><div class="sgrid">${sample.map((v) => `<i${v < 0 ? ' class="u"' : ''}>${v ? Math.abs(v) : ''}</i>`).join('')}</div>${badge}</div>`;
    }
    if (kind === 'ilimitado') return '<div class="art art-ilimitado"><b>∞</b></div>';
    if (kind === 'treino') return '<div class="art art-treino"><i></i><i></i><i></i><i></i></div>';
    if (kind === 'olho') {
      return `<div class="art art-olho">${Array.from({ length: 24 }, (_, i) => `<i${i === 15 ? ' class="odd"' : ''}></i>`).join('')}</div>`;
    }
    return '<div class="art"></div>';
  }

  /* ---------- Hero ---------- */
  function renderHero() {
    const g = GAMES[0];
    document.getElementById('hero').innerHTML = `
      <div class="hero-art">${art(g.id, true)}</div>
      <div class="hero-content">
        <span class="kicker"><b>J</b> Original Jogateca</span>
        <h1 class="hero-title">${esc(g.title)}</h1>
        <p class="hero-tagline">${esc(g.tagline)}</p>
        <div class="meta">
          <span class="match">${g.match}% relevante</span><span>${g.year}</span>
          <span class="age">${g.age}</span><span>${esc(g.meta)}</span>
        </div>
        <p class="hero-desc">${esc(g.description)}</p>
        <div class="actions">
          <a class="btn btn-play" href="${g.href}">▶ Jogar</a>
          <button class="btn btn-ghost" data-info="${g.id}">ⓘ Mais informações</button>
        </div>
      </div>`;
  }

  /* ---------- Fileiras ---------- */
  function gameCard(g) {
    const soon = g.status === 'soon';
    return `
      <article class="card${soon ? ' soon' : ''}" tabindex="0" data-info="${g.id}" aria-label="${esc(g.title)}${soon ? ', em breve' : ''}">
        ${art(g.id)}
        ${soon ? '<span class="badge soon">EM BREVE</span>' : '<span class="badge">NOVO</span>'}
        <div class="card-title">${esc(g.title)}${g.subtitle ? `<small>${esc(g.subtitle)}</small>` : ''}</div>
        <div class="card-hover">
          ${soon
            ? '<span class="btn-round" aria-hidden="true">⏳</span>'
            : `<a class="btn-round play" href="${g.href}" aria-label="Jogar ${esc(g.title)}" data-stop>▶</a>`}
          <button class="btn-round${inList(g.id) ? ' on' : ''}" data-list="${g.id}" data-stop
            aria-label="${inList(g.id) ? 'Remover da' : 'Adicionar à'} minha lista">${inList(g.id) ? '✓' : '+'}</button>
          <span class="info">${soon ? 'Em breve' : `<span class="match">${g.match}%</span>`} · ${esc(g.tags.slice(0, 2).join(' · '))}</span>
        </div>
      </article>`;
  }

  function modeCard(m) {
    const g = GAMES.find((x) => x.id === m.game);
    const rec = modeRecord(m);
    return `
      <a class="card mode" href="${g.href}?mode=${m.id}" aria-label="${esc(g.title)}: ${esc(m.title)}">
        ${art(m.art || m.id)}
        ${rec ? `<span class="record">${esc(rec)}</span>` : ''}
        <div class="card-title">${esc(m.title)}<small>${esc(g.title)}</small></div>
      </a>`;
  }

  // Partidas salvas pelos jogos que guardam progresso (Sudoku, Canteiros, Ponto-Cruz, Pontes, Kakuro, Acampamento, Travessia, Enigma de Einstein, Cerca, Lampiões, Fios, Binário e Garimpo).
  function continueCards() {
    let html = '';
    const sv = store.get('sudoku:save');
    if (sv && !sv.won && Array.isArray(sv.values)) {
      const names = { facil: 'Fácil', medio: 'Médio', dificil: 'Difícil', especialista: 'Especialista' };
      const empty = sv.puzzle.filter((v) => !v).length;
      const filled = sv.values.filter((v, i) => v && !sv.puzzle[i]).length;
      const pct = empty ? Math.round((filled / empty) * 100) : 0;
      html += `
      <a class="card mode" href="games/sudoku/index.html?mode=continuar" aria-label="Continuar Sudoku, ${pct}% preenchido">
        ${art('sudoku')}
        <span class="record">${fmtTime(Math.floor(sv.elapsed / 1000))}</span>
        <div class="card-title">Sudoku<small>${esc(sv.daily ? 'Do dia' : names[sv.diff] || '')}</small></div>
        <span class="progress" style="--p:${pct}%"></span>
      </a>`;
    }
    const cv = store.get('canteiros:save');
    if (cv && !cv.won && Array.isArray(cv.cells)) {
      const flowers = cv.cells.filter((v) => v === 2).length;
      const pct = Math.round((flowers / cv.n) * 100);
      html += `
      <a class="card mode" href="games/canteiros/index.html?mode=continuar" aria-label="Continuar Canteiros, ${flowers} de ${cv.n} flores">
        ${art('canteiros')}
        <span class="record">${fmtTime(Math.floor(cv.elapsed / 1000))}</span>
        <div class="card-title">Canteiros<small>${esc(cv.daily ? 'Do dia' : `${cv.n}×${cv.n}`)}</small></div>
        <span class="progress" style="--p:${pct}%"></span>
      </a>`;
    }
    const bs = store.get('binario:save');
    if (bs && !bs.won && Array.isArray(bs.cells)) {
      const empty = bs.givens.filter((v) => v < 0).length;
      const pct = empty ? Math.round((bs.cells.filter((v, i) => v >= 0 && bs.givens[i] < 0).length / empty) * 100) : 0;
      html += `
      <a class="card mode" href="games/binario/index.html?mode=continuar" aria-label="Continuar Binário, ${pct}% preenchido">
        ${art('binario')}
        <span class="record">${fmtTime(Math.floor(bs.elapsed / 1000))}</span>
        <div class="card-title">Binário<small>${esc(bs.daily ? 'Do dia' : `${bs.n}×${bs.n}`)}</small></div>
        <span class="progress" style="--p:${pct}%"></span>
      </a>`;
    }
    const gs = store.get('garimpo:save');
    if (gs && !gs.won && !gs.gaveUp && Array.isArray(gs.open)) {
      const pct = Math.round((gs.open.filter(Boolean).length / (gs.W * gs.H - gs.B)) * 100);
      html += `
      <a class="card mode" href="games/garimpo/index.html?mode=continuar" aria-label="Continuar Garimpo, ${pct}% cavado">
        ${art('garimpo')}
        <span class="record">${fmtTime(Math.floor(gs.elapsed / 1000))}</span>
        <div class="card-title">Garimpo<small>${esc(gs.daily ? 'Do dia' : `${gs.W}×${gs.H}`)}</small></div>
        <span class="progress" style="--p:${pct}%"></span>
      </a>`;
    }
    const fv = store.get('fios:save');
    if (fv && !fv.won && Array.isArray(fv.paths)) {
      const pct = Math.round((new Set(fv.paths.flat()).size / (fv.n * fv.n)) * 100);
      html += `
      <a class="card mode" href="games/fios/index.html?mode=continuar" aria-label="Continuar Fios, ${pct}% da placa">
        ${art('fios')}
        <span class="record">${fmtTime(Math.floor(fv.elapsed / 1000))}</span>
        <div class="card-title">Fios<small>${esc(fv.daily ? 'Do dia' : `${fv.n}×${fv.n}`)}</small></div>
        <span class="progress" style="--p:${pct}%"></span>
      </a>`;
    }
    const lv = store.get('lampioes:save');
    if (lv && !lv.won && Array.isArray(lv.cells)) {
      const lamps = lv.cells.filter((v) => v === 1).length;
      const pct = Math.min(100, Math.round((lamps / lv.lamps.length) * 100));
      html += `
      <a class="card mode" href="games/lampioes/index.html?mode=continuar" aria-label="Continuar Lampiões, ${lamps} lampiões">
        ${art('lampioes')}
        <span class="record">${fmtTime(Math.floor(lv.elapsed / 1000))}</span>
        <div class="card-title">Lampiões<small>${esc(lv.daily ? 'Do dia' : `${lv.n}×${lv.n}`)}</small></div>
        <span class="progress" style="--p:${pct}%"></span>
      </a>`;
    }
    const cc = store.get('cerca:save');
    if (cc && !cc.won && Array.isArray(cc.edges)) {
      const lines = cc.edges.filter((v) => v === 1).length;
      html += `
      <a class="card mode" href="games/cerca/index.html?mode=continuar" aria-label="Continuar Cerca, ${lines} cercas">
        ${art('cerca')}
        <span class="record">${fmtTime(Math.floor(cc.elapsed / 1000))}</span>
        <div class="card-title">Cerca<small>${esc(cc.daily ? 'Do dia' : `${cc.n}×${cc.n}`)}</small></div>
      </a>`;
    }
    const ev = store.get('einstein:save');
    if (ev && !ev.won && Array.isArray(ev.cand)) {
      const done = ev.cand.reduce((t, row) => t + row.filter((m) => m && !(m & (m - 1))).length, 0);
      const pct = Math.round((done / (ev.n * ev.K)) * 100);
      html += `
      <a class="card mode" href="games/einstein/index.html?mode=continuar" aria-label="Continuar Enigma de Einstein, ${pct}% resolvido">
        ${art('einstein')}
        <span class="record">${fmtTime(Math.floor(ev.elapsed / 1000))}</span>
        <div class="card-title">Enigma de Einstein<small>${esc(ev.daily ? 'Do dia' : `${ev.n} casas`)}</small></div>
        <span class="progress" style="--p:${pct}%"></span>
      </a>`;
    }
    const tv = store.get('travessia:save');
    if (tv && !tv.won && typeof tv.state === 'number') {
      html += `
      <a class="card mode" href="games/travessia/index.html?mode=continuar" aria-label="Continuar Travessia, fase ${tv.k + 1}">
        ${art('travessia')}
        <span class="record">${tv.trips} ${tv.trips === 1 ? 'viagem' : 'viagens'}</span>
        <div class="card-title">Travessia<small>Fase ${tv.k + 1}</small></div>
      </a>`;
    }
    const av = store.get('acampamento:save');
    if (av && !av.won && Array.isArray(av.cells)) {
      const tents = av.cells.filter((v) => v === 3).length;
      const pct = Math.min(100, Math.round((tents / av.trees.length) * 100));
      html += `
      <a class="card mode" href="games/acampamento/index.html?mode=continuar" aria-label="Continuar Acampamento, ${tents} de ${av.trees.length} barracas">
        ${art('acampamento')}
        <span class="record">${fmtTime(Math.floor(av.elapsed / 1000))}</span>
        <div class="card-title">Acampamento<small>${esc(av.daily ? 'Do dia' : `${av.n}×${av.n}`)}</small></div>
        <span class="progress" style="--p:${pct}%"></span>
      </a>`;
    }
    const kv = store.get('kakuro:save');
    if (kv && !kv.won && Array.isArray(kv.values)) {
      const total = kv.puzzle.split('').filter((c) => c !== '#').length;
      const pct = Math.round((kv.values.filter(Boolean).length / total) * 100);
      html += `
      <a class="card mode" href="games/kakuro/index.html?mode=continuar" aria-label="Continuar Kakuro, ${pct}% preenchida">
        ${art('kakuro')}
        <span class="record">${fmtTime(Math.floor(kv.elapsed / 1000))}</span>
        <div class="card-title">Kakuro<small>${kv.n}×${kv.n}</small></div>
        <span class="progress" style="--p:${pct}%"></span>
      </a>`;
    }
    const bv = store.get('pontes:save');
    if (bv && !bv.won && Array.isArray(bv.counts)) {
      const deg = (i) => bv.edges.reduce((s, e, k) => s + (e.a === i || e.b === i ? bv.counts[k] : 0), 0);
      const done = bv.islands.filter((s, i) => deg(i) === s.v).length;
      const pct = Math.round((done / bv.islands.length) * 100);
      html += `
      <a class="card mode" href="games/pontes/index.html?mode=continuar" aria-label="Continuar Pontes, ${done} de ${bv.islands.length} ilhas">
        ${art('pontes')}
        <span class="record">${fmtTime(Math.floor(bv.elapsed / 1000))}</span>
        <div class="card-title">Pontes<small>${bv.n}×${bv.n}</small></div>
        <span class="progress" style="--p:${pct}%"></span>
      </a>`;
    }
    const pv = store.get('pontocruz:save');
    if (pv && !pv.won && Array.isArray(pv.cells)) {
      const total = pv.grid.filter(Boolean).length;
      const pct = Math.min(100, Math.round((pv.cells.filter((v) => v === 1).length / total) * 100));
      html += `
      <a class="card mode" href="games/pontocruz/index.html?mode=continuar" aria-label="Continuar Ponto-Cruz, ${pct}% bordado">
        ${art('pontocruz')}
        <span class="record">${fmtTime(Math.floor(pv.elapsed / 1000))}</span>
        <div class="card-title">Ponto-Cruz<small>${pv.n}×${pv.n}</small></div>
        <span class="progress" style="--p:${pct}%"></span>
      </a>`;
    }
    return html;
  }

  function row(id, title, cardsHtml, note = '') {
    if (!cardsHtml) return '';
    return `
      <section class="row" id="row-${id}">
        <h2>${title}${note ? `<small>${note}</small>` : ''}</h2>
        <div class="row-track-wrap">
          <button class="row-arrow left" aria-label="Rolar para a esquerda" data-scroll="-1">‹</button>
          <div class="row-track">${cardsHtml}</div>
          <button class="row-arrow right" aria-label="Rolar para a direita" data-scroll="1">›</button>
        </div>
      </section>`;
  }

  function renderRows() {
    const available = GAMES.filter((g) => g.status === 'available');
    const soon = GAMES.filter((g) => g.status === 'soon');
    const list = getList().map((id) => GAMES.find((g) => g.id === id)).filter(Boolean);
    const perception = GAMES.filter((g) => g.tags.includes('Percepção'));

    document.getElementById('rows').innerHTML = [
      row('continuar', 'Continuar jogando', continueCards()),
      row('jogar', 'Jogue agora', available.map(gameCard).join('')),
      row('junto', 'Para jogar junto', MODES.filter((m) => m.id === 'duelo').map(modeCard).join(''), 'duelo no mesmo aparelho'),
      row('minha-lista', 'Minha lista', list.map(gameCard).join('')),
      ...available.map((g) => row(`modos-${g.id}`, `Modos de ${esc(g.title)}`,
        MODES.filter((m) => m.game === g.id).map(modeCard).join(''), 'escolha e vá direto pro jogo')),
      row('em-breve', 'Em breve', soon.map(gameCard).join('')),
      row('percepcao', 'Para treinar a percepção', perception.map(gameCard).join('')),
    ].join('');
    document.getElementById('navLista').hidden = list.length === 0;
    document.getElementById('navBreve').hidden = soon.length === 0;
  }

  /* ---------- Modal ---------- */
  const modal = document.getElementById('modal');
  let lastFocus = null;

  function openModal(id) {
    const g = GAMES.find((x) => x.id === id);
    if (!g) return;
    const soon = g.status === 'soon';
    const modes = MODES.filter((m) => m.game === g.id);
    document.getElementById('modalBody').innerHTML = `
      <div class="modal-art">
        ${art(g.id, true)}
        <div class="modal-head">
          <h2 id="modalTitle">${esc(g.title)}${g.subtitle ? ` <small style="font-size:.4em;letter-spacing:.2em">${esc(g.subtitle.toUpperCase())}</small>` : ''}</h2>
          <div class="actions">
            ${soon
              ? '<span class="btn btn-disabled">⏳ Em breve</span>'
              : `<a class="btn btn-play" href="${g.href}">▶ Jogar</a>`}
            <button class="btn-round${inList(g.id) ? ' on' : ''}" data-list="${g.id}"
              aria-label="${inList(g.id) ? 'Remover da' : 'Adicionar à'} minha lista">${inList(g.id) ? '✓' : '+'}</button>
          </div>
        </div>
      </div>
      <div class="modal-content">
        <div>
          <div class="meta">
            ${soon ? '<span class="match">Em breve</span>' : `<span class="match">${g.match}% relevante</span>`}
            <span>${g.year}</span><span class="age">${g.age}</span><span>${esc(g.meta)}</span>
          </div>
          <p><strong>${esc(g.tagline)}</strong></p>
          <p>${esc(g.description)}</p>
        </div>
        <div class="modal-side">
          <div><b>Gêneros:</b> ${esc(g.tags.join(', '))}</div>
          <div><b>Duração:</b> ${esc(g.duration)}</div>
          <div><b>Plataforma:</b> navegador (celular e computador)</div>
        </div>
        ${soon ? '<div class="soon-note">Este jogo está em produção. Adicione à sua lista para encontrá-lo rápido quando sair.</div>' : ''}
        ${modes.length ? `<h3>Modos</h3><div class="mode-list">${modes.map((m, i) => `
          <a class="mode-item" href="${g.href}?mode=${m.id}">
            <span class="n">${i + 1}</span>
            <span class="thumb">${art(m.art || m.id)}</span>
            <span><strong>${esc(m.title)}</strong><span>${esc(m.text)}</span></span>
            <span class="rec">${esc(modeRecord(m))}</span>
          </a>`).join('')}</div>` : ''}
      </div>`;
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    modal.querySelector('.modal-close').focus();
  }

  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
  }

  /* ---------- Eventos ---------- */
  document.addEventListener('click', (e) => {
    const listBtn = e.target.closest('[data-list]');
    if (listBtn) {
      e.preventDefault();
      const id = listBtn.dataset.list;
      toggleList(id);
      if (!modal.hidden) openModal(id);
      return;
    }
    if (e.target.closest('[data-stop]')) return; // links/botões dentro do card
    if (e.target.closest('[data-close]')) { closeModal(); return; }
    const scrollBtn = e.target.closest('[data-scroll]');
    if (scrollBtn) {
      const track = scrollBtn.parentElement.querySelector('.row-track');
      track.scrollBy({ left: Number(scrollBtn.dataset.scroll) * track.clientWidth * 0.85, behavior: 'smooth' });
      return;
    }
    const info = e.target.closest('[data-info]');
    if (info) openModal(info.dataset.info);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.hidden) closeModal();
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.card[data-info]')) {
      e.preventDefault();
      openModal(e.target.dataset.info);
    }
  });

  const topbar = document.getElementById('topbar');
  const onScroll = () => topbar.classList.toggle('solid', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true });

  // Recordes podem mudar quando o jogador volta do jogo (bfcache): atualiza depois de mostrar a página.
  window.addEventListener('pageshow', (e) => { if (e.persisted) requestAnimationFrame(() => setTimeout(renderRows, 0)); });

  function render() { renderRows(); }
  renderHero();
  render();
  // Ler a rolagem logo de cara forçava o navegador a calcular o layout da página inteira antes de pintar.
  requestAnimationFrame(onScroll);
})();
