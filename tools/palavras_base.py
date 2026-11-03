# Base comum das listas de palavras da Jogateca (Escada, Sopa Relâmpago...).
#   - lista de frequência FrequencyWords (Hermit Dave, licença MIT)
#   - dicionário VERO do LibreOffice (pt_BR.dic), usado só como filtro: nada dele é copiado para os jogos
#   - pacote wordfreq, para descartar palavras em inglês
import re, unicodedata

NAMES, STEMS_N = set(), set()

def norm(w):
    return ''.join(c for c in unicodedata.normalize('NFD', w) if unicodedata.category(c) != 'Mn')

def load_dic(dic_path):
    global NAMES, STEMS_N
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

def read_freq(freq_path):
    out = []
    for line in open(freq_path, encoding='utf-8'):
        parts = line.split()
        if len(parts) != 2:
            continue
        w, n = parts[0], int(parts[1])
        if re.fullmatch(r"[a-záàâãéêíóôõúüç]+", w):
            out.append((w, n))
    return out
