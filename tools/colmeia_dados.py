# Gera games/palavradodia/colmeia-dados.js: o dicionário e a lista de colmeias da Colmeia.
#
# Uso: python3 tools/colmeia_dados.py <pt_br_50k.txt> <pt_BR.dic> games/palavradodia/colmeia-dados.js
#   pt_br_50k.txt: lista de frequência FrequencyWords (Hermit Dave, licença MIT)
#     https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/pt_br/pt_br_50k.txt
#   pt_BR.dic: dicionário VERO do LibreOffice, usado só como filtro (nomes próprios têm inicial maiúscula);
#     nada dele é copiado para o jogo.
#     https://raw.githubusercontent.com/LibreOffice/dictionaries/master/pt_BR/pt_BR.dic
#   Requer o pacote wordfreq (para descartar palavras em inglês).
import json, re, sys, unicodedata
from wordfreq import zipf_frequency as zf

freq_path, dic_path, out_path = sys.argv[1:4]

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

# Terminações regulares de verbos (-ar, -er, -ir) para reconhecer conjugações a partir do infinitivo.
VERB_END = {
  'ar': 'o as a amos ais am ei aste ou astes aram ava avas ávamos áveis avam ara aras áramos áreis aria arias aríamos aríeis ariam arei arás ará aremos areis arão e es emos eis em asse asses ássemos ásseis assem ar ares armos ardes arem ando ado ada ados adas',
  'er': 'o es e emos eis em i este eu estes eram ia ias íamos íeis iam era eras êramos êreis eria erias eríamos eríeis eriam erei erás erá eremos ereis erão a as amos ais am esse esses êssemos êsseis essem er eres ermos erdes erem endo ido ida idos idas',
  'ir': 'o es e imos is em i iste iu istes iram ia ias íamos íeis iam ira iras íramos íreis iria irias iríamos iríeis iriam irei irás irá iremos ireis irão a as amos ais am isse isses íssemos ísseis issem ir ires irmos irdes irem indo ido ida idos idas',
}
SPELL = [('qu', 'c'), ('gu', 'g'), ('c', 'ç'), ('ç', 'c'), ('j', 'g'), ('', '')]

def known(x):
    return norm(x) in STEMS_N

def valid(w):
    # Confirma a palavra pelo dicionário: radical, feminino, diminutivo/aumentativo, advérbio ou conjugação regular.
    if known(w):
        return True
    for end, base in (('a', 'o'), ('inho', 'o'), ('inha', 'a'), ('zinho', ''), ('zinha', ''), ('ão', 'o'), ('ona', 'o'),
                      ('íssimo', 'o'), ('íssima', 'o'), ('mente', ''), ('eira', 'a'), ('eiro', 'o'), ('ada', 'a'), ('inho', 'a')):
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
chupe chupo mijam cagam fodas bilau caralho buceta pinto piroca rola xoxota boceta otário otária babaca idiota imbecil
retardado retardada vagabunda vagabundo prostituta bichinha viadinho piranha safada safado cretino cretina""".split())

# Formas irregulares dos verbos mais comuns (o dicionário só traz o infinitivo).
IRREG = set('''sou era eram fomos foram fora seja sejam será serão seria seriam sendo sido vamos irei irá iremos irão
tenho temos tinha tinham tive teve tivemos tiveram tenha tenham terá teria tido tendo estou está estamos estão estava
estavam estive esteve estiveram esteja estará estaria faço fazemos fazem fizemos fizeram fazia faça farei fará faria feito
digo dizemos dizem disse disseram dizia diga direi dirá diria dito posso pode podemos podem pude pôde puderam podia possa
poderá poderia quero quer queremos querem quis quiseram queria queira sabe sabemos sabem soube souberam sabia saiba trago
traz trouxe trouxeram traga trará vejo vemos veem viram veja verá visto venho vimos vêm veio vieram vinha venha virá vindo
ponho põem puseram punha ponha posto damos deram dava dará daria dado houve havia haja haverá'''.split())

# Nomes e lugares que o dicionário também traz em minúscula (revisados à mão).
NAMES |= set('''aida antonio antonia cecília chile cicero cleo dina emilio equador frança guiné ícaro irlanda jamaica jane japão
java jerônimo lucia macau mali nadia nepal nico panamá patrícia polónia ruanda turquia urano vaticano angola carmine édipo
duda nando tito lino lina lili lala babi nani nilo tião alicia luca buda papua lipo bali cali anna alana lana luana luna
manolo manu molina nuno barbara aragão argo gore lila poli tina nina nino nana pipi átila italo adão eva caio otto ana
bia beto tati dani rafa juca zeca chico lula dida dodô dudu léo leo nena nico pepe pepa rita rosana mara marta mário
lúcia lucas paula paulo pedro joão josé maria maria carla carlo carol clara diana dora edu elena eliana elena érica
fabio fábio gabi gina hugo inês irene ivan jaime joana julia júlia julio júlio karen laura lia lídia lorena lúcio
luana mariana marina mateus mila milena nádia natália nelson nicole noemi norma olga otávio patrícia raquel regina
renata ricardo rita roberto rodrigo romeu rosa rui sara silvia sílvia simone sofia tânia tereza teresa tomé valéria
vera vicente vitor vitória wagner zé zelda omaha tate milo melo leto emílio chaco'''.split()) - {'rosa', 'clara', 'vera', 'norma', 'dora', 'mara', 'vitória', 'regina', 'graça'}

ok = re.compile(r'^[a-záâãéêíóôõúç]+$')
MIN_ZIPF = 2.9
words = {}
for line in open(freq_path, encoding='utf-8'):
    w, _ = line.split()
    if len(w) < 4 or not ok.match(w) or any(c in w for c in 'kwy') or w in NAMES or w in BLOCK:
        continue
    pt, en = zf(w, 'pt'), zf(w, 'en')
    if en > pt + 0.8 or pt < MIN_ZIPF:
        continue
    # Toda palavra precisa ser confirmada pelo dicionário (ou ser forma irregular de verbo comum).
    if w not in IRREG and not valid(w):
        continue
    n = norm(w)
    # Colmeias nunca têm S (evita listas cheias de plurais); palavras com mais de 7 letras diferentes nunca valem.
    if 's' in n or len(set(n)) > 7 or n in words:
        continue
    words[n] = w

# Colmeias: letras de uma palavra comum com 7 letras diferentes; a letra central deixa entre 25 e 60 palavras.
puzzles = []
for n, w in words.items():
    if len(set(n)) != 7 or zf(w, 'pt') < 3.4:
        continue
    L = set(n)
    for c in sorted(L):
        cnt = sum(1 for m in words if c in m and set(m) <= L)
        if 25 <= cnt <= 60:
            puzzles.append(''.join(sorted(L)) + c)
puzzles = sorted(set(puzzles))
print('dicionário:', len(words), '| colmeias:', len(puzzles), file=sys.stderr)

with open(out_path, 'w', encoding='utf-8') as f:
    f.write('/* Dados da Colmeia (Palavra do Dia), gerados por tools/colmeia_dados.py.\n')
    f.write('   PALAVRAS: palavras válidas (4+ letras, sem S, até 7 letras diferentes), com acento.\n')
    f.write('   COLMEIAS: 7 letras em ordem + a letra central. */\n')
    f.write('(function (root) {\n  \'use strict\';\n')
    f.write('  const PALAVRAS = ' + json.dumps(' '.join(sorted(words.values(), key=norm)), ensure_ascii=False) + '.split(\' \');\n')
    f.write('  const COLMEIAS = ' + json.dumps(' '.join(puzzles)) + '.split(\' \');\n')
    f.write("  const api = { PALAVRAS, COLMEIAS };\n")
    f.write("  if (typeof module !== 'undefined' && module.exports) module.exports = api;\n  else root.ColmeiaDados = api;\n")
    f.write("})(typeof window !== 'undefined' ? window : globalThis);\n")
