# Jogateca

Um catálogo de jogos de navegador no estilo "streaming": destaque no topo, fileiras roláveis, modal com detalhes, "Minha lista" e seção **Em breve**. Tudo em HTML/CSS/JS puro — sem build, sem dependências.

## Jogos

| Jogo | Status | Descrição |
| --- | --- | --- |
| **Croma** (`games/croma/`) | Disponível | Jogo de percepção de cores com 3 modos |
| **Tamanho Certo** (`games/tamanho/`) | Disponível | Estimar tamanhos e proporções sem régua, rodadas sem fim |
| **Sudoku** (`games/sudoku/`) | Disponível | Sudoku clássico com 4 dificuldades e grade do dia |
| **Canteiros** (`games/canteiros/`) | Disponível | Lógica: uma flor por linha, coluna e canteiro, sem flores encostadas |
| **Ponto-Cruz** (`games/pontocruz/`) | Disponível | Nonograma com tema de bordado: coleção de desenhos e motivos infinitos |

### Croma

- **Memória** — a cor aparece por 5 s / 3 s / 1,5 s (Fácil/Normal/Difícil); recrie com matiz, saturação e brilho. 5 rodadas, nota 0–10 cada, calculada pela diferença perceptual CIEDE2000. Mostra quanto você errou em cada eixo.
- **Desafio Diário** — 5 cores geradas a partir da data, iguais para todo mundo; uma tentativa por dia e resultado compartilhável com emojis.
- **Olho Clínico** — ache o quadrado de tom diferente; a grade cresce e a diferença diminui a cada nível. 60 s, erro custa 3 s.

Links diretos para cada modo: `games/croma/?mode=memoria`, `?mode=diario`, `?mode=olho`.

### Tamanho Certo

- **Ilimitado** — rodadas sem fim com 3 vidas. A margem de erro fecha 3% a cada rodada (até 45% da inicial). Dentro da margem você ganha de 10 a 100 pontos; fora dela, perde uma vida. Três acertos "na mosca" seguidos devolvem uma vida.
- **Treino** — escolha um tipo de desafio e pratique sem vidas.

Desafios: **Igualar** (deixar B do mesmo tamanho, metade da largura, dobro da área, girado ou com outra forma), **Fração** (marcar X% de uma barra sem marcações), **Quantas vezes?** (razão de largura ou de área) e **Memória** (reproduzir o comprimento de uma linha vista por um instante). O controle tem limites sorteados a cada rodada, então a posição dele não entrega a resposta.

Links diretos: `games/tamanho/?mode=ilimitado`, `?mode=treino`.

### Sudoku

- Grades geradas no próprio navegador (`games/sudoku/engine.js`) que **fecham só com raciocínio, sem chute**: um resolvedor "humano" confirma cada grade, e a dificuldade é a técnica mais avançada exigida — Fácil (casas e números únicos), Médio (candidatos travados), Difícil (pares e trios) e Especialista (X-Wing / Y-Wing).
- **Sudoku do dia**: grade Médio gerada a partir da data, igual para todo mundo.
- Notas (tecla N ou Shift + número), desfazer, apagar, dica, destaque de linha/coluna/bloco e de números iguais, erros em vermelho e contagem de quantos de cada número faltam.
- Cronômetro com pausa (pausa sozinho quando a aba fica em segundo plano). O progresso é salvo e aparece em **Continuar jogando** no catálogo.
- Recorde de tempo por dificuldade (partidas com dica não contam).

Links diretos: `games/sudoku/?mode=facil|medio|dificil|especialista|diario|continuar`.

### Canteiros

Quebra-cabeça do gênero *Star Battle* (1 estrela), com tema e visual próprios: plante uma flor em cada linha, coluna e canteiro, sem que duas flores se encostem (nem na diagonal).

- Tabuleiros de 6×6 a 9×9 gerados no navegador (`games/canteiros/engine.js`), com **solução única** e que **fecham só com raciocínio**: um resolvedor confirma cada tabuleiro usando as deduções clássicas do gênero (casa única, eliminação por bloqueio e confinamento de k canteiros em k linhas/colunas). Os de 8×8 e 9×9 exigem confinamento. O motor também roda no Node para testes.
- Cada canteiro tem a sua flor (girassol, tulipa, margarida, campânula, lavanda, miosótis, papoula, trevo e rosa); divisas em cerca-viva e moldura de madeira.
- **Jardim do dia** (8×8) igual para todo mundo.
- Toque: vazio → semente (marca "sem flor") → flor. Arrastar marca várias casas. Teclado: setas, Enter/Espaço, X, F, Backspace.
- Conflitos destacados em vermelho com listras e explicação, marcação automática opcional das casas bloqueadas, dica, desfazer, recomeçar, pausa e progresso salvo.

Links diretos: `games/canteiros/?mode=6|7|8|9|diario|continuar`.

### Ponto-Cruz

Nonograma com tema de bordado: cada casa pintada é um ponto em X sobre etamina, dentro de um bastidor de madeira. Ao terminar, o bordado ganha as cores do desenho.

- **Coleção**: 17 desenhos em pixel art (5×5, 10×10 e 15×15) em `games/pontocruz/pictures.js`, que aparecem bordados no menu conforme você os completa.
- **Motivos**: padrões simétricos gerados no navegador (5×5, 10×10, 15×15), como os bordados tradicionais, e o **Motivo do dia** (10×10) igual para todo mundo.
- Todo quebra-cabeça é conferido pelo resolvedor linha a linha (`games/pontocruz/engine.js`): **fecha só com raciocínio, sem chute**.
- Bordar / Marcar, arrastar ao longo da linha ou coluna, botão direito para marcar, pistas que se apagam quando a linha bate, dica que aponta erros ou mostra uma casa dedutível, desfazer, recomeçar, pausa e progresso salvo.

Links diretos: `games/pontocruz/?mode=5|10|15|diario|colecao|continuar`.

Recordes ficam no `localStorage` do navegador.

## Rodar localmente

```bash
python3 -m http.server 8000
# abra http://localhost:8000
```

Para publicar, basta servir a pasta (ex.: GitHub Pages apontando para a raiz do branch).

## Navegação nos jogos

Dentro de qualquer jogo, o botão **Menu** (canto superior esquerdo) volta ao menu do jogo para trocar modo, tamanho ou dificuldade. No Croma e no Tamanho Certo, sair no meio de uma partida pede um segundo toque para confirmar; no Sudoku e no Canteiros o progresso fica salvo.

## Instalar como app (PWA)

O site é um PWA: pode ser instalado no computador e no celular, abre em janela própria e funciona sem internet depois da primeira visita.

- **Chrome / Edge (Windows, Mac, Linux, Android):** botão **Instalar app** no topo do catálogo (ou o ícone de instalar na barra de endereço).
- **iPhone / iPad (Safari):** Compartilhar › **Adicionar à Tela de Início**. O botão do site mostra esse passo a passo.
- **Safari no Mac:** Arquivo › **Adicionar ao Dock**.

Requisitos: o site precisa estar em **HTTPS** (GitHub Pages já é) ou em `localhost`.

Arquivos: `manifest.webmanifest` (nome, ícones, atalhos para os modos do Croma), `sw.js` (cache offline) e `pwa.js` (botão de instalar). Ao mudar ou adicionar arquivos, inclua-os em `ASSETS` no `sw.js` e aumente `VERSION`.

## Publicar no GitHub Pages

1. No GitHub, abra o repositório › **Settings** › **Pages**.
2. Em *Source*, escolha **Deploy from a branch**, selecione o branch e a pasta `/ (root)`, e salve.
3. Em alguns minutos o site fica em `https://<usuario>.github.io/web_games/`.

## Adicionar um jogo

1. Crie a pasta `games/<id>/` com o `index.html` do jogo.
2. Adicione um objeto no array `GAMES` em `app.js` (`status: 'available'` ou `'soon'`).
3. Inclua os arquivos do jogo em `ASSETS` no `sw.js` e aumente `VERSION`.
4. Opcional: crie a arte do card em `style.css` (`.art-<id>`) e trate o `id` na função `art()`.
