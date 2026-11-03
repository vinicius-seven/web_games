# Empacota a Jogateca para publicar: copia o site e, em cada página .html, põe o CSS e o JS locais
# dentro da própria página. Assim abrir um jogo é um pedido só ao servidor, em vez de 5 a 9
# (faz diferença em hospedagens lentas ou sem cache). No repositório os arquivos continuam separados.
#
# Uso: python3 tools/empacotar.py <pasta_saida> [--artefato]
#   --artefato: gera também jogateca.html (o catálogo sem <!doctype>/<head>, como o publicador espera).
import os, re, shutil, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out = os.path.abspath(sys.argv[1])
artefato = '--artefato' in sys.argv
SKIP = {'.git', 'tools', 'node_modules', '__pycache__', 'shots'}

def read(path):
    with open(path, encoding='utf-8') as f:
        return f.read()

def inline(html, page_dir):
    def css(m):
        href = m.group(1)
        if re.match(r'^(https?:)?//', href):
            return m.group(0)
        path = os.path.normpath(os.path.join(page_dir, href))
        if not os.path.isfile(path):
            return m.group(0)
        return '<style>\n' + read(path).replace('</style', '<\\/style') + '\n</style>'
    def js(m):
        src = m.group(1)
        if re.match(r'^(https?:)?//', src):
            return m.group(0)
        path = os.path.normpath(os.path.join(page_dir, src))
        if not os.path.isfile(path):
            return m.group(0)
        code = read(path).replace('</script', '<\\/script')
        attrs = ''
        if os.path.basename(src) == 'pwa.js':
            attrs = f' data-root="{os.path.dirname(src) + "/" if os.path.dirname(src) else "./"}"'
        return f'<script{attrs}>\n{code}\n</script>'
    html = re.sub(r'<link rel="stylesheet" href="([^"]+)">', css, html)
    html = re.sub(r'<script src="([^"]+)"></script>', js, html)
    return html

pages = 0
for dirpath, dirnames, filenames in os.walk(ROOT):
    dirnames[:] = [d for d in dirnames if d not in SKIP and not d.startswith('.')]
    rel = os.path.relpath(dirpath, ROOT)
    dest = os.path.join(out, rel) if rel != '.' else out
    os.makedirs(dest, exist_ok=True)
    for name in filenames:
        src = os.path.join(dirpath, name)
        if name.endswith('.html'):
            with open(os.path.join(dest, name), 'w', encoding='utf-8') as f:
                f.write(inline(read(src), dirpath))
            pages += 1
        elif not name.endswith(('.py', '.md')) and name not in ('.gitignore',):
            shutil.copy2(src, os.path.join(dest, name))

if artefato:
    html = read(os.path.join(out, 'index.html'))
    head = re.search(r'<head>(.*?)</head>', html, re.S).group(1)
    head = re.sub(r'\s*<meta charset="utf-8">', '', head)
    head = re.sub(r'\s*<meta name="viewport"[^>]*>', '', head)
    body = re.search(r'<body[^>]*>(.*)</body>', html, re.S).group(1)
    with open(os.path.join(out, 'jogateca.html'), 'w', encoding='utf-8') as f:
        f.write(head.strip() + '\n' + body)
print(f'{pages} páginas empacotadas em {out}')
