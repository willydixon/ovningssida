"""Gör sidans ikoner av en färdig bild, till exempel en bild från en bild-AI.

Körs med: python3 tools/icons-from-image.py design/ikon.png public/icons

Skriptet hittar motivet i bilden, lägger det mitt i en kvadrat och sparar de
storlekar som iPhone, Android och webbläsaren behöver. Där bilden inte räcker
till förlängs bakgrunden med en suddig kopia av bildens egen bakgrund.
"""

import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

# Hur stor del av kvadraten motivets längsta sida får ta, för vanliga ikoner.
MOTIF_SHARE = 0.70
# Android klipper maskable-ikoner till en cirkel med radien 40 % av sidan.
# Motivets hörn ska ligga innanför den, med lite marginal.
SAFE_RADIUS = 0.40 * 0.95


def find_motif(img, threshold=165):
    """Motivets ruta. Bakgrunden är mörkare i grön kanal än motivet.

    Bilden förminskas först, så att små gnistor i bakgrunden inte räknas.
    """
    step = 8
    small = np.asarray(img.resize((img.width // step, img.height // step), Image.BOX))
    ys, xs = np.nonzero(small[:, :, 1] > threshold)
    if not len(xs):
        raise SystemExit('Hittade inget motiv i bilden.')
    return (xs.min() * step, ys.min() * step, (xs.max() + 1) * step, (ys.max() + 1) * step)


def square_around(img, box, side):
    """En kvadrat med sidan side, centrerad på box. Bakgrunden förlängs vid behov."""
    cx, cy = (box[0] + box[2]) / 2, (box[1] + box[3]) / 2
    left, top = round(cx - side / 2), round(cy - side / 2)
    pad = max(0, -left, -top, left + side - img.width, top + side - img.height)

    # Platta: bildens bakgrund, kraftigt suddad och förlängd utåt.
    blurred = np.asarray(img.filter(ImageFilter.GaussianBlur(24)))
    plate = np.pad(blurred, ((pad, pad), (pad, pad), (0, 0)), mode='edge')
    plate = Image.fromarray(plate).filter(ImageFilter.GaussianBlur(24))

    # Originalbilden ovanpå, med mjuka kanter där den tar slut.
    feather = 24 if pad else 0
    mask = Image.new('L', img.size, 0)
    ImageDraw.Draw(mask).rectangle([feather, feather, img.width - 1 - feather, img.height - 1 - feather], fill=255)
    if feather:
        mask = mask.filter(ImageFilter.GaussianBlur(feather / 2))
    plate.paste(img, (pad, pad), mask)
    return plate.crop((left + pad, top + pad, left + pad + side, top + pad + side))


def rounded(square, radius_share=0.22):
    out = square.convert('RGBA')
    mask = Image.new('L', square.size, 0)
    r = round(square.width * radius_share)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, square.width - 1, square.height - 1], radius=r, fill=255)
    out.putalpha(mask)
    return out


def main(src, out_dir):
    img = Image.open(src).convert('RGB')
    box = find_motif(img)
    w, h = box[2] - box[0], box[3] - box[1]

    normal = square_around(img, box, round(max(w, h) / MOTIF_SHARE))
    maskable = square_around(img, box, round(math.hypot(w / 2, h / 2) / SAFE_RADIUS))

    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    size = lambda im, s: im.resize((s, s), Image.LANCZOS)
    size(normal, 180).save(out / 'apple-touch-icon.png', optimize=True)  # iPhone rundar själv
    rounded(size(normal, 512)).save(out / 'icon-512.png', optimize=True)
    rounded(size(normal, 192)).save(out / 'icon-192.png', optimize=True)
    rounded(size(normal, 32)).save(out / 'favicon-32.png', optimize=True)
    size(maskable, 512).save(out / 'icon-maskable-512.png', optimize=True)
    print(f'Motiv {w}x{h} vid {box[:2]}. Sparade fem ikoner i {out}.')


if __name__ == '__main__':
    if len(sys.argv) != 3:
        raise SystemExit('Användning: python3 tools/icons-from-image.py <bild> <mapp>')
    main(sys.argv[1], sys.argv[2])
