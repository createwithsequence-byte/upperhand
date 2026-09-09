import re, json
src = open("engine.src.html", encoding="utf-8").read()
cut = src.index('<div id="deck">', src.index('<body>'))
head, rest = src[:cut], src[cut + len('<div id="deck">'):]
_, tail = rest.split('<div id="rail">', 1)
tail = '<div id="rail">' + tail
def tok(name, val):
    global head
    head, n = re.subn(r"(--%s:\s*)[^;]+;" % re.escape(name), r"\g<1>%s;" % val, head, count=1)
    assert n == 1, name
head = head.replace("{{TARGET}} · Deep Dive · {{MONTH YEAR}}", "Pedersen & Houpt · Website audit · September 2026")
head = head.replace("family=Big+Shoulders+Display:wght@700;800;900", "family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700")
for k, v in [("bg", "#0d0e10"), ("bg-2", "#14161a"), ("line", "#262a30"), ("line-2", "#363b43"), ("ink", "#f1eee8"), ("ink-2", "#aeb0b4"), ("ink-3", "#6f747b"), ("ember", "#AB1E23"), ("heat", "#e0616a"), ("display", '"Fraunces", "Iowan Old Style", Georgia, serif')]:
    tok(k, v)
head = re.sub(r'<img id="logo-corner"[^>]*>', '<img id="logo-corner" src="img/logo-cream.svg" alt="Pedersen & Houpt" />', head)
head = re.sub(r'<div id="brand">.*?</div>', '<div id="brand"><b>Pedersen & Houpt</b> · website audit · September 2026</div>', head)
EXTRA = open("extra.css", encoding="utf-8").read()
head = head.replace("</style>", EXTRA + "    </style>", 1)
SRC = json.load(open("sources.json", encoding="utf-8"))
tail, n = re.subn(r"const SRC = \[.*?\];", "const SRC = " + json.dumps(SRC, ensure_ascii=False) + ";", tail, flags=re.S); assert n == 1
PEERS = json.load(open("peers.json", encoding="utf-8"))
peers_js = "const PEERS = " + json.dumps(PEERS, ensure_ascii=False) + ";\n      const _pe = document.getElementById('peers'); if (_pe) _pe.innerHTML = '<div class=\"row head\"><span>Firm</span><span>Current design since</span><span>What a client sees</span></div>' + PEERS.map(p => `<div class=\"row\"><div class=\"k\">${p[0]}<br><span style=\"opacity:.6\">${p[1]}</span></div><p class=\"${/^20(2[2-6])/.test(p[2]) ? 'yes' : 'no'}\"><strong>${p[2]}</strong></p><p>${p[3]}</p></div>`).join('');"
tail = tail.replace("document.getElementById(\"src\").innerHTML", peers_js + "\n      document.getElementById(\"src\").innerHTML", 1)
SLIDES = open("slides.html", encoding="utf-8").read()
out = head + '<div id="deck">\n' + SLIDES + '\n    </div>\n\n    ' + tail
open("index.html", "w", encoding="utf-8").write(out)
print("index.html", len(out), "bytes; slides:", SLIDES.count('<section'), "; new em dashes:", out.count("—") - src.count("—"))
