"""
Les icônes PNG de l'app (public/icons/), rendues pixel pour pixel depuis src/assets/icons/icon.svg.

Le dessin fait 80 × 80 pixels d'art. Il est agrandi un nombre entier de fois — × 6 pour l'icône de
512, × 2 pour celle de 192 —, sans lissage : chaque pixel reste un carré net. Une marge de la
couleur du fond complète jusqu'à la taille voulue. Les PNG sont enregistrés en palette (le dessin a
moins de 256 couleurs) : plus légers, sans aucune perte.

Les captures de la fiche d'installation (public/captures/) sont, elles, prises dans Chrome : voir le
README, « Icônes et captures ».

Usage (il faut Pillow : pip install pillow) : python3 outils/icones-png.py
"""
import re
from PIL import Image, ImageDraw

svg = open('src/assets/icons/icon.svg', encoding='utf-8').read()
taille = int(re.search(r'viewBox="0 0 (\d+) \d+"', svg).group(1))
art = Image.new('RGB', (taille, taille))
dessin = ImageDraw.Draw(art)
for x, y, l, h, couleur in re.findall(r'<rect(?: x="(\d+)" y="(\d+)")? width="(\d+)" height="(\d+)" fill="(#[0-9a-fA-F]{6})"/>', svg):
	x, y = int(x or 0), int(y or 0)
	dessin.rectangle([x, y, x + int(l) - 1, y + int(h) - 1], fill=couleur)
fond = art.getpixel((0, 0))

for cote, facteur in ((512, 6), (192, 2)):
	agrandi = art.resize((taille * facteur, taille * facteur), Image.NEAREST)
	icone = Image.new('RGB', (cote, cote), fond)
	marge = (cote - agrandi.width) // 2
	icone.paste(agrandi, (marge, marge))
	# Palette exacte : une entrée par couleur du dessin, aucune couleur rapprochée d'une autre.
	couleurs = [c for _, c in icone.getcolors(1 << 16)]
	assert len(couleurs) <= 256, len(couleurs)
	indice = {c: i for i, c in enumerate(couleurs)}
	pixels = list(getattr(icone, 'get_flattened_data', icone.getdata)())
	en_palette = Image.new('P', icone.size)
	en_palette.putpalette([v for c in couleurs for v in c])
	en_palette.putdata([indice[c] for c in pixels])
	relu = en_palette.convert('RGB')
	assert list(getattr(relu, 'get_flattened_data', relu.getdata)()) == pixels, 'perte de couleurs'
	en_palette.save(f'public/icons/icon-{cote}.png', optimize=True)
	print(f'icon-{cote}.png : {len(couleurs)} couleurs, sans perte')
