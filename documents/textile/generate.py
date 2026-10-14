"""Génère le kit textile UNISSON (SVG 100 % vectoriel, contours fermés).

Usage :
    pip install fonttools shapely
    python documents/textile/generate.py chemin/vers/Montserrat[wght].ttf

La police Montserrat (SIL OFL) se télécharge depuis
https://github.com/google/fonts/tree/main/ofl/montserrat — elle n'est utilisée
que pour vectoriser les textes : les SVG produits n'en dépendent plus.
"""
import math
import sys
from pathlib import Path

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from shapely.geometry import LineString, Point
from shapely.geometry.polygon import orient
from shapely.ops import unary_union

OUT = Path(__file__).resolve().parent / "svg"
ROOT = Path(__file__).resolve().parents[2]  # logo.svg du site (racine du dépôt)

# Palette officielle (charte 2026-10) : 2 violets, comme le site et le print
INDIGO = "#2A0E45"   # encre : ruban gauche + « UNISSON »
ACCENT = "#6D28D9"   # violet : ruban droit + sous-titre
WHITE = "#FFFFFF"

COLORWAYS = {
    # suffixe : (ruban A, ruban B, UNISSON, sous-titre)
    "couleur": (INDIGO, ACCENT, INDIGO, ACCENT),
    "mono": (INDIGO, INDIGO, INDIGO, INDIGO),
    "blanc": (WHITE, WHITE, WHITE, WHITE),
}

# ---------------------------------------------------------------- symbole
# Repère 200 x 200. Un ruban = arc ouvert prolongé par une « main » en crochet ;
# le second ruban est le premier tourné de 180°. Valeurs vérifiées pour
# garantir, à 30 mm de large, un trait de 1,8 mm et des jours ≥ 1 mm.
STROKE = 12          # épaisseur du ruban
GAP = 7              # jour d'entrelacs (passage dessous)
ARC = (80, 80, 54, 93, 350)  # cx, cy, r, angle de départ, angle d'arrivée
CURL = [((136, 92), (133, 118), (118, 121)), ((105, 123), (103, 110), (109.5, 103))]


def _arc(cx, cy, r, a0, a1, n=360):
    return [(cx + r * math.cos(math.radians(a0 + (a1 - a0) * i / n)),
             cy + r * math.sin(math.radians(a0 + (a1 - a0) * i / n))) for i in range(n + 1)]


def _cubic(p0, p1, p2, p3, n=120):
    return [tuple((1 - t) ** 3 * a + 3 * (1 - t) ** 2 * t * b + 3 * (1 - t) * t * t * c + t ** 3 * d
                  for a, b, c, d in zip(p0, p1, p2, p3)) for t in (i / n for i in range(n + 1))]


def symbol_shapes():
    pts = _arc(*ARC)
    for seg in CURL:
        pts += _cubic(pts[-1], *seg)[1:]
    line_a = LineString(pts)
    line_b = LineString([(200 - x, 200 - y) for x, y in pts])
    shape_a = line_a.buffer(STROKE / 2, quad_segs=24)
    shape_b = line_b.buffer(STROKE / 2, quad_segs=24)
    # Entrelacs : chaque arc passe au-dessus de l'extrémité de l'autre ruban.
    for p in line_a.intersection(line_b).geoms:
        zone = Point(p.x, p.y).buffer(STROKE * 2)
        if p.x > 100:   # en haut à droite : A dessus
            shape_b = shape_b.difference(line_a.buffer(STROKE / 2 + GAP).intersection(zone))
        else:           # en bas à gauche : B dessus
            shape_a = shape_a.difference(line_b.buffer(STROKE / 2 + GAP).intersection(zone))
    # Aucun îlot résiduel : en flex, les petites pièces isolées se décollent.
    def solid(g):
        parts = [p for p in getattr(g, "geoms", [g]) if p.area > 20]
        assert len(parts) == 1, "le ruban doit rester d'un seul tenant"
        return parts[0].simplify(0.02)
    return solid(shape_a), solid(shape_b)


def poly_path(geom, scale, dx, dy):
    polys = getattr(geom, "geoms", [geom])
    out = []
    for poly in polys:
        poly = orient(poly)  # trous en sens inverse : rendu correct en nonzero
        for ring in [poly.exterior, *poly.interiors]:
            c = list(ring.coords)[:-1]
            out.append("M" + " L".join("%.2f %.2f" % (x * scale + dx, y * scale + dy) for x, y in c) + " Z")
    return " ".join(out)


def build_web_logo():
    """logo.svg du site : symbole couleur allégé (précision 0,1 unité, invisible à l'écran)."""
    a, b = symbol_shapes()
    minx, miny, maxx, maxy = unary_union([a, b]).bounds

    def path(g):
        g = orient(g.simplify(0.12))
        return " ".join("M" + " L".join("%.1f %.1f" % (x - minx, y - miny) for x, y in list(r.coords)[:-1]) + "Z"
                        for r in [g.exterior, *g.interiors])
    svg = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %.0f %.0f">'
           '<title>UNISSON</title>'
           '<path fill="%s" d="%s"/><path fill="%s" d="%s"/></svg>\n') % (
        math.ceil(maxx - minx), math.ceil(maxy - miny), INDIGO, path(a), ACCENT, path(b))
    (ROOT / "logo.svg").write_text(svg, encoding="utf-8")
    print("logo.svg", len(svg), "octets")


# ---------------------------------------------------------------- textes
class Face:
    def __init__(self, path, weight):
        self.font = instantiateVariableFont(TTFont(path), {"wght": weight})
        self.glyphs = self.font.getGlyphSet()
        self.cmap = self.font.getBestCmap()
        self.hmtx = self.font["hmtx"]
        self.cap = self.font["OS/2"].sCapHeight

    def _glyf(self, ch):
        return self.font["glyf"][self.cmap[ord(ch)]]

    def lsb(self, text):
        return self._glyf(text[0]).xMin

    def width(self, text, tracking):
        """Largeur de l'encre (du premier au dernier pixel imprimé), en unités de police."""
        adv = [self.hmtx[self.cmap[ord(ch)]][0] for ch in text]
        last = self._glyf(text[-1])
        return sum(adv[:-1]) + tracking * (len(text) - 1) + last.xMax - self.lsb(text)

    def path(self, text, x, baseline, cap_height, tracking=0.0):
        """Chemin SVG du texte ; tracking en unités de police."""
        s = cap_height / self.cap
        pen = SVGPathPen(self.glyphs, ntos=lambda v: "%.2f" % v)
        cursor = -self.lsb(text)  # aligne l'encre, pas la chasse
        for ch in text:
            name = self.cmap[ord(ch)]
            self.glyphs[name].draw(TransformPen(pen, (s, 0, 0, -s, x + cursor * s, baseline)))
            cursor += self.hmtx[name][0] + tracking
        return pen.getCommands()


WORD = "UNISSON"
SUB = "ASSOCIATION ÉDUCATION SOLIDAIRE"


def build(font_path):
    bold = Face(font_path, 800)
    semi = Face(font_path, 600)
    a, b = symbol_shapes()
    minx, miny, maxx, maxy = unary_union([a, b]).bounds
    sym_w, sym_h = maxx - minx, maxy - miny

    word_track = 40  # +4 % : capitales grasses légèrement aérées

    def justified_sub(target_w_units_bold, word_scale, sub_cap):
        """Approche du sous-titre pour qu'il occupe exactement la largeur de UNISSON."""
        s = sub_cap / semi.cap
        target = target_w_units_bold * word_scale / s
        natural = semi.width(SUB, 0)
        return (target - natural) / (len(SUB) - 1)

    layouts = {}

    # --- 1. symbole seul
    def symbol_only(c):
        k = 100 / sym_w  # 100 unités de large
        return (100, sym_h * k, [
            (c[0], poly_path(a, k, -minx * k, -miny * k)),
            (c[1], poly_path(b, k, -minx * k, -miny * k)),
        ])
    layouts["symbole"] = symbol_only

    # --- 2. horizontal / 4. cœur (sans sous-titre)
    def horizontal(with_sub):
        def make(c):
            H = 100                      # hauteur du symbole
            k = H / sym_h
            gap = 0.16 * H
            word_cap = 0.36 * H if with_sub else 0.40 * H
            sub_cap = 0.085 * H
            sw = sym_w * k
            word_w = bold.width(WORD, word_track) * word_cap / bold.cap
            x0 = sw + gap
            if with_sub:
                line_gap = 0.13 * H
                block_h = word_cap + line_gap + sub_cap
                top = (H - block_h) / 2
                word_base = top + word_cap
                sub_base = word_base + line_gap + sub_cap
            else:
                word_base = (H + word_cap) / 2
            parts = [
                (c[0], poly_path(a, k, -minx * k, -miny * k)),
                (c[1], poly_path(b, k, -minx * k, -miny * k)),
                (c[2], bold.path(WORD, x0, word_base, word_cap, word_track)),
            ]
            if with_sub:
                tr = justified_sub(bold.width(WORD, word_track), word_cap / bold.cap, sub_cap)
                parts.append((c[3], semi.path(SUB, x0, sub_base, sub_cap, tr)))
            return (x0 + word_w, H, parts)
        return make
    layouts["horizontal"] = horizontal(True)
    layouts["coeur"] = horizontal(False)

    # --- 3. écusson centré
    def centered(c):
        word_cap = 34
        word_w = bold.width(WORD, word_track) * word_cap / bold.cap
        sub_cap = 8.6
        W = word_w
        sw = 0.62 * W
        k = sw / sym_w
        sh = sym_h * k
        sx = (W - sw) / 2
        word_base = sh + 18 + word_cap
        sub_base = word_base + 13 + sub_cap
        tr = justified_sub(bold.width(WORD, word_track), word_cap / bold.cap, sub_cap)
        return (W, sub_base, [
            (c[0], poly_path(a, k, sx - minx * k, -miny * k)),
            (c[1], poly_path(b, k, sx - minx * k, -miny * k)),
            (c[2], bold.path(WORD, 0, word_base, word_cap, word_track)),
            (c[3], semi.path(SUB, 0, sub_base, sub_cap, tr)),
        ])
    layouts["ecusson"] = centered

    OUT.mkdir(parents=True, exist_ok=True)
    for lname, make in layouts.items():
        for cname, colors in COLORWAYS.items():
            w, h, parts = make(colors)
            # Regroupe par couleur : 1 calque = 1 écran de sérigraphie / 1 couleur de flex.
            by_color = {}
            for col, d in parts:
                by_color.setdefault(col, []).append(d)
            m = 2  # marge de sécurité (unités) autour de l'encre
            body = "\n".join(
                '  <path id="encre-%d" fill="%s" fill-rule="nonzero" d="%s"/>' % (i + 1, col, " ".join(ds))
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


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    build(sys.argv[1])
    build_web_logo()
