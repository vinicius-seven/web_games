# Gera games/sopa/palavras.js: as palavras aceitas na Sopa Relâmpago (3 a 9 letras).
#
# Uso: python3 tools/sopa_palavras.py <pt_br_50k.txt> <pt_BR.dic> games/prensa/palavras.js games/sopa/palavras.js
#   Mesmas fontes da Escada (veja tools/palavras_base.py): FrequencyWords (MIT), dicionário VERO só como filtro,
#   wordfreq para descartar inglês, e a lista de palavras aceitas do Prensa.
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import palavras_base as pb
from palavras_base import norm, valid, BLOCK, FOREIGN, EXTRA_OUT, read_freq
from wordfreq import zipf_frequency as zf

freq_path, dic_path, prensa_path, out_path = sys.argv[1:5]
pb.load_dic(dic_path)

# Siglas, nomes, palavras estrangeiras e formas soltas que o filtro deixa passar (sobretudo com 3 letras).
FORA = set('''adi bia cee che csi del des emi eta eva evo gui han ias isa ita kms las les los mai moi mor mos mui noé qua
qui rai rue rui séc sia sor srs sta tai val vip web blá gnu goa jus lis mia oro upa vôo cia dum'''.split())

best = {}
for w, n in read_freq(freq_path):
    if not 3 <= len(w) <= 9 or w in FORA or w in BLOCK or w in FOREIGN or w in pb.NAMES or w in EXTRA_OUT:
        continue
    p, e = zf(w, 'pt'), zf(w, 'en')
    if p < (3.2 if len(w) == 3 else 2.7) or e > p:
        continue
    if not valid(w):
        continue
    k = norm(w)
    if k not in best or best[k][0] < n:
        best[k] = (n, w)
src = open(prensa_path, encoding='utf-8').read()
m = re.search(r'ACEITAS\s*=\s*"([^"]*)"', src)
for w in (m.group(1).split() if m else []):
    if w not in BLOCK and w not in FORA:
        best.setdefault(norm(w), (0, w))
words = sorted((v[1] for v in best.values()), key=lambda w: (len(w), norm(w)))
by = {}
for w in words:
    by[len(w)] = by.get(len(w), 0) + 1
print(len(words), 'palavras', by, file=sys.stderr)
with open(out_path, 'w', encoding='utf-8') as f:
    f.write('''/* Palavras da Sopa Relâmpago, geradas por tools/sopa_palavras.py.
   Base: lista de frequência FrequencyWords (licença MIT) conferida num dicionário de português,
   mais as palavras aceitas do Prensa. Com acento; o jogo compara sem acento. */
(function (root) {
  'use strict';
  const PALAVRAS = "''' + ' '.join(words) + '''";
  if (typeof module !== 'undefined' && module.exports) module.exports = PALAVRAS;
  else root.SopaPalavras = PALAVRAS;
})(typeof window !== 'undefined' ? window : globalThis);
''')
