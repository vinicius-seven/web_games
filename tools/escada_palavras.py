# Gera games/escada/palavras.js: as palavras de 4 e 5 letras da Escada.
#
# Uso: python3 tools/escada_palavras.py <pt_br_50k.txt> <pt_BR.dic> games/prensa/palavras.js games/escada/palavras.js
#   pt_br_50k.txt: lista de frequência FrequencyWords (Hermit Dave, licença MIT)
#   pt_BR.dic: dicionário VERO do LibreOffice, usado só como filtro (nada dele é copiado para o jogo)
#   games/prensa/palavras.js: as listas do Prensa (respostas e palavras aceitas de 5 letras)
#   Requer o pacote wordfreq (para descartar palavras em inglês).
#
# VALIDAS: palavras que valem como degrau. COMUNS: palavras conhecidas, usadas como começo e fim da escada.
import re, sys, unicodedata
from wordfreq import zipf_frequency as zf

freq_path, dic_path, prensa_path, out_path = sys.argv[1:5]

def norm(w):
    return ''.join(c for c in unicodedata.normalize('NFD', w) if unicodedata.category(c) != 'Mn')

stems, caps = set(), set()
for i, line in enumerate(open(dic_path, encoding='utf-8-sig')):
    if i == 0:
        continue
    w = line.strip().split('/')[0]
    if w:
        (caps if w[0].isupper() else stems).add(w.lower() if w[0].isupper() else w)
NAMES = caps - stems
STEMS_N = {norm(x) for x in stems}

VERB_END = {
  'ar': 'o as a amos ais am ei aste ou astes aram ava avas ávamos áveis avam ara aras áramos áreis aria arias aríamos aríeis ariam arei arás ará aremos areis arão e es emos eis em asse asses ássemos ásseis assem ar ares armos ardes arem ando ado ada ados adas',
  'er': 'o es e emos eis em i este eu estes eram ia ias íamos íeis iam era eras êramos êreis eria erias eríamos eríeis eriam erei erás erá eremos ereis erão a as amos ais am esse esses êssemos êsseis essem er eres ermos erdes erem endo ido ida idos idas',
  'ir': 'o es e imos is em i iste iu istes iram ia ias íamos íeis iam ira iras íramos íreis iria irias iríamos iríeis iriam irei irás irá iremos ireis irão a as amos ais am isse isses íssemos ísseis issem ir ires irmos irdes irem indo ido ida idos idas',
}
SPELL = [('qu', 'c'), ('gu', 'g'), ('c', 'ç'), ('ç', 'c'), ('j', 'g'), ('', '')]

def known(x):
    return norm(x) in STEMS_N

def valid(w):
    if known(w):
        return True
    if w.endswith('s') and known(w[:-1]):
        return True
    if w.endswith('es') and known(w[:-2]):
        return True
    for end, base in (('a', 'o'), ('as', 'o'), ('os', 'o')):
        if w.endswith(end) and len(w) > len(end) + 1 and known(w[:-len(end)] + base):
            return True
    for inf, ends in VERB_END.items():
        for e in ends.split():
            if not w.endswith(e) or len(w) - len(e) < 2:
                continue
            b = w[:-len(e)]
            for a, r in SPELL:
                if b.endswith(a) and known(b[:len(b) - len(a)] + r + inf):
                    return True
    return False

BLOCK = set("""merda porra bunda vadia foder bosta bicha putas puta pariu tesão cuzão cagar tetas viado chupa fuder fodeu
sêmen pênis pornô porno peido mijar fodam corno mijei negão putos cagou fodão mijou cagão fodem trepa vulva hímen peida
chupe chupo mijam cagam fodas bilau pinto piroca rola xoxota boceta otário otária babaca idiota imbecil cuzao
tesao pica cuzinho xota foda fode fodi rabo teta peru anus ânus cus porra""".split())
# Siglas, abreviações e palavras estrangeiras comuns em legendas.
FOREIGN = set("""okay yeah baby show wow hey love girl cool time like what just help dude lady home team club""".split())
# Nomes próprios e formas coloquiais que o filtro não pega.
EXTRA_OUT = set("""adão joão duda nuno luna mari mara manu lino tito nero nilo noel olga sara lulu nana mimi bibi dino inca maia
mali buda yang oque tava tô pra pro pras pros vô vó cê né dudu juju lulu nini zeca zezé gaga""".split())
# Palavras que valem como degrau, mas não servem bem de começo/fim (palavras de ligação, formas verbais etc.).
COMUNS4_FORA = set("""afro alfa anal ando cadê cocô dada dali dele dito eram esse este faço gajo hein isso isto mana mané mega nele
nerd ouço paro pela puto será terá teve toma tome você xixi falo cria cujo frei funk blog site cine quão qual quem para
afim amém saca gana mero algo aqui além bora ecrã bata caça doer""".split())

freq = []
for line in open(freq_path, encoding='utf-8'):
    parts = line.split()
    if len(parts) != 2:
        continue
    w, n = parts[0], int(parts[1])
    if not re.fullmatch(r"[a-záàâãéêíóôõúüç]+", w):
        continue
    freq.append((w, n))

src = open(prensa_path, encoding='utf-8').read()
def js_list(name):
    m = re.search(name + r'\s*=\s*"([^"]*)"', src)
    return m.group(1).split() if m else []
PRENSA_R, PRENSA_A = js_list('RESPOSTAS'), js_list('ACEITAS')

out = {}
for L in (4, 5):
    best = {}  # forma sem acento → (frequência, forma com acento)
    for w, n in freq:
        if len(w) != L or w in BLOCK or w in FOREIGN or w in NAMES or w in EXTRA_OUT:
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
