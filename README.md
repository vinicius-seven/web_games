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
| **Pontes** (`games/pontes/`) | Disponível | Ligar ilhas com pontes (gênero Hashi), num arquipélago tropical |
| **Prensa** (`games/prensa/`) | Disponível | Adivinhar palavras de 5 letras: 1, 2 ou 4 por dia, e modo livre |
| **Palavra do Dia** (`games/palavradodia/`) | Disponível | Dois jogos diários: Colmeia (7 letras) e Proximidade (distância de sentido) |
| **Acampamento** (`games/acampamento/`) | Disponível | Lógica: uma barraca ao lado de cada árvore, sem barracas encostadas |
| **Kakuro** (`games/kakuro/`) | Disponível | Somas cruzadas numa lousa, 4 tamanhos e lousa do dia |

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

### Pontes

Quebra-cabeça do gênero *Hashi* com tema de arquipélago: cada ilha diz quantas pontes saem dela; pontes retas, no máximo duas entre as mesmas ilhas, sem cruzar, e todas as ilhas ligadas no fim.

- Mapas de 7×7 (Enseada) a 13×13 (Oceano) gerados no navegador (`games/pontes/engine.js`), conferidos por um resolvedor "humano" (capacidade das ilhas, limites do vizinho, cruzamentos e "não isolar um grupo"): **solução única e sem chute**. Mapa do dia 9×9.
- Arraste de uma ilha na direção da vizinha, toque no mar entre as duas ou toque numa ilha e depois na outra. Pontes que cruzariam outra são recusadas com aviso. Teclado: setas escolhem a ilha, Shift + seta põe ponte.
- Ilhas completas ficam verdes, ilhas com pontes demais ficam vermelhas; dica, desfazer, recomeçar, pausa e progresso salvo.

Links diretos: `games/pontes/?mode=7|9|11|13|diario|continuar`.

### Prensa

Jogo de palavras de 5 letras com tema de tipografia (tipos móveis de madeira e tinta): verde = letra no lugar certo, ocre = está na palavra em outro lugar, carvão = não está.

- Modos **1 palavra** (6 tentativas), **2 palavras** (7) e **4 palavras** (9), que mudam todo dia à meia-noite e são iguais para todo mundo, e **Livre**, com palavras sorteadas sem limite.
- Acentos e cedilha são preenchidos sozinhos (`acido` → `ácido`); tocar numa casa leva o cursor até ela; teclado na tela com as cores do que já se sabe (dividido por palavra nos modos com várias palavras).
- Estatísticas por modo (jogos, % de vitórias, sequência, distribuição), compartilhamento em emoji, contagem até a próxima palavra e modo de alto contraste.
- **Lista de palavras própria**: `games/prensa/palavras.js` é gerado por `tools/prensa_palavras.py` — 894 respostas (palavras comuns, escolhidas à mão) e 2.936 aceitas (respostas + plurais, femininos e conjugações regulares geradas por regra + palavras da lista de frequência FrequencyWords, licença MIT, filtrada sem inglês, nomes próprios e palavrões, em `tools/prensa_frequencia.txt`). Para incluir palavras, edite o script e rode `python3 tools/prensa_palavras.py games/prensa/palavras.js`.

Links diretos: `games/prensa/?mode=um|dois|quatro|livre`.

### Palavra do Dia

Página inicial com dois jogos de palavras diários (iguais para todo mundo) e modo livre em cada um.

- **Colmeia** (`colmeia.html`): forme palavras de 4+ letras com as 7 letras da colmeia, sempre usando a do centro. 1 ponto por palavra de 4 letras, 1 por letra nas maiores, +7 pela palavra-chave (usa as 7 letras). Níveis de Ovo a Rainha, dicas por letra inicial e tamanho, palavras de ontem. Dicionário de ~9.500 palavras (sem S, para não virar lista de plurais) gerado por `tools/colmeia_dados.py` a partir da FrequencyWords (MIT), confirmado pelo dicionário VERO (radicais e conjugações regulares) e sem nomes próprios e palavrões.
- **Proximidade** (`proximidade.html`): digite palavras e veja a posição de cada uma numa fila de ~13.500 palavras ordenadas pela proximidade de sentido com a palavra secreta (1 = acertou). Plural, feminino e verbo conjugado contam como a forma básica. Dica, desistir, 60 jogos anteriores e as 100 palavras mais próximas no fim. Distâncias calculadas por `tools/proximidade_dados.py` com os vetores fastText do modelo `pt_core_news_lg` do spaCy (**CC BY-SA 4.0**; os dados derivados em `games/palavradodia/proximidade/` seguem a mesma licença — veja o `LEIA-ME.txt` da pasta).

Links diretos: `games/palavradodia/?mode=colmeia|colmeia-livre|proximidade|proximidade-livre`.

### Acampamento

Quebra-cabeça do gênero "barracas e árvores", com tema e visual próprios de camping: arme uma barraca encostada (pelo lado) em cada árvore, cada barraca pertencendo a uma árvore só, sem que duas barracas se encostem (nem na diagonal). Os números nas placas dizem quantas barracas há em cada linha e coluna.

- Tamanhos Fácil (6×6), Médio (8×8), Difícil (10×10) e Desafio (12×12), e o **Camping do dia** (8×8), todos gerados no navegador por `games/acampamento/engine.js` em milissegundos.
- Cada campo é conferido por um resolvedor "humano": **solução única e sem chute**. Deduções básicas (casas longe de árvores, vizinhas de barraca, contas de linha fechadas, árvore com uma só opção, pares árvore–barraca) e avançadas (casa vizinha de todas as opções de uma árvore; testar as formas possíveis de completar uma linha). O Fácil usa só as básicas; Difícil, Desafio e o do dia exigem as avançadas.
- Toque: vazio → barraca → grama → vazio; arrastar marca grama; botão direito do mouse marca grama; tocar num número com a conta fechada grama o resto da linha. Teclado: setas, Enter/Espaço, T, G, Backspace, Z, H, P.
- Barracas encostadas, barraca sem árvore, árvore sem lugar e linha com barracas demais aparecem em vermelho. Grama automática opcional, dica (desfaz um engano ou arma a próxima barraca dedutível), desfazer, recomeçar, pausa, progresso salvo e recorde por tamanho.

Links diretos: `games/acampamento/?mode=6|8|10|12|diario|continuar`.

### Kakuro

Somas cruzadas com tema de lousa de escola: cada sequência de casas claras soma o número da pista, sem repetir algarismo.

- Tamanhos Fácil (6×6), Médio (8×8), Difícil (10×10) e Desafio (12×12), e a **Lousa do dia** (8×8).
- Grades simétricas geradas por `games/kakuro/engine.js` e conferidas por um resolvedor "humano" (combinações de cada soma × o que cada casa aceita): **solução única e sem chute**. Como gerar as grandes leva segundos, o jogo usa um banco pronto (`games/kakuro/banco.js`), criado por `node tools/kakuro_banco.js [segundos] [processos]`.
- Barra de **combinações** da casa selecionada (ex.: "16 em 2 casas: 7+9"), anotações, desfazer, dica (a próxima casa dedutível), erros em giz rosa, pausa, progresso salvo e recorde por tamanho.

Links diretos: `games/kakuro/?mode=6|8|10|12|diario|continuar`.

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
