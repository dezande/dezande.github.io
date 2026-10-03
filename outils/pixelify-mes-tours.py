"""
Pixelify Sans, retouchée pour « Mes tours » : deux glyphes redessinés sur la grille de pixels de
la police (environ 91 unités par pixel), le reste inchangé.

  « 5 »  dans Pixelify Sans, il ressemble à un « S » : redessiné en 5 classique, barre du haut
         droite et ventre en bas ;
  « î »  son accent d'un demi-pixel collé à la lettre ne se voyait pas : un vrai chevron de trois
         pixels au-dessus de la lettre.

La police est variable (graisse 400 à 700) : ces deux glyphes perdent leurs variations et restent
en graisse normale — le menu ne les écrit qu'en graisse normale.

Pixelify Sans est sous licence SIL OFL 1.1, sans nom de police réservé : la modifier est permis.
Le fichier modifié porte un autre nom (pixelify-sans-mes-tours.woff2) et sa version le signale.

Usage (il faut fontTools et brotli : pip install fonttools brotli) :
    python3 outils/pixelify-mes-tours.py public/fonts/pixelify-sans-latin.woff2 public/fonts/pixelify-sans-mes-tours.woff2
"""
import sys
from fontTools.ttLib import TTFont
from fontTools.pens.ttGlyphPen import TTGlyphPen

source, cible = sys.argv[1], sys.argv[2]
f = TTFont(source)
glyf, hmtx = f['glyf'], f['hmtx']


def carre(pen, x0, y0, x1, y1):
	"""Un pixel (ou une bande) plein, contour dans le sens des aiguilles d'une montre (TrueType)."""
	pen.moveTo((x0, y0))
	pen.lineTo((x0, y1))
	pen.lineTo((x1, y1))
	pen.lineTo((x1, y0))
	pen.closePath()


# ---------- « 5 » : 5 colonnes × 7 lignes, sur la grille des chiffres de la police ----------
CINQ = [  # du haut vers le bas
	'#####',
	'#....',
	'####.',
	'....#',
	'....#',
	'#...#',
	'.###.',
]
X = [60, 151, 242, 333, 424, 525]                                   # bords des colonnes
Y = [round(-12 + r * (643 / 7)) for r in range(8)]                    # bords des lignes, -12 à 631
pen = TTGlyphPen(None)
for i, ligne in enumerate(CINQ):
	r = 6 - i
	c = 0
	while c < 5:
		if ligne[c] == '#':
			fin = c
			while fin + 1 < 5 and ligne[fin + 1] == '#':
				fin += 1
			carre(pen, X[c], Y[r], X[fin + 1], Y[r + 1])
			c = fin + 1
		else:
			c += 1
glyf['five'] = pen.glyph()
hmtx['five'] = (hmtx['five'][0], 60)

# ---------- « î » : la tige de « ı », et un chevron de trois pixels au-dessus ----------
D = 45  # décalage de la tige, pour laisser la place au chevron de chaque côté
pen = TTGlyphPen(None)
carre(pen, 60 + D, -12, 161 + D, 450)            # la tige, comme celle de « i »
carre(pen, 60 + D - 91, 540, 60 + D, 631)        # le chevron : pixel de gauche…
carre(pen, 161 + D, 540, 161 + D + 91, 631)      # … pixel de droite …
carre(pen, 60 + D, 631, 161 + D, 722)            # … et la pointe au milieu
glyf['icircumflex'] = pen.glyph()
hmtx['icircumflex'] = (222 + 2 * D, 60 + D - 91)

# Ces deux glyphes n'ont plus les mêmes points : leurs variations de graisse ne s'appliquent plus.
for nom in ('five', 'icircumflex'):
	f['gvar'].variations[nom] = []

# La version dit que la police a été retouchée.
for rec in f['name'].names:
	if rec.nameID == 5:
		rec.string = rec.toUnicode() + '; 5 et î redessinés pour Mes tours'

f.flavor = 'woff2'
f.save(cible)
print('écrit', cible)
