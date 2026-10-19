"""Génère le kit textile UNISSON et les logos du site à partir du logo officiel.

Usage :
    pip install svgelements shapely
    python documents/textile/generate.py

Source : source/unisson-logo-source.svg (logo livré par le graphiste, 2026-10) —
deux mains entrelacées, « UNISSON » et le sous-titre déjà vectorisés. Le script
ne redessine rien : il reprend ces tracés (courbes de Bézier conservées), les
recompose en quatre logos et les décline en trois couleurs. Aucune police n'est
nécessaire.

Exports PNG / PDF / EPS ensuite : voir build_exports() (Inkscape requis).
"""
import math
import shutil
import subprocess
import sys
from pathlib import Path

from shapely.geometry import Polygon
from shapely.ops import unary_union
from svgelements import SVG, Arc, Close, CubicBezier, Line, Matrix, Move, Path as SvgPath, QuadraticBezier

HERE = Path(__file__).resolve().parent
SOURCE = HERE / "source" / "unisson-logo-source.svg"
OUT = HERE / "svg"
ROOT = Path(__file__).resolve().parents[2]  # logo.svg du site (racine du dépôt)

# Palette officielle (charte 2026-10-19) : couleurs du logo livré
ENCRE = "#4F0D70"    # main gauche + « UNISSON »
LILAS = "#C384E0"    # main droite + sous-titre
WHITE = "#FFFFFF"

COLORWAYS = {
    # suffixe : (main A, main B, UNISSON, sous-titre)
    "couleur": (ENCRE, LILAS, ENCRE, LILAS),
    "mono": (ENCRE, ENCRE, ENCRE, ENCRE),
    "blanc": (WHITE, WHITE, WHITE, WHITE),
}


# ---------------------------------------------------------------- lecture
def load_source():
    """Répartit les tracés de la source : mains A / B, mot, sous-titre."""
    svg = SVG.parse(str(SOURCE), reify=True)
    paths = [e for e in svg.elements() if isinstance(e, SvgPath) and len(e)]
    text = [p for p in paths if sum(isinstance(s, Move) for s in p) > 1]  # glyphes : plusieurs contours
    hands = [p for p in paths if p not in text]
    dark = str(hands[0].fill).lower()
    word = max(text, key=lambda p: p.bbox()[3] - p.bbox()[1])
    sub = [p for p in text if p is not word][0]
    return ([p for p in hands if str(p.fill).lower() == dark],
            [p for p in hands if str(p.fill).lower() != dark], [word], [sub])


def bounds(paths):
    bb = [p.bbox() for p in paths]
    return (min(b[0] for b in bb), min(b[1] for b in bb), max(b[2] for b in bb), max(b[3] for b in bb))


def d_string(path, matrix, prec=2):
    """Chemin transformé, courbes conservées, précision réduite."""
    p = SvgPath(path) * matrix
    p.reify()
    f = "%%.%df" % prec

    def pt(q):
        return (f + " " + f) % (q.x, q.y)
    out = []
    for s in p:
        if isinstance(s, Move):
            out.append("M" + pt(s.end))
        elif isinstance(s, Line):
            out.append("L" + pt(s.end))
        elif isinstance(s, CubicBezier):
            out.append("C" + " ".join(pt(q) for q in (s.control1, s.control2, s.end)))
        elif isinstance(s, QuadraticBezier):
            out.append("Q" + pt(s.control) + " " + pt(s.end))
        elif isinstance(s, Arc):
            for c in s.as_cubic_curves():
                out.append("C" + " ".join(pt(q) for q in (c.control1, c.control2, c.end)))
        elif isinstance(s, Close):
            out.append("Z")
    return "".join(out).replace(" -", "-")


def polygons(paths):
    """Aplatit les tracés (pour les mesures uniquement)."""
    polys = []
    for path in paths:
        for sub in SvgPath(path).as_subpaths():
            pts = [(q.x, q.y) for q in SvgPath(sub).as_points()]
            if len(pts) > 2:
                polys.append(Polygon(pts).buffer(0))
    # Les contre-formes (O, D, A…) sont des contours intérieurs : différence symétrique.
    shape = polys[0]
    for p in polys[1:]:
        shape = shape.symmetric_difference(p)
    return shape


# ---------------------------------------------------------------- mises en page
def place(paths, k, dx, dy, src_bounds):
    """Matrice : met les tracés à l'échelle k, coin haut-gauche de src_bounds en (dx, dy)."""
    return Matrix("translate(%f,%f) scale(%f) translate(%f,%f)" % (dx, dy, k, -src_bounds[0], -src_bounds[1]))


def build():
    hand_a, hand_b, word, sub = load_source()
    sym_b = bounds(hand_a + hand_b)
    word_b, sub_b = bounds(word), bounds(sub)
    sym_w, sym_h = sym_b[2] - sym_b[0], sym_b[3] - sym_b[1]
    word_w, word_h = word_b[2] - word_b[0], word_b[3] - word_b[1]
    sub_w = sub_b[2] - sub_b[0]
    all_b = bounds(hand_a + hand_b + word + sub)

    def parts(c, m_sym, m_word=None, m_sub=None):
        out = [(c[0], hand_a, m_sym), (c[1], hand_b, m_sym)]
        if m_word is not None:
            out.append((c[2], word, m_word))
        if m_sub is not None:
            out.append((c[3], sub, m_sub))
        return out

    layouts = {}

    # --- A. symbole seul : 100 unités de large
    def symbol_only(c):
        k = 100 / sym_w
        return 100, sym_h * k, parts(c, place(None, k, 0, 0, sym_b))
    layouts["symbole"] = symbol_only

    # --- B. cœur (sans sous-titre) / C. horizontal : symbole à gauche, haut 100
    def horizontal(with_sub):
        def make(c):
            H = 100
            k = H / sym_h
            x0 = sym_w * k + 0.14 * H
            if with_sub:
                kt = 0.30 * H / word_h          # capitale UNISSON = 30 % du symbole
                gap = (sub_b[1] - word_b[3]) * kt * 1.4
                sub_h = (sub_b[3] - sub_b[1]) * kt
                top = (H - (word_h * kt + gap + sub_h)) / 2
                m_word = place(None, kt, x0, top, word_b)
                m_sub = place(None, kt, x0, top + word_h * kt + gap, sub_b)
                w = x0 + max(word_w, sub_w) * kt
                return w, H, parts(c, place(None, k, 0, 0, sym_b), m_word, m_sub)
            kt = 0.36 * H / word_h
            m_word = place(None, kt, x0, (H - word_h * kt) / 2, word_b)
            return x0 + word_w * kt, H, parts(c, place(None, k, 0, 0, sym_b), m_word)
        return make
    layouts["horizontal"] = horizontal(True)
    layouts["coeur"] = horizontal(False)

    # --- D. écusson : composition d'origine, 300 unités de large
    def centered(c):
        k = 300 / (all_b[2] - all_b[0])
        m = place(None, k, 0, 0, all_b)
        return 300, (all_b[3] - all_b[1]) * k, parts(c, m, m, m)
    layouts["ecusson"] = centered

    OUT.mkdir(parents=True, exist_ok=True)
    for lname, make in layouts.items():
        for cname, colors in COLORWAYS.items():
            w, h, items = make(colors)
            # Regroupe par couleur : 1 calque = 1 écran de sérigraphie / 1 couleur de flex.
            by_color = {}
            for col, paths, matrix in items:
                by_color.setdefault(col, []).extend(d_string(p, matrix) for p in paths)
            m = 2  # marge de sécurité (unités) autour de l'encre
            body = "\n".join(
                '  <path id="encre-%d" fill="%s" fill-rule="nonzero" d="%s"/>' % (i + 1, col, "".join(ds))
                for i, (col, ds) in enumerate(by_color.items()))
            svg = (
                '<?xml version="1.0" encoding="UTF-8"?>\n'
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="%.2f %.2f %.2f %.2f" '
                'width="%.2fmm" height="%.2fmm">\n'
                '  <title>UNISSON — Association Éducation Solidaire — %s (%s)</title>\n'
                '%s\n</svg>\n'
            ) % (-m, -m, w + 2 * m, h + 2 * m, (w + 2 * m) / 2, (h + 2 * m) / 2, lname, cname, body)
            (OUT / ("unisson-%s-%s.svg" % (lname, cname))).write_text(svg, encoding="utf-8")
            print("unisson-%s-%s.svg" % (lname, cname), "%.1f x %.1f" % (w, h))

    # --- logo.svg du site : symbole couleur, précision 0,1 unité (invisible à l'écran)
    k = 160 / max(sym_w, sym_h)
    mtx = place(None, k, 0, 0, sym_b)
    web = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %.0f %.0f"><title>UNISSON</title>'
           '<path fill="%s" d="%s"/><path fill="%s" d="%s"/></svg>\n') % (
        math.ceil(sym_w * k), math.ceil(sym_h * k),
        ENCRE, "".join(d_string(p, mtx, 1) for p in hand_a),
        LILAS, "".join(d_string(p, mtx, 1) for p in hand_b))
    (ROOT / "logo.svg").write_text(web, encoding="utf-8")
    print("logo.svg", len(web), "octets")

    # Cotes pour 100 mm de large, par logo : symbole (largeur) et sous-titre (échelle du texte)
    sizes = {name: make(COLORWAYS["couleur"])[:2] for name, make in layouts.items()}
    widths = {name: wh[0] for name, wh in sizes.items()}
    sym_frac = {"symbole": 1, "coeur": 100 / sym_h * sym_w / widths["coeur"],
                "horizontal": 100 / sym_h * sym_w / widths["horizontal"],
                "ecusson": sym_w / (all_b[2] - all_b[0])}
    sub_scale = {"horizontal": 0.30 * 100 / word_h / widths["horizontal"],
                 "ecusson": 1 / (all_b[2] - all_b[0])}
    measure(hand_a, hand_b, sub, sym_w, sizes, sym_frac, sub_scale)


def measure(hand_a, hand_b, sub, sym_w, sizes, sym_frac, sub_scale):
    """Cotes de fabrication (mm) pour chaque logo posé à 100 mm de large : règle de trois ensuite."""
    pieces = [polygons([p]) for p in hand_a + hand_b]
    # Trait : épaisseur moyenne d'une main (2 × aire / périmètre) ; jour : écart minimal entre deux pièces.
    trait = min(2 * g.area / g.length for g in pieces) / sym_w
    # (les mains se touchent par endroits : léger chevauchement d'origine, utile en sérigraphie)
    jour = min(d for i, a in enumerate(pieces) for b in pieces[i + 1:] if (d := a.distance(b)) > 0) / sym_w
    letters = polygons(sub)
    stem = 2 * letters.area / letters.length
    caps = sorted(SvgPath(s).bbox()[3] - SvgPath(s).bbox()[1] for s in sub[0].as_subpaths())
    cap = caps[len(caps) // 2]  # médiane : écarte l'accent du É et les contre-formes
    for name, (w, h) in sizes.items():
        line = "%-10s h %.1f · trait %.2f · jour %.2f" % (
            name, 100 * h / w, 100 * sym_frac[name] * trait, 100 * sym_frac[name] * jour)
        if name in sub_scale:
            line += " · capitale ST %.2f · fût %.2f" % (100 * sub_scale[name] * cap, 100 * sub_scale[name] * stem)
        print(line, "(mm, logo de 100 mm de large)")


# ---------------------------------------------------------------- exports
INKSCAPE = shutil.which("inkscape") or r"C:\Program Files\Inkscape\bin\inkscape.com"


def ink(src, out, *args):
    subprocess.run([INKSCAPE, str(src), "--export-filename=%s" % out, *args], check=True,
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def build_exports():
    """PDF/EPS du kit, PNG/ICO du site et logo des documents Word."""
    from PIL import Image
    for d in ("pdf", "eps"):
        (HERE / d).mkdir(exist_ok=True)
    for svg in sorted(OUT.glob("*.svg")):
        ink(svg, HERE / "pdf" / (svg.stem + ".pdf"), "--export-text-to-path")
        ink(svg, HERE / "eps" / (svg.stem + ".eps"), "--export-text-to-path")
    tmp = HERE / "_tmp.png"

    def square(svg, size, bg=None, pad=0.0):
        ink(svg, tmp, "--export-width=%d" % (size * 4))
        art = Image.open(tmp).convert("RGBA")
        art = art.crop(art.getbbox())
        inner = round(size * (1 - 2 * pad))
        r = inner / max(art.size)
        art = art.resize((max(1, round(art.width * r)), max(1, round(art.height * r))), Image.LANCZOS)
        canvas = Image.new("RGBA", (size, size), bg or (0, 0, 0, 0))
        canvas.alpha_composite(art, ((size - art.width) // 2, (size - art.height) // 2))
        return canvas

    sym = OUT / "unisson-symbole-couleur.svg"
    eco = OUT / "unisson-ecusson-couleur.svg"
    full = square(eco, 1024, (255, 255, 255, 255), 0.08)
    full.convert("RGB").save(ROOT / "logo.png", optimize=True)
    full.convert("RGB").save(ROOT / "logo.jpg", quality=92)
    full.convert("RGB").save(ROOT / "logo.jpeg", quality=92)
    square(sym, 192, None, 0.03).save(ROOT / "logo-192.png", optimize=True)
    square(sym, 180, (255, 255, 255, 255), 0.12).convert("RGB").save(ROOT / "apple-touch-icon.png", optimize=True)
    square(sym, 256, None, 0.0).save(ROOT / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
    square(sym, 512, None, 0.04).save(ROOT / "logo-symbole.png", optimize=True)
    square(sym, 512, (255, 255, 255, 255), 0.04).convert("RGB").save(ROOT / "logo-symbole-blanc.png", optimize=True)
    tmp.unlink()
    print("exports PDF/EPS/PNG/ICO OK")


if __name__ == "__main__":
    build()
    if "--exports" in sys.argv:
        build_exports()
