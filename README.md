# Jogateca

Um catálogo de jogos de navegador no estilo "streaming": destaque no topo, fileiras roláveis, modal com detalhes, "Minha lista" e seção **Em breve**. Tudo em HTML/CSS/JS puro — sem build, sem dependências.

## Jogos

| Jogo | Status | Descrição |
| --- | --- | --- |
| **Croma** (`games/croma/`) | Disponível | Jogo de percepção de cores com 3 modos |
| **Tamanho Certo** (`games/tamanho/`) | Disponível | Estimar tamanhos e proporções sem régua, rodadas sem fim |

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

Recordes ficam no `localStorage` do navegador.

## Rodar localmente

```bash
python3 -m http.server 8000
# abra http://localhost:8000
```

Para publicar, basta servir a pasta (ex.: GitHub Pages apontando para a raiz do branch).

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
