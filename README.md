# Jogateca

Um catálogo de jogos de navegador no estilo "streaming": destaque no topo, fileiras roláveis, modal com detalhes, "Minha lista" e seção **Em breve**. Tudo em HTML/CSS/JS puro — sem build, sem dependências.

## Jogos

| Jogo | Status | Descrição |
| --- | --- | --- |
| **Croma** (`games/croma/`) | Disponível | Jogo de percepção de cores com 3 modos |
| **Tamanho Certo — Ilimitado** | Em breve | Estimar tamanhos e proporções, rodadas sem fim |

### Croma

- **Memória** — a cor aparece por 5 s / 3 s / 1,5 s (Fácil/Normal/Difícil); recrie com matiz, saturação e brilho. 5 rodadas, nota 0–10 cada, calculada pela diferença perceptual CIEDE2000. Mostra quanto você errou em cada eixo.
- **Desafio Diário** — 5 cores geradas a partir da data, iguais para todo mundo; uma tentativa por dia e resultado compartilhável com emojis.
- **Olho Clínico** — ache o quadrado de tom diferente; a grade cresce e a diferença diminui a cada nível. 60 s, erro custa 3 s.

Links diretos para cada modo: `games/croma/?mode=memoria`, `?mode=diario`, `?mode=olho`.

Recordes ficam no `localStorage` do navegador.

## Rodar localmente

```bash
python3 -m http.server 8000
# abra http://localhost:8000
```

Para publicar, basta servir a pasta (ex.: GitHub Pages apontando para a raiz do branch).

## Adicionar um jogo

1. Crie a pasta `games/<id>/` com o `index.html` do jogo.
2. Adicione um objeto no array `GAMES` em `app.js` (`status: 'available'` ou `'soon'`).
3. Opcional: crie a arte do card em `style.css` (`.art-<id>`) e trate o `id` na função `art()`.
