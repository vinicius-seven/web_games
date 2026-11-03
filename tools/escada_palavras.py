# Gera games/escada/palavras.js: as palavras de 4 e 5 letras da Escada.
#
# Uso: python3 tools/escada_palavras.py <pt_br_50k.txt> <pt_BR.dic> games/prensa/palavras.js games/escada/palavras.js
#   pt_br_50k.txt: lista de frequência FrequencyWords (Hermit Dave, licença MIT)
#   pt_BR.dic: dicionário VERO do LibreOffice, usado só como filtro (nada dele é copiado para o jogo)
#   games/prensa/palavras.js: as listas do Prensa (respostas e palavras aceitas de 5 letras)
#   Requer o pacote wordfreq (para descartar palavras em inglês).
#
# VALIDAS: palavras que valem como degrau. COMUNS: palavras conhecidas, usadas como começo e fim da escada.
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import palavras_base as pb
from palavras_base import norm, known, valid, BLOCK, FOREIGN, EXTRA_OUT, read_freq
from wordfreq import zipf_frequency as zf

freq_path, dic_path, prensa_path, out_path = sys.argv[1:5]
pb.load_dic(dic_path)

# Palavras que valem como degrau, mas não servem bem de começo/fim (palavras de ligação, formas verbais etc.).
COMUNS4_FORA = set("""afro alfa anal ando cadê cocô dada dali dele dito eram esse este faço gajo hein isso isto mana mané mega nele
nerd ouço paro pela puto será terá teve toma tome você xixi falo cria cujo frei funk blog site cine quão qual quem para
afim amém saca gana mero algo aqui além bora ecrã bata caça doer""".split())

freq = read_freq(freq_path)

src = open(prensa_path, encoding='utf-8').read()
def js_list(name):
    m = re.search(name + r'\s*=\s*"([^"]*)"', src)
    return m.group(1).split() if m else []
PRENSA_R, PRENSA_A = js_list('RESPOSTAS'), js_list('ACEITAS')

out = {}
for L in (4, 5):
    best = {}  # forma sem acento → (frequência, forma com acento)
    for w, n in freq:
        if len(w) != L or w in BLOCK or w in FOREIGN or w in pb.NAMES or w in EXTRA_OUT:
            continue
        p, e = zf(w, 'pt'), zf(w, 'en')
        if p < 2.6 or e > p:
            continue
        if not valid(w):
            continue
        k = norm(w)
        if k not in best or best[k][0] < n:
            best[k] = (n, w)
    validas = {k: v[1] for k, v in best.items()}
    if L == 5:
        for w in PRENSA_A:
            validas.setdefault(norm(w), w)
    comuns = set()
    if L == 5:
        comuns = {norm(w) for w in PRENSA_R if w not in BLOCK}
    else:
        for k, w in validas.items():
            if zf(w, 'pt') >= 3.5 and known(w) and not w.endswith('s') and w not in BLOCK and w not in COMUNS4_FORA:
                comuns.add(k)
    comuns &= set(validas)
    out[L] = (sorted(validas.values(), key=norm), sorted(validas[k] for k in comuns))
    print(f'{L} letras: {len(validas)} válidas, {len(comuns)} comuns', file=sys.stderr)

with open(out_path, 'w', encoding='utf-8') as f:
    f.write('''/* Palavras da Escada, geradas por tools/escada_palavras.py.
   Base: lista de frequência FrequencyWords (licença MIT) conferida num dicionário de português,
   mais as listas do Prensa. VALIDAS: valem como degrau. COMUNS: começo e fim das escadas. */
(function (root) {
  'use strict';
  const D = {
''')
    for L in (4, 5):
        v, c = out[L]
        f.write(f'    {L}: {{\n      VALIDAS: "{" ".join(v)}",\n      COMUNS: "{" ".join(c)}",\n    }},\n')
    f.write('''  };
  if (typeof module !== 'undefined' && module.exports) module.exports = D;
  else root.EscadaPalavras = D;
})(typeof window !== 'undefined' ? window : globalThis);
''')
