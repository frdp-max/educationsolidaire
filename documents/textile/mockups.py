"""Maquettes à plat (hoodie, parka) habillées avec les logos du kit textile.

Usage : python documents/textile/mockups.py   (après generate.py)
Produit documents/textile/maquettes/*.svg ; l'export PNG se fait avec Inkscape :
    inkscape documents/textile/maquettes/x.svg -w 2400 -o documents/textile/maquettes/x.png

Échelle : 1 px = 2 mm (torse taille M ≈ 520 mm = 260 px), donc les logos sont
posés à leur taille d'impression recommandée par la fiche technique.
"""
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
SVG = HERE / "svg"
OUT = HERE / "maquettes"
MM = 0.5  # px par mm


def shade(hex_color, f):
    """f < 1 assombrit, f > 1 éclaircit (vers le blanc)."""
    r, g, b = (int(hex_color[i:i + 2], 16) for i in (1, 3, 5))
    if f <= 1:
        r, g, b = (round(c * f) for c in (r, g, b))
    else:
        t = f - 1
        r, g, b = (round(c + (255 - c) * t) for c in (r, g, b))
    return "#%02x%02x%02x" % (r, g, b)


def logo(name, x, y, width_mm, anchor="center", rotate=0):
    """Insère un logo du kit, centré sur (x, y), à sa largeur réelle d'impression."""
    src = (SVG / ("unisson-%s.svg" % name)).read_text(encoding="utf-8")
    vb = [float(v) for v in re.search(r'viewBox="([^"]+)"', src).group(1).split()]
    paths = "".join(re.findall(r"<path[^>]*/>", src))
    w = width_mm * MM
    h = w * vb[3] / vb[2]
    rot = ' transform="rotate(%g %g %g)"' % (rotate, x, y) if rotate else ""
    return '<g%s><svg x="%.1f" y="%.1f" width="%.1f" height="%.1f" viewBox="%s">%s</svg></g>' % (
        rot, x - w / 2, y - h / 2, w, h, " ".join("%g" % v for v in vb), paths)


# ---------------------------------------------------------------- hoodie
def hoodie(c, view, marks):
    d, dd, l = shade(c, .82), shade(c, .68), shade(c, 1.10)
    seam = 'fill="none" stroke="%s" stroke-width="1.6" stroke-dasharray="4 3"' % dd
    edge = 'stroke="%s" stroke-width="2" stroke-linejoin="round"' % dd
    sleeve_l = "M180,160 C130,175 105,220 95,300 L72,560 L136,567 L160,360 C165,320 170,260 172,220 Z"
    sleeve_r = "M420,160 C470,175 495,220 505,300 L528,560 L464,567 L440,360 C435,320 430,260 428,220 Z"
    torso = "M245,132 L180,160 C172,200 170,260 170,330 L170,648 L430,648 L430,330 C430,260 428,200 420,160 L355,132 Z"
    out = []
    if view == "front":
        out.append('<path d="M228,150 C210,92 245,36 300,34 C355,36 390,92 372,150 Z" fill="%s" %s/>' % (d, edge))
    out += [
        '<path d="%s" fill="%s" %s/>' % (sleeve_l, c, edge),
        '<path d="%s" fill="%s" %s/>' % (sleeve_r, c, edge),
        '<path d="M72,560 L136,567 L134,596 L70,589 Z" fill="%s" %s/>' % (d, edge),
        '<path d="M528,560 L464,567 L466,596 L530,589 Z" fill="%s" %s/>' % (d, edge),
        '<path d="%s" fill="%s" %s/>' % (torso, c, edge),
        '<path d="M170,606 L430,606 L430,648 L170,648 Z" fill="%s" %s/>' % (d, edge),
    ]
    for x in range(180, 430, 9):  # côtes du bas
        out.append('<line x1="%d" y1="610" x2="%d" y2="645" stroke="%s" stroke-width="1"/>' % (x, x, dd))
    if view == "front":
        out += [
            # intérieur de capuche
            '<path d="M252,136 C246,100 268,74 300,72 C332,74 354,100 348,136 C332,160 268,160 252,136 Z" fill="%s" %s/>' % (dd, edge),
            '<path d="M252,136 C268,160 332,160 348,136 L355,132 C340,172 260,172 245,132 Z" fill="%s" %s/>' % (d, edge),
            # cordons
            '<path d="M283,160 C281,200 279,250 277,290" stroke="%s" stroke-width="4" fill="none" stroke-linecap="round"/>' % l,
            '<path d="M317,160 C319,205 321,255 323,296" stroke="%s" stroke-width="4" fill="none" stroke-linecap="round"/>' % l,
            '<rect x="274" y="288" width="6" height="14" rx="2" fill="%s"/>' % dd,
            '<rect x="320" y="294" width="6" height="14" rx="2" fill="%s"/>' % dd,
            # poche kangourou
            '<path d="M212,468 L388,468 L404,592 L196,592 Z" fill="%s" %s/>' % (c, edge),
            '<path d="M212,468 L196,592" stroke="%s" stroke-width="3"/>' % dd,
            '<path d="M388,468 L404,592" stroke="%s" stroke-width="3"/>' % dd,
            '<path d="M217,474 L383,474 L398,586 L202,586 Z" %s/>' % seam,
        ]
    else:
        out += [
            '<path d="M222,158 C204,86 246,30 300,28 C354,30 396,86 378,158 C350,178 250,178 222,158 Z" fill="%s" %s/>' % (c, edge),
            '<path d="M300,30 L300,168" %s/>' % seam,
            '<path d="M228,152 C252,168 348,168 372,152" %s/>' % seam,
        ]
    out.append('<path d="M180,160 C172,200 170,260 172,330" %s/>' % seam)
    out.append('<path d="M420,160 C428,200 430,260 428,330" %s/>' % seam)
    out += marks
    return "\n".join(out)


# ---------------------------------------------------------------- parka
def parka(c, view, marks):
    d, dd, l = shade(c, .82), shade(c, .66), shade(c, 1.18)
    seam = 'fill="none" stroke="%s" stroke-width="1.6" stroke-dasharray="4 3"' % (l if c < "#555555" else dd)
    edge = 'stroke="%s" stroke-width="2" stroke-linejoin="round"' % dd
    torso = "M238,128 L166,160 C158,220 158,300 160,360 L154,724 L446,724 L440,360 C442,300 442,220 434,160 L362,128 Z"
    sleeve_l = "M166,160 C118,176 96,226 88,300 L60,640 L128,648 L152,380 C158,330 160,260 160,215 Z"
    sleeve_r = "M434,160 C482,176 504,226 512,300 L540,640 L472,648 L448,380 C442,330 440,260 440,215 Z"
    out = []
    if view == "front":
        out.append('<path d="M212,146 C190,80 238,22 300,20 C362,22 410,80 388,146 Z" fill="%s" %s/>' % (d, edge))
    out += [
        '<path d="%s" fill="%s" %s/>' % (sleeve_l, c, edge),
        '<path d="%s" fill="%s" %s/>' % (sleeve_r, c, edge),
        '<path d="M60,640 L128,648 L127,676 L58,668 Z" fill="%s" %s/>' % (d, edge),
        '<path d="M540,640 L472,648 L473,676 L542,668 Z" fill="%s" %s/>' % (d, edge),
        '<path d="%s" fill="%s" %s/>' % (torso, c, edge),
        '<path d="M160,396 L440,396" %s/>' % seam,  # coulisse de taille
        '<path d="M160,404 L440,404" %s/>' % seam,
    ]
    if view == "front":
        out += [
            '<path d="M244,128 L254,180 L300,196 L346,180 L356,128 C330,140 270,140 244,128 Z" fill="%s" %s/>' % (d, edge),
            '<path d="M290,190 L310,190 L310,724 L290,724 Z" fill="%s" %s/>' % (d, edge),
            '<path d="M300,192 L300,724" stroke="%s" stroke-width="2"/>' % dd,
        ]
        for y in range(240, 720, 70):
            out.append('<circle cx="300" cy="%d" r="4" fill="%s" stroke="%s"/>' % (y, l, dd))
        for x0, x1 in ((182, 276), (324, 418)):
            out += [
                '<path d="M%d,500 L%d,500 L%d,620 L%d,620 Z" fill="%s" %s/>' % (x0, x1, x1, x0, c, edge),
                '<path d="M%d,500 L%d,500 L%d,540 L%d,540 Z" fill="%s" %s/>' % (x0 - 3, x1 + 3, x1 + 3, x0 - 3, d, edge),
                '<path d="M%d,506 L%d,506 L%d,534 L%d,534 Z" %s/>' % (x0 + 4, x1 - 4, x1 - 4, x0 + 4, seam),
            ]
        out.append('<path d="M154,704 L446,704" %s/>' % seam)
    else:
        out += [
            '<path d="M206,160 C186,80 240,24 300,22 C360,24 414,80 394,160 C360,182 240,182 206,160 Z" fill="%s" %s/>' % (c, edge),
            '<path d="M300,24 L300,176" %s/>' % seam,
            '<path d="M212,154 C246,172 354,172 388,154" %s/>' % seam,
            '<path d="M178,206 L422,206" %s/>' % seam,  # empiècement dos
            '<path d="M154,704 L446,704" %s/>' % seam,
        ]
    out.append('<path d="M166,160 C158,220 158,300 160,360" %s/>' % seam)
    out.append('<path d="M434,160 C442,220 442,300 440,360" %s/>' % seam)
    out += marks
    return "\n".join(out)


# ---------------------------------------------------------------- planches
MODELS = {
    # nom : (vêtement, couleur tissu, version logo, marquages {vue: [...]})
    "hoodie-indigo": ("hoodie", "#2a1240", "blanc", {
        "front": [("coeur", 372, 232, 105)],
        "back": [("horizontal", 300, 290, 280)],
    }),
    "hoodie-gris": ("hoodie", "#d8d5dc", "couleur", {
        "front": [("ecusson", 300, 362, 130)],
        "back": [("horizontal", 300, 290, 280)],
    }),
    "parka-noire": ("parka", "#1d1c22", "blanc", {
        "front": [("symbole", 372, 250, 55)],
        "back": [("ecusson", 300, 296, 260)],
    }),
    "parka-sable": ("parka", "#cdbf9f", "mono", {
        "front": [("coeur", 374, 250, 105), ("symbole", 112, 330, 70, {"rotate": 5})],
        "back": [("ecusson", 300, 296, 260)],
    }),
}


def build():
    OUT.mkdir(exist_ok=True)
    for name, (kind, color, version, marks) in MODELS.items():
        draw = hoodie if kind == "hoodie" else parka
        views = []
        for i, view in enumerate(("front", "back")):
            m = []
            for lockup, *args in marks[view]:
                kw = args.pop() if isinstance(args[-1], dict) else {}
                m.append(logo("%s-%s" % (lockup, version), *args, **kw))
            views.append('<g transform="translate(%d 0)">%s</g>' % (i * 620, draw(color, view, m)))
        svg = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1220 760" width="1220" height="760">\n'
               '<title>UNISSON — %s (face / dos)</title>\n%s\n</svg>\n') % (name, "\n".join(views))
        (OUT / ("%s.svg" % name)).write_text(svg, encoding="utf-8")
        print(name)


if __name__ == "__main__":
    build()
