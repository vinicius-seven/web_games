# Gera os dados do modo Proximidade (Palavra do Dia): vocabulário e, para cada palavra secreta,
# a ordem de todas as palavras do vocabulário da mais próxima à mais distante em sentido.
#
# Uso: python3 tools/proximidade_dados.py <pasta_de_trabalho> games/palavradodia/proximidade
#   A pasta de trabalho precisa ter:
#   - vectors.npy, key2row.msgpack, strings.json: os vetores de palavras do modelo pt_core_news_lg 3.7.0
#     do spaCy (fastText cbow treinado em OSCAR Common Crawl + Wikipédia; licença CC BY-SA 4.0),
#     extraídos do arquivo .whl (é um zip) da pasta pt_core_news_lg-3.7.0/vocab/. Nenhum código do pacote é executado.
#     https://github.com/explosion/spacy-models/releases/tag/pt_core_news_lg-3.7.0
#   - pt_br_50k.txt: lista de frequência FrequencyWords (Hermit Dave, licença MIT)
#   - pt_BR.dic: dicionário VERO do LibreOffice (só como filtro: radicais e nomes próprios)
#   Requer numpy, msgpack e wordfreq.
import base64, json, os, re, sys, unicodedata
import msgpack
import numpy as np
from wordfreq import zipf_frequency as zf

work, out_dir = sys.argv[1:3]
P = lambda name: os.path.join(work, name)

def norm(w):
    return ''.join(c for c in unicodedata.normalize('NFD', w) if unicodedata.category(c) != 'Mn')

def murmur64a(data, seed=1):
    # MurmurHash64A: é como o spaCy transforma cada palavra na chave da tabela de vetores.
    m, r, M = 0xc6a4a7935bd1e995, 47, (1 << 64) - 1
    h = (seed ^ (len(data) * m)) & M
    n = len(data) // 8
    for i in range(n):
        k = int.from_bytes(data[i * 8:i * 8 + 8], 'little')
        k = (k * m) & M; k ^= k >> r; k = (k * m) & M
        h ^= k; h = (h * m) & M
    rem = len(data) & 7
    if rem:
        tail = data[n * 8:]
        for i in range(rem - 1, -1, -1):
            h ^= tail[i] << (8 * i)
        h = (h * m) & M
    h ^= h >> r; h = (h * m) & M; h ^= h >> r
    return h

stems, caps = set(), set()
for i, line in enumerate(open(P('pt_BR.dic'), encoding='utf-8-sig')):
    if i == 0:
        continue
    w = line.strip().split('/')[0]
    if w:
        (caps if w[0].isupper() else stems).add(w.lower() if w[0].isupper() else w)
names = caps - stems
STEMS_N = {norm(x) for x in stems}

# O dicionário guarda muitos substantivos só como forma de verbo (casa ← casar, livro ← livrar).
# Aceita a palavra se for forma regular de um verbo do dicionário e não parecer conjugação ou plural.
VERB_END = {'ar': 'o a e', 'er': 'o a e', 'ir': 'o a e'}
SPELL = [('qu', 'c'), ('gu', 'g'), ('c', 'ç'), ('ç', 'c'), ('j', 'g'), ('', '')]
CONJ = ('ava', 'avam', 'iam', 'ara', 'asse', 'esse', 'isse', 'ando', 'endo', 'indo', 'ou', 'eu', 'iu', 'am', 'em',
        'ei', 'mos', 'ste', 'aria', 'eria', 'iria', 'arei', 'erei', 'irei', 's')

def from_verb(w):
    if w.endswith(CONJ):
        return False
    for inf, ends in VERB_END.items():
        for e in ends.split():
            if w.endswith(e) and len(w) - len(e) >= 2:
                b = w[:-len(e)]
                for a, r in SPELL:
                    if b.endswith(a) and norm(b[:len(b) - len(a)] + r + inf) in STEMS_N:
                        return True
    return False
BLOCK = set("""merda porra bunda vadia foder bosta bicha puta pariu tesão cuzão cagar teta viado chupar fuder sêmen pênis pornô
porno peido mijar corno negão trepar vulva hímen caralho buceta pinto piroca rola xoxota boceta otário babaca idiota imbecil
retardado vagabundo prostituta piranha safado cretino""".split())

SECRETS = """casa gato cachorro praia música fogo árvore livro escola cidade carro chuva lua estrela mar rio montanha flor café
pão queijo chocolate futebol bola janela porta cama cadeira mesa telefone computador avião navio trem bicicleta hospital
médico professor dinheiro banco mercado festa aniversário natal carnaval samba praça igreja jardim floresta deserto neve
inverno verão outono primavera vento nuvem trovão relógio amor amizade família mãe pai irmão criança bebê cozinha banheiro
quarto chave espelho roupa sapato camisa chapéu anel ouro prata ferro pedra areia vidro papel caneta lápis carta jornal
revista filme cinema teatro piano violão guitarra tambor dança pintura museu câmera viagem mala hotel estrada ponte túnel
castelo rei rainha príncipe guerra soldado polícia ladrão prisão juiz governo notícia história ciência planeta foguete
robô máquina motor energia luz sombra noite manhã sono sonho medo alegria tristeza saudade coração sangue osso mão olho
boca dente cabelo doença remédio vacina fome água leite vinho cerveja suco arroz feijão carne peixe frango ovo fruta banana
maçã laranja uva limão tomate batata cebola sal açúcar mel abelha formiga borboleta aranha cobra leão tigre elefante macaco
cavalo vaca porco galinha pato coelho rato baleia tubarão golfinho pássaro águia coruja planta semente folha fazenda
chuveiro sabonete toalha travesseiro cobertor lâmpada vela tesoura faca garfo colher prato copo panela fogão geladeira
televisão rádio internet jogo brinquedo boneca balão presente segredo tesouro mapa ilha pirata barco oceano vulcão
tempestade relâmpago gelo fumaça bandeira coroa espada escudo dragão fantasma bruxa mágica circo palhaço""".split()
FOREIGN = set('''jack charlie frank ben mary steve harry sarah danny jimmy bob bill nick tony billy richard tommy johnny ray jake amy
eddie robert ryan lee martin matt eric brian rachel dan kelly scott anna larry lisa jeff kate jerry josh emily andy dave grace luke
carter lucy roger carl leo gary clark ted phil sean kim elizabeth amanda fred karen julie chuck barry rick julia stan greg patrick
howard johnson dean tyler park brown gordon mac terry michelle rebecca anne andrew dylan jordan nathan jay parker justin roy vincent
charlotte cooper miller steven beth angela harvey keith ian jessica brad sophie grant wayne joseph ethan dick stephen russell martha
ann nelson matthew ellen ron jonathan margaret spencer logan ken aaron lauren hill elena walker rob mickey ruth harold janet craig
raymond victoria neil lincoln carla joan stanley warren maya sandy rita monica noah leonard murphy walt felix juan philip chase
hunter christopher kent junior christian andrea cameron allen donald sebastian kurt wallace leon virginia seattle houston duke
lawrence antonio teresa sandra khan harrison bell indiana perry drake veronica jon claudia carmen austin hanna erik stefan roman
grey bush moore marc jefferson joyce gray georgia colorado atlanta bella chen saint tour carolina jin schmidt wesley wolf google
barbie potter cristina obama sky julio bianca yuri apple bin dragon milton villa disney ingrid columbia email con netflix trump
knight jose lula plaza swift gaga mariana catarina elisa sergio fabio mtv beyoncé teen patrícia rey daniela skype galaxy iphone
tag grammy sena renata claudio renato cecília juliana xbox mail hashtag tweet vieira feedback gabriela guerrero sony lorena sur
amazon silvio brasília fernanda luana pereira podcast mauricio microsoft sport garcía pokémon workshop institute prof mello luiza
mineira fifa ferreira paulinho pra der est dra sra rap hip hop app post laura isabella adriana joana mônica júlia cláudia rui tel grã duma direcção acção acto projecto protecção actividade directo connosco'''.split())

k2r = msgpack.unpackb(open(P('key2row.msgpack'), 'rb').read(), strict_map_key=False)
V = np.load(P('vectors.npy'), mmap_mode='r')

def vec(w):
    row = k2r.get(murmur64a(w.encode('utf-8')))
    return None if row is None else np.asarray(V[row], dtype=np.float32)

# Vocabulário: palavras-base (radicais do dicionário) frequentes, sem nomes, inglês ou palavrões.
ok = re.compile(r'^[a-záâãéêíóôõúç]+$')
vocab, vecs, seen = [], [], set()
for line in open(P('pt_br_50k.txt'), encoding='utf-8'):
    w = line.split()[0]
    if len(w) < 3 or not ok.match(w) or w in names or w in BLOCK:
        continue
    # Palavras comuns que o dicionário não traz como radical (mesa, rio, computador) entram por frequência,
    # se não forem palavra gramatical, conjugação, particípio, nome estrangeiro ou mais comuns em inglês.
    zp = zf(w, 'pt')
    by_freq = (3.8 <= zp < 5.0 and zf(w, 'en') < zp and not w.endswith(CONJ + ('ado', 'ido', 'ada', 'ida', 'mente'))
               and w not in FOREIGN)
    if not (w in stems or from_verb(w) or by_freq or w in SECRETS):
        continue
    pt, en = zf(w, 'pt'), zf(w, 'en')
    if en > pt + 0.8 or pt < 2.3:
        continue
    n = norm(w)
    if n in seen:
        continue
    v = vec(w)
    if v is None or not np.any(v):
        continue
    seen.add(n)
    vocab.append(w)
    vecs.append(v / np.linalg.norm(v))
# Tira plurais de palavras que já estão no vocabulário (tesouros → tesouro, canções → canção).
present = {norm(w) for w in vocab}
def plural_of_present(w):
    n = norm(w)
    for end, by in (('oes', 'ao'), ('aes', 'ao'), ('ais', 'al'), ('eis', 'el'), ('res', 'r'), ('zes', 'z'), ('ns', 'm'), ('s', '')):
        if n.endswith(end) and n[:-len(end)] + by in present:
            return True
    return False
keep = [i for i, w in enumerate(vocab) if not plural_of_present(w)]
vocab = [vocab[i] for i in keep]
vecs = [vecs[i] for i in keep]
X = np.stack(vecs)
index = {w: i for i, w in enumerate(vocab)}
assert len(vocab) < 65536


secrets = [w for w in SECRETS if w in index]
missing = [w for w in SECRETS if w not in index]

os.makedirs(os.path.join(out_dir, 'r'), exist_ok=True)
for k, w in enumerate(secrets):
    sims = X @ X[index[w]]
    order = np.argsort(-sims, kind='stable').astype('<u2')
    assert vocab[order[0]] == w
    open(os.path.join(out_dir, 'r', f'{k:03d}.txt'), 'w').write(base64.b64encode(order.tobytes()).decode())

with open(os.path.join(out_dir, 'vocab.js'), 'w', encoding='utf-8') as f:
    f.write('/* Vocabulário do modo Proximidade, gerado por tools/proximidade_dados.py.\n')
    f.write('   Distâncias calculadas com vetores fastText (OSCAR + Wikipédia) do modelo pt_core_news_lg do spaCy,\n')
    f.write('   licença CC BY-SA 4.0. Os arquivos r/NNN.txt (mesma licença) guardam, para a palavra secreta NNN,\n')
    f.write('   a ordem do vocabulário da mais próxima à mais distante (índices Uint16 em base64). */\n')
    f.write('(function (root) {\n  \'use strict\';\n')
    f.write('  const PALAVRAS = ' + json.dumps(' '.join(vocab), ensure_ascii=False) + '.split(\' \');\n')
    f.write('  const SECRETAS = ' + str(len(secrets)) + ';\n')
    f.write("  const api = { PALAVRAS, SECRETAS };\n")
    f.write("  if (typeof module !== 'undefined' && module.exports) module.exports = api;\n  else root.ProximidadeVocab = api;\n")
    f.write("})(typeof window !== 'undefined' ? window : globalThis);\n")
print('vocabulário:', len(vocab), '| secretas:', len(secrets), '| fora do vocabulário:', missing, file=sys.stderr)
