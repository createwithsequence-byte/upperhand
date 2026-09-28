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
head = head.replace("{{TARGET}} · Deep Dive · {{MONTH YEAR}}", "The Chefs Community · Site and app audit · September 2026")
head = head.replace("<title>", '<meta name="robots" content="noindex,nofollow" />\n    <link rel="icon" href="data:," />\n    <title>', 1)
# The Chefs Community skin: navy-black, cream, gold. Display stays Big Shoulders so the audit reads as ours, not theirs.
for k, v in [("bg", "#0b0d13"), ("bg-2", "#10131a"), ("line", "#23262f"), ("line-2", "#363a47"), ("ink", "#f6f3ed"), ("ink-2", "#b3afa6"), ("ink-3", "#6f6c66"), ("ember", "#dcb05b"), ("heat", "#efd190"), ("cool", "#8fa7c4")]:
    tok(k, v)
head = head.replace("rgba(240, 78, 35, 0.55)", "rgba(220, 176, 91, 0.30)").replace("rgba(255, 178, 74, 0.35)", "rgba(239, 209, 144, 0.16)")
head = head.replace("rgba(12, 10, 8, 0.96)", "rgba(11, 13, 19, 0.97)").replace("rgba(12, 10, 8, 0.82)", "rgba(11, 13, 19, 0.84)").replace("rgba(12, 10, 8, 0.35)", "rgba(11, 13, 19, 0.38)")
head = head.replace("rgba(240, 78, 35, 0.5)", "rgba(220, 176, 91, 0.55)").replace("rgba(240, 78, 35, 0.45)", "rgba(220, 176, 91, 0.45)").replace("rgba(240, 78, 35, 0.07)", "rgba(220, 176, 91, 0.07)").replace("rgba(240, 78, 35, 0.6)", "rgba(220, 176, 91, 0.6)").replace("rgba(240, 78, 35, 0.08)", "rgba(220, 176, 91, 0.08)")
head = head.replace("rgba(20, 17, 13, 0.72)", "rgba(16, 19, 26, 0.74)").replace("rgba(20, 17, 13, 0.7)", "rgba(16, 19, 26, 0.72)").replace("rgba(20, 17, 13, 0.9)", "rgba(16, 19, 26, 0.9)").replace("rgba(12, 10, 8, 0.92)", "rgba(11, 13, 19, 0.92)")
head = re.sub(r'<img id="logo-corner"[^>]*>', '<img id="logo-corner" src="img/tcc-logo-white.png" alt="The Chefs Community" style="height:20px" />', head)
head = re.sub(r'<div id="brand">.*?</div>', '<div id="brand"><b>The Chefs Community</b> · site and app audit · 28 September 2026</div>', head, flags=re.S)
EXTRA = open("extra.css", encoding="utf-8").read()
head = head.replace("</style>", EXTRA + "    </style>", 1)
# particles: gold and cream, slow
tail = tail.replace("rgba(255,178,74,${a})", "rgba(239,209,144,${a})").replace("rgba(240,78,35,${a * 0.85})", "rgba(220,176,91,${a * 0.7})")
tail = tail.replace("p.vy = (0.25 + Math.random() * 0.9)", "p.vy = (0.15 + Math.random() * 0.55)")
SRC = json.load(open("sources.json", encoding="utf-8"))
tail, n = re.subn(r"const SRC = \[.*?\];", "const SRC = " + json.dumps(SRC, ensure_ascii=False) + ";", tail, flags=re.S); assert n == 1
PEERS = json.load(open("peers.json", encoding="utf-8"))
peers_js = "const PEERS = " + json.dumps(PEERS, ensure_ascii=False) + ";\n      const _pe = document.getElementById('peers'); if (_pe) _pe.innerHTML = '<div class=\"row head\"><span>Peer</span><span>Status</span><span>What a chef sees on the first screen</span></div>' + PEERS.map(p => `<div class=\"row\"><div class=\"k\">${p[0]}</div><p class=\"yes\"><strong>${p[2]}</strong></p><p>${p[3]}</p></div>`).join('');"
tail = tail.replace("document.getElementById(\"src\").innerHTML", peers_js + "\n      document.getElementById(\"src\").innerHTML", 1)
SLIDES = open("slides.html", encoding="utf-8").read()
out = head + '<div id="deck">\n' + SLIDES + '\n    </div>\n\n    ' + tail
open("index.html", "w", encoding="utf-8").write(out)
print("index.html", len(out), "bytes; slides:", SLIDES.count('<section'), "; em dashes in slides:", SLIDES.count("—"))
