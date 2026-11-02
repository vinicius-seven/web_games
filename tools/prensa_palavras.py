# Uso: python3 tools/prensa_palavras.py games/prensa/palavras.js
# Monta a lista de palavras do Prensa: respostas (palavras comuns, sem plurais nem conjugações)
# e palavras aceitas como tentativa (respostas + plurais, conjugações e outras palavras válidas).
import json, sys, unicodedata

ANSWERS = """
abade abrir acaso aceno achar ácido adega adeus aéreo afeto agora agudo águia ainda alado álamo alçar algoz aliás altar
amado amigo amora amplo andar anexo ânimo antes anual anzol apelo apito apoio aquém arado arame ardor árduo areia arena
aroma arroz assar astro atlas atrás atual audaz áudio autor aveia avião aviso axila azedo
baile bagre baixo balde balsa bambu banco banda banho barba barco barra barro bater beber beijo berço bicho bispo bolha
bolsa bomba bonde borda bossa botão braço bravo brejo breve briga brisa broto bruma bruxa burro busca
cabra caçar cacau cacto caixa calar calda caldo calma calmo campo canal canoa canto capaz capim caqui carga carne carpa
carro carta casal casar casca catar causa cavar cedro censo cerca certo cervo cesta chato chave chefe cheio choro chuva
ciclo cifra cinco cinto cisne ciúme civil claro clima cloro cobra cofre coisa colar comer conde conto cópia coral corda
corpo corte cosmo couro couve cravo credo creme crepe criar crime crise cruel culpa cupim curar curso curto curva custo
dança dardo dedal delta denso dente depor desde deter deusa dever diabo dieta digno disco ditar dizer dobra dogma dólar
domar dorso drama droga duelo dueto duplo durar dúzia
ébano elite enfim enjoo então entre envio época ereto errar esqui estar etapa etnia exame exato êxito expor extra
facão fácil falar falso falta farol farsa fatal fatia fauna favor fazer febre feira feito feixe feliz fenda feroz festa
fibra ficar filha filho filme final firma firme fisco fixar flora fluir fluxo focar fogão folga folha fonte força forma
forno forte fosso fraco frase frevo frito fruta fugir fundo fungo furar fusão fútil
gaita galho ganso garfo garra gelar gemer gênio gente gesto girar globo golpe gordo gorro gosto gozar grade grama grato
grave graxa grego grilo gripe grito grupo gruta guiar guizo
hábil haste hiato hiena hífen homem honra horta hotel humor
ícone idade ideia idoso igual ímpar imune inato irmão
jaula janta jeito jogar jovem juízo julho junho junto jurar justo
lábio lacre lagoa laico lança lápis larva laudo lavar legal leite leito lenço lento leque lesma letra levar libra lidar
limão limbo limpo lindo linha lírio livre livro local lombo longe lótus louco lousa lucro lugar lunar
macio magia magma magro maior malha manga manhã manso manto marca março massa matar medir melão menor menta mente
mesmo metal metro mexer milho mirar misto moeda moita molde molho monge monte moral morar morno morro morte mosca motor
móvel mover mudar muito multa mundo mural museu
nação nadar nariz nasal natal negar nervo nevar ninho nível nobre noite noiva norma norte notar nuvem
obter oeste olhar ombro opaco opção ópera órfão órgão ostra ouvir oxalá
pacto padre pagar palco palha palma papel parar pardo parte passo pasta pátio pausa pavão pavio pecar pedal pedir pedra
peito peixe penal pente perda perto pesar pesca peste piada piano pilha pinho pisar pista placa plano pleno pluma poder
poema poeta polvo pomar ponte ponto porco porta porto posse posto pouco pouso prado prata prato prazo prece preço presa
preso preto prova pular pulso punho puxar
quase queda quilo quina quota
radar raiva ralar rampa rapaz rasgo razão regra reino remar renda resto reter rever rezar rigor risco ritmo rival rocha
rodar rolha rosto roubo roupa rubro rugir ruído ruína rumor rural
sábio sabor sacar safra salão salsa salto salva samba sauna saúde secar seita selar selva senha senso serra servo setor
sexta sexto sigla signo sinal sítio sobra sócio solar soldo somar sonho sopro sorte suave subir sueco sujar sumir surdo
surfe susto
tábua tacho talão talco talho tampa tanga tarde tecer tecla tédio tempo tenda tenor tenso terço terra teste texto tigre
tinta tirar tocar tomar tonto topar torre torta total touro traço traje trama trapo trava trevo tribo trigo trono tropa
trufa tumba turma turno turvo
úmido único união urubu usado usina útero
vagão vagar valer valor vapor varal vazio velho veloz venda vento verão verbo verde vespa vetor vidro vigor vilão vinho
viola vírus visão visor vista vital viúva viver vogal volta votar vulto
xampu xeque zebra zelar zinco zumbi
"""

# Outras palavras aceitas como tentativa: plurais, conjugações e palavras menos comuns.
EXTRA = """
abriu achou acima afins agiam agimos alvos almas altas altos amava amigas amigos andou anjos aonde apoia apesar armas
asas? aulas aves? avelã
bebeu belas belos bolas botas brava bravo cabos cacos calos camas canos capas casas cenas cegos certa chegou cheia
claras copos coxas cozer cunha
dados dando danos dedos deram devem devia dicas disse dizem dizia dunas
estas estes estou estão eram? estar
falam falas falei falou farão fatos fazem fazia fazes ficam ficou filas fitas focos fomos fosse fotos
gatos gotas gosta gostar? grãos
haver hinos horas houve
ilhas
jogos jogou joias
lados lagos latas leões lemos levou ligas linda lindas lobos logos lojas luvas
mapas matas meios minas modos moças mudou
nabos naves nesta neste nossa nosso notas novas novos
olhou olhos ondas ossos outra outro ouviu
patos pegou penas pesos pilar podem podia posso ponha povos
quero
ramos ratos redes remos ricos rimas rodas rotas rosas
sabem sabia salas sapos sejam sendo seres sinos somos sucos
tantas tanto temos tendo tenho termo times tinha tipos tocou todas todos tomou trens tubos
unhas ursos usava uvas?
vacas vamos vasos vemos vendo venho vimos vinha viveu vozes
zonas
algas alhos anéis anões ataca atlas avôs?
baías balas bares beira bento bijus? bodas bolos bombo bosta? brado bravas
cacho caiar? calos capas carão caros casco catre caule cerne chapa chega cheia chita chuta cinza circo civis clara clone
cocar coche coice colmo combo conga copas corja corso coser cotas coxão crase cravo crina croma cubos cueca
dados dalai? dedão delas deles dezes? dobro dores
ecoar eleva elmos emite ergue errou escoa estas etnia exala
fadas falha farpa fases fecho feios ferro fiado fiapo fivela? fizer focar fogos folia fonte fossa frade freio freis frota furão fuzil
gabar galos galão gamba ganha garoa gasto gemas gerar gibis girou globo gomos graça grelo grama graúdo? gueto
hiena
imita isola
jarra jarro jatos jirau? jogue
laços lages? laico lamas lapso laranjas? lasca lauda lazer leigo lerdo lesão leves lidas lince liras lista litro lixar lojas lombo lorde lotes
maços maçã? madre males manco mania mares matiz medos menos mesas metas mimos minar miolo mocho modas moldo momos? morna moscas? mudas
nadou nasce nascer? natas navio negro nenês? ninfa nódoa notou nunca
obras odiar ognes? ombro ontem orgia órfãs ossos ousar ovino
pacas palpo panos parda pares parou passa pavor peixes? pelos penca perna pesam pires plebe pobre pomba porém posar praia prima primo pudim pulga puros
quais quina
rache? raiar ralos rampa rasos rasto rater? reagir? recua redor regar relva remos renal rente repor retos rimas rindo risos rolar rosca ruela rugas rumos
sacos saias salgar? salmo sapos sarar sarna secas sedas seios selos senão sinto sirva sobre socar sofás solos sondar? sopas sorri suado subiu sucos sumiu suíno
tabus tacos talas taxas tchau temer temas tenha terei? tetos tiara tinto tiros tocha tolos tombo tosse traga treme trens trote tutor
ultra urnas usada usado usual
valsa vários? vazia velas venha verba verso vezes vigas vilas vinil vírus? visto viver vovós? vozes
zarpa zelos zerar zorro
"""


# ---------- Formas geradas por regra (só as que não mudam de grafia) ----------
NOUNS4 = """casa gato bola vaca pato peso sapo rato lobo mesa faca foto mapa copo dado nabo rabo ramo remo sino tubo urso cena
rede rima rota onda olho osso ilha hino hora joia lado lago lata loja luva meio mina modo moça mola nota nave obra pena pele
pipa pote roda rosa sala seda selo sopa suco taça tela teto tipo tiro toco vaso vela vila voto bota cabo caco cama cano capa
cela cera copa cova cubo dama data dica duna fada fase fato figo fila fita foca foco fogo gema gola gota jogo lama lixo lona
lote maço mala mato medo mito moda mula muro neto nome nora pano pera pomo raio reta rodo rumo saco saia sola soma taco
tema toga trio vale zero aula alma arma asno bico boca bode bolo cara caso chão coxa dedo dono dose erva fumo gelo
gesto? gibi juta lema limo lírio? luta mãe? mano meta mimo mira moeda? moto muda ninho? orla ovni? papa pata pauta? peça
pico pilão? pino poço polo pombo? porta? rato rede rito saga sede sela seta sino soco sono taxa teia time tomo trem? tuba
uva? vaga veia vespa? vinha? vulto? zona"""
ADJ4 = """alto belo bobo caro cego duro fino frio gago mole novo puro raro rico seco sujo todo tolo vago feio leve doce? bela? cada?
nulo nu? nato chão? rude sábia? rosa? vivo"""
ADJ5 = """amado agudo alado amplo árduo baixo bravo calmo certo cheio chato claro curto denso digno duplo exato falso fraco frito
gordo grato justo largo leigo lento limpo lindo louco macio magro manso morno opaco pardo pleno preto preso rubro surdo tenso
tonto turvo úmido único usado velho vazio idoso aéreo atento? gélido? morto rouco solto torto tosco"""
VERBS_AR5 = """achar andar assar atuar calar casar catar cavar criar curar domar durar errar falar fixar focar gelar girar guiar jurar
lavar levar lidar mirar morar mudar nadar negar nevar notar olhar parar pesar pisar pular puxar ralar remar rezar rodar selar
somar sujar tirar tomar topar votar zelar amar? usar? gerar orar? ousar armar ditar afiar? fiar? colar soar? suar? salvar? ralar
lutar matar mimar minar podar posar rasgar? sarar socar? tapar vaiar? vedar velar virar zerar"""
VERBS_ER5 = """bater beber comer dever gemer mexer mover morder? temer varrer? viver? correr? sorver?"""
VERBS_IR5 = """abrir fugir? rugir? sumir subir unir? ruir? curtir? sorrir? partir? polir? zunir"""
VERBS_AR6 = """cantar contar chorar gastar pensar cortar cuidar deixar entrar gostar juntar limpar montar passar pintar provar sonhar
tentar tratar voltar chamar ganhar ajudar beijar cansar celar? copiar? damar? enviar? esperar? formar fundar? gravar? jantar
lançar? marcar? mostrar? ocupar pescar? postar? quebrar? reinar? saltar sentar soltar? tardar? testar? tostar trocar? voltar
adorar alugar? apoiar? atirar? bordar brotar cobrar? colher? copiar? cravar? culpar dançar? doutar? dourar fechar? firmar
furtar? grudar? inchar? jurar? lavrar mandar? mamar? nomear? orçar? pautar? prezar? pintar? rondar sondar? suprir? tornar
virar? xingar?"""
VERBS_ER6 = """vender correr morrer varrer tremer sofrer romper? vencer? bebers? colher? sorver? torcer? descer?"""
VERBS_IR6 = """partir assistir? cumprir? dividir? existir? insistir? permitir? unir? sumir? curtir"""

def words(block):
    return [w for w in block.split() if not w.endswith('?')]

gen_out = []
for w in words(NOUNS4) + words(ADJ4):
    gen_out.append(w + 's')
for w in words(ADJ5):
    if w.endswith('o'):
        gen_out.append(w[:-1] + 'a')
for v in words(VERBS_AR5):
    st = v[:-2]
    gen_out += [st + 'as', st + 'am', st + 'ei', st + 'ou', st + 'em', st + 'es']
    if v.endswith(('car', 'gar', 'çar')):
        gen_out = [x for x in gen_out if not (x.startswith(st) and x[len(st):] in ('ei', 'em', 'es'))]
for v in words(VERBS_ER5):
    st = v[:-2]
    gen_out += [st + 'es', st + 'em', st + 'eu', st + 'ia', st + 'as', st + 'am']
for v in words(VERBS_IR5):
    st = v[:-2]
    gen_out += [st + 'es', st + 'em', st + 'iu', st + 'ia']
for v in words(VERBS_AR6):
    st = v[:-2]
    gen_out += [st + 'o', st + 'a']
    if not v.endswith(('car', 'gar', 'çar')):
        gen_out.append(st + 'e')
for v in words(VERBS_ER6):
    st = v[:-2]
    gen_out += [st + 'o', st + 'a', st + 'e']
for v in words(VERBS_IR6):
    st = v[:-2]
    gen_out += [st + 'o', st + 'a', st + 'e']
GENERATED = ' '.join(gen_out)

def norm(w):
    w = w.lower()
    nfd = unicodedata.normalize('NFD', w)
    return ''.join(ch for ch in nfd if unicodedata.category(ch) != 'Mn')

def parse(block):
    out = []
    for tok in block.split():
        if tok.endswith('?'):
            continue  # marcados com ? ficam de fora (duvidosos ou com tamanho errado)
        out.append(tok)
    return out

answers, problems = [], []
seen = {}
for w in parse(ANSWERS):
    n = norm(w)
    if len(n) != 5 or not n.isalpha() or not n.isascii():
        problems.append(('resposta', w)); continue
    if n in seen:
        problems.append(('resposta duplicada', w)); continue
    seen[n] = w
    answers.append(w)

valid = dict(seen)
for w in parse(EXTRA) + GENERATED.split() + [v for b in (VERBS_AR6, VERBS_ER6, VERBS_IR6) for v in words(b)]:
    n = norm(w)
    if len(n) != 5 or not n.isalpha() or not n.isascii():
        problems.append(('extra', w)); continue
    if n not in valid:
        valid[n] = w

print('respostas:', len(answers), '| aceitas:', len(valid), file=sys.stderr)
for p in problems:
    print('  descartada:', p, file=sys.stderr)

out = sys.argv[1]
with open(out, 'w', encoding='utf-8') as f:
    f.write('/* Lista de palavras do Prensa, montada para a Jogateca.\n')
    f.write('   RESPOSTAS: palavras comuns (sem plurais nem conjugações), com acento.\n')
    f.write('   ACEITAS: todas as palavras que valem como tentativa (inclui as respostas). */\n')
    f.write('(function (root) {\n  \'use strict\';\n')
    f.write('  const RESPOSTAS = ' + json.dumps(' '.join(answers), ensure_ascii=False) + '.split(\' \');\n')
    f.write('  const ACEITAS = ' + json.dumps(' '.join(sorted(valid.values(), key=norm)), ensure_ascii=False) + '.split(\' \');\n')
    f.write("  const api = { RESPOSTAS, ACEITAS };\n")
    f.write("  if (typeof module !== 'undefined' && module.exports) module.exports = api;\n  else root.PrensaPalavras = api;\n")
    f.write("})(typeof window !== 'undefined' ? window : globalThis);\n")
