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
| **Sopa Relâmpago** (`games/sopa/`) | Disponível | Palavras numa grade de letras contra o relógio; sozinho ou em duelo |
| **Contas Relâmpago** (`games/contas/`) | Disponível | Contas de cabeça contra o relógio; sozinho ou em duelo |
| **Escada** (`games/escada/`) | Disponível | Palavras: de uma palavra a outra trocando uma letra por vez |
| **Garimpo** (`games/garimpo/`) | Disponível | Campo minado em que toda partida fecha só com lógica |
| **Binário** (`games/binario/`) | Disponível | Lógica: 0 e 1 num painel de azulejos |
| **Fios** (`games/fios/`) | Disponível | Ligar pinos da mesma cor sem cruzar, usando a placa inteira |
| **Lampiões** (`games/lampioes/`) | Disponível | Lógica: iluminar a praça sem um lampião iluminar outro |
| **Cerca** (`games/cerca/`) | Disponível | Lógica: um único cercado; os números dizem quantos lados têm cerca |
| **Enigma de Einstein** (`games/einstein/`) | Disponível | Quem mora em cada casa: dedução com pistas, 4 tamanhos e enigma do dia |
| **Travessia** (`games/travessia/`) | Disponível | Atravessar o rio com personagens que não podem ficar ou ir juntos |
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

### Binário

Quebra-cabeça do gênero *Takuzu* (*Binairo*), com tema de painel de azulejos: brancos (0) e azuis (1). Nunca três iguais seguidos, metade de cada em toda linha e coluna, e nenhuma linha ou coluna repetida.

- Fácil (6×6), Médio (8×8), Difícil (10×10), Desafio (12×12) e o **Painel do dia** (10×10), gerados por `games/binario/engine.js` (grade completa sorteada; azulejos tirados enquanto o resolvedor ainda fecha tudo).
- Resolvedor em três níveis: par, sanduíche e conta; todas as formas de completar uma linha (sem repetir uma linha pronta); hipótese curta. **Solução única e sem chute**, conferida por força bruta.
- Toque: vazio → 0 → 1; segurar faz o caminho inverso; teclas 0 e 1. Erros pelas regras em vermelho, algarismos podem ser escondidos, dica que explica a regra e destaca a linha usada.

Links diretos: `games/binario/?mode=6|8|10|12|diario|continuar`.

### Garimpo

Campo minado **sem chute**, com tema de garimpo: cave o terreno sem cair nos buracos; os números contam os buracos nas oito casas em volta.

- Fácil (8×10, 13 buracos), Médio (10×13, 25), Difícil (12×16, 44), Desafio (14×20, 66) e o **Terreno do dia**. A partida começa com uma área aberta, e `games/garimpo/engine.js` só aceita terrenos que um resolvedor abre por inteiro a partir dali (números completos, pares de números vizinhos e a conta total de buracos).
- Toque cava, tocar e segurar põe estaca (ou troque o modo do toque); tocar num número com as estacas certas cava o resto. Caiu num buraco? Dá para voltar a jogada (conta como tropeço). Dica mostra a próxima casa certa e explica por quê. Pepitas de ouro no fim.

Links diretos: `games/garimpo/?mode=facil|medio|dificil|desafio|diario|continuar`.

### Duelo local (`shared/duelo.js`)

Módulo comum para jogos em dupla (ou até 4 pessoas) **no mesmo aparelho**: escolha dos jogadores (nomes lembrados), tela de "vez de fulano" entre as rodadas (ninguém vê a pontuação dos outros até o fim), placar com medalhas, revanche e histórico de vitórias por jogo no `localStorage`. Os jogos só cuidam da partida; todos recebem a mesma rodada (mesma semente).

### Sopa Relâmpago

Grade de letras numa tigela de sopa: ache palavras ligando letras vizinhas (inclusive na diagonal) antes do tempo acabar.

- Tigela 4×4 ou 5×5, tempo de 1:30, 2:00 ou 3:00. Pontos: 3 letras = 1, 4 = 2, 5 = 3, 6 = 5, 7 = 8, 8+ = 11. Peça "QU"; acentos não importam.
- `games/sopa/engine.js` sorteia letras com pesos do português e só aceita grades com bastante palavras (busca com prefixos). No fim, mostra o que dava para achar.
- Lista em `games/sopa/palavras.js` (~19 mil palavras de 3 a 9 letras), gerada por `tools/sopa_palavras.py` com a mesma base da Escada (`tools/palavras_base.py`).
- Arrastar o dedo pelas letras (ou digitar no computador). Modos: sozinho (recorde por tigela e tempo) e duelo.

Links diretos: `games/sopa/?mode=solo|duelo`.

### Contas Relâmpago

Contas de cabeça num placar de LED: 60 ou 90 segundos, níveis Fácil (+ −), Normal (+ − ×) e Difícil (as quatro, números maiores); fica mais difícil com o tempo. Acerto = 10, com bônus de +5 a partir de 3 seguidos e +10 a partir de 6. A conta é conferida sozinha quando o número de algarismos bate. Modos: sozinho (recorde) e duelo, com a mesma sequência de contas para todos.

Links diretos: `games/contas/?mode=solo|duelo`.

### Escada

Jogo de palavras: vá de uma palavra a outra trocando uma letra por degrau, sempre formando palavras de verdade (acentos não importam).

- **Escada do dia** de 4 e de 5 letras (iguais para todo mundo) e **escadas livres**. Cada escada mostra o mínimo de degraus (busca em largura sobre a lista); chegar no mínimo sem dica vale 3 estrelas. Dica dá o próximo degrau do melhor caminho; dá para voltar tocando num degrau.
- Listas em `games/escada/palavras.js`, geradas por `tools/escada_palavras.py` a partir da lista de frequência FrequencyWords (MIT), conferida no dicionário VERO só como filtro, mais as listas do Prensa.

Links diretos: `games/escada/?mode=dia4|dia5|livre4|livre5`.

### Fios

Quebra-cabeça do gênero *Numberlink*, com tema de placa de circuito: ligue os dois pinos de cada cor com um fio, sem cruzar outros fios, usando todas as casas da placa.

- Fácil (5×5), Médio (7×7), Difícil (9×9), Desafio (10×10) e a **Placa do dia** (8×8), gerados no navegador por `games/fios/engine.js`: a placa é dividida em caminhos aleatórios (que preferem casas com poucas saídas e não encostam em si mesmos), e só é aceita se tiver **uma única solução**.
- A unicidade é conferida por um contador exato de soluções (programação dinâmica casa a casa, guardando só a fronteira entre a parte feita e a que falta), validado contra força bruta em centenas de placas pequenas.
- Arraste a partir de um pino ou da ponta de um fio; voltar encolhe o fio; passar por cima de outro fio corta o outro (que volta se você recuar). Tocar num pino solta o fio. Dica coloca um fio inteiro no lugar certo. Desfazer, recomeçar, pausa, progresso salvo e recorde por tamanho.

Links diretos: `games/fios/?mode=5|7|9|10|diario|continuar`.

### Lampiões

Quebra-cabeça do gênero *Akari* (*Light Up*), com tema de praça antiga à noite: cada lampião ilumina a própria casa e segue em linha reta até bater num muro. Toda a calçada precisa ficar iluminada, nenhum lampião pode iluminar outro, e os números nos muros dizem quantos lampiões encostam neles.

- Fácil (7×7), Médio (9×9), Difícil (10×10), Desafio (12×12) e a **Praça do dia** (10×10), gerados no navegador por `games/lampioes/engine.js`: muros simétricos sorteados, lampiões espalhados até tudo acender, muros extras onde o raciocínio empacaria, e números tirados enquanto o resolvedor ainda fecha tudo.
- Resolvedor em três níveis (gradua a dificuldade e garante **solução única e sem chute**, conferida por força bruta em dezenas de grades de cada tamanho): básico (casa iluminada não leva lampião, contas dos números, casa escura com um só jeito de acender), **sombras e combinações** (um lampião que deixaria outra casa sem luz; o que vale em todas as combinações de um número) e **hipótese curta**.
- Toque: lampião → ponto → vazio; arrastar marca pontos; botão direito marca ponto. Pontos automáticos opcionais, lampiões que se iluminam e números estourados em vermelho, contador de casas no escuro, dica que explica a dedução e destaca o muro ou a casa usada.

Links diretos: `games/lampioes/?mode=7|9|10|12|diario|continuar`.

### Cerca

Quebra-cabeça do gênero *Slitherlink*, com tema de pasto: ligue os postes formando um único cercado fechado, sem cruzar nem encostar; cada número diz quantos lados daquela casa têm cerca.

- Fácil (5×5), Médio (7×7), Difícil (8×8), Desafio (10×10) e o **Pasto do dia** (8×8), gerados no navegador por `games/cerca/engine.js`: o cercado nasce de uma região sorteada sem buracos nem pontos de encontro, e os números são tirados enquanto o resolvedor ainda fecha tudo.
- Resolvedor em três níveis, usado para garantir **solução única e sem chute** e para graduar a dificuldade: básico (números, postes com 0 ou 2 cercas, não fechar um cercado menor), **dentro e fora** (relações entre casas vizinhas e os números) e **hipótese curta** (uma suposição que leva logo a contradição). Unicidade conferida por força bruta em centenas de grades.
- Toque entre postes: cerca → × → vazio; arrastar de poste em poste cerca vários lados; botão direito marca ×. × automático opcional, números em vermelho quando não fecham, poste vermelho com 3 ou mais cercas, dica que explica a dedução e destaca a casa ou o poste. Ao fechar, o pasto ganha capim e ovelhas.

Links diretos: `games/cerca/?mode=5|7|8|10|diario|continuar`.

### Enigma de Einstein

O enigma de lógica clássico (casas em fila e pistas), com pistas em português e visual de caderno de detetive.

- Fácil (3 casas × 3 categorias), Médio (4 × 4), Difícil (5 × 5), Gênio (5 casas × 6 categorias) e o **Enigma do dia** (5 × 5). Categorias sorteadas entre cor, morador, bicho, bebida, esporte, fruta e instrumento (`games/einstein/dados.js`, que também monta as frases das pistas).
- Gerador (`games/einstein/engine.js`): sorteia a solução, junta pistas verdadeiras (mesma casa, não é, posição, ao lado, logo à esquerda, em algum lugar à esquerda) até um resolvedor só de dedução fechar tudo, e depois tira as que sobram. Resultado: **solução única e sem chute** (conferido por força bruta nos tamanhos menores).
- Grade de candidatos: toque risca, tocar e segurar escolhe (ou troque o modo do toque). O valor escolhido sai das outras casas sozinho. Pistas com pictograma e riscáveis. Dica corrige um engano ou faz a próxima dedução e destaca a pista usada. Desfazer, recomeçar, pausa, progresso salvo e recorde por tamanho. No celular, a grade fica presa no topo enquanto as pistas rolam.

Links diretos: `games/einstein/?mode=facil|medio|dificil|genio|diario|continuar`.

### Travessia

Quebra-cabeças de travessia de rio com histórias e personagens próprios: leve todo mundo para a outra margem num barco pequeno.

- 9 fases (`games/travessia/fases.js`) que combinam regras de **margem** (quem não pode ficar junto sem alguém por perto), de **barco** (quem não pode ir junto), de **maioria** (um grupo não pode ser maior que outro numa margem), de **tutela** (aprendiz só perto de outro mágico com o próprio mestre), **peso máximo**, **lugares** e **quem sabe remar**.
- O motor (`games/travessia/engine.js`) acha por busca em largura o menor número de viagens de cada fase; `node games/travessia/conferir.js` confere que todas têm solução. Fechar no mínimo e sem dicas vale 3 estrelas.
- Toque para embarcar/desembarcar, **Atravessar** para ir. Regra de barco quebrada impede a saída; regra de margem quebrada mostra quem brigou e pede para desfazer. Dica (embarca o próximo passo de um caminho mais curto a partir de onde você está), desfazer, recomeçar e progresso salvo. Fases liberadas aos poucos.

Links diretos: `games/travessia/?mode=proxima|continuar|<id da fase>` (ex.: `feira`, `circo`, `junina`).

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
