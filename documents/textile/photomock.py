"""Pose réaliste d'un logo du kit sur une photo de vêtement uni.

python photomock.py photo.jpg out.jpg logo.png cx cy width [recolor_hex] [rot]
- logo.png : logo rendu en haute définition (fond transparent)
- cx, cy : centre de pose en pixels ; width : largeur en pixels
- recolor_hex : recolore le vêtement (masque teinte/valeur du tissu)
"""
import colorsys
import sys

import numpy as np
from PIL import Image, ImageFilter

src, dst, logo_path, cx, cy, width = sys.argv[1:7]
cx, cy, width = float(cx), float(cy), int(width)
recolor = sys.argv[7] if len(sys.argv) > 7 and sys.argv[7] != "-" else None
rot = float(sys.argv[8]) if len(sys.argv) > 8 else 0
max_y = int(sys.argv[9]) if len(sys.argv) > 9 else None  # bas du vêtement (exclut les ombres dessous)

photo = Image.open(src).convert("RGB")
P = np.asarray(photo).astype(np.float32) / 255
H, W, _ = P.shape
gray = Image.fromarray((P.mean(2) * 255).astype(np.uint8))
L = np.asarray(gray.filter(ImageFilter.GaussianBlur(1.2))).astype(np.float32) / 255
Lbig = np.asarray(gray.filter(ImageFilter.GaussianBlur(30))).astype(np.float32) / 255 + 1e-3

# ---- masque du tissu (vert foncé du sweat) : teinte 120–200°, valeur basse
hsv = np.asarray(photo.convert("HSV")).astype(np.float32)
hue = hsv[..., 0] * 360 / 255
val = hsv[..., 2] / 255
sat = hsv[..., 1] / 255
fabric = ((hue > 110) & (hue < 200) & (val < 0.42) & (sat > 0.5)).astype(np.float32)
if max_y:
    fabric[max_y:] = 0
core = np.asarray(Image.fromarray((fabric * 255).astype(np.uint8))
                  .filter(ImageFilter.MedianFilter(5)).filter(ImageFilter.MinFilter(11))
                  .filter(ImageFilter.MaxFilter(11))).astype(np.float32) / 255
# Bordures fines (doublure de capuche, poignets) : tons très sombres proches du noyau.
near = np.asarray(Image.fromarray((core * 255).astype(np.uint8))
                  .filter(ImageFilter.MaxFilter(25))).astype(np.float32) / 255
loose = (hue > 95) & (hue < 215) & (((val < 0.30) & (sat > 0.2)) | ((val < 0.47) & (sat > 0.5))) & (near > 0.5)
if max_y:
    loose[max_y:] = False
fabric = np.maximum(core, loose.astype(np.float32))
fmask = np.asarray(Image.fromarray((fabric * 255).astype(np.uint8))
                   .filter(ImageFilter.GaussianBlur(1.2))).astype(np.float32) / 255

if recolor:
    r, g, b = (int(recolor[i:i + 2], 16) / 255 for i in (1, 3, 5))
    ref = np.median(L[fabric > 0.5])
    # conserve plis et texture : couleur cible × luminance relative
    rel = (L / ref)[..., None]
    target = np.clip(np.array([r, g, b])[None, None, :] * rel ** 1.15, 0, 1)
    P = P * (1 - fmask[..., None]) + target * fmask[..., None]

# ---- logo : rotation légère, mise à l'échelle
logo = Image.open(logo_path).convert("RGBA")
logo = logo.resize((width, round(logo.height * width / logo.width)), Image.LANCZOS)
if rot:
    logo = logo.rotate(rot, resample=Image.BICUBIC, expand=True)
lw, lh = logo.size
x0, y0 = int(cx - lw / 2), int(cy - lh / 2)

# ---- déformation : le logo suit les plis (gradient de la luminance lissée)
Ls = np.asarray(gray.filter(ImageFilter.GaussianBlur(6))).astype(np.float32) / 255
gy, gx = np.gradient(Ls)
k = 90.0  # amplitude de déplacement (px par unité de gradient)
canvas = np.zeros((H, W, 4), np.float32)
canvas[y0:y0 + lh, x0:x0 + lw] = np.asarray(logo).astype(np.float32) / 255
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
sx = np.clip(xx + gx * k, 0, W - 1.001)
sy = np.clip(yy + gy * k, 0, H - 1.001)
ix, iy = sx.astype(int), sy.astype(int)
fx, fy = (sx - ix)[..., None], (sy - iy)[..., None]
warped = (canvas[iy, ix] * (1 - fx) * (1 - fy) + canvas[iy, ix + 1] * fx * (1 - fy)
          + canvas[iy + 1, ix] * (1 - fx) * fy + canvas[iy + 1, ix + 1] * fx * fy)

# ---- éclairage + grain du molleton sur l'encre
shade = np.clip(L / Lbig, 0.55, 1.25)[..., None]
hp = (np.asarray(gray).astype(np.float32) / 255 - L)[..., None]  # grain fin
ink = np.clip(warped[..., :3] * (0.82 * shade) + hp * 1.6, 0, 1)
alpha = warped[..., 3:4] * 0.95 * fmask[..., None]
alpha = np.asarray(Image.fromarray((alpha[..., 0] * 255).astype(np.uint8))
                   .filter(ImageFilter.GaussianBlur(0.5))).astype(np.float32)[..., None] / 255
out = P * (1 - alpha) + ink * alpha
Image.fromarray((np.clip(out, 0, 1) * 255).astype(np.uint8)).save(dst, quality=93)
print("ok", dst)
