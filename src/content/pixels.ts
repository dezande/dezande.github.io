/*
 * LES DESSINS EN PIXELS du menu principal : l'icône de chaque tour et l'écrou ⚙ des réglages.
 *
 * Chaque dessin est une grille de 16 × 16 caractères, un par pixel : une lettre de la palette, ou
 * « . » pour un pixel vide. src/pixel.ts en fait un SVG de carrés, net à toutes les tailles.
 * Les tests (tests/logic/pixels.test.ts) vérifient la taille des grilles, les couleurs employées,
 * et que l'écrou est parfaitement symétrique, son trou au centre.
 */

/**
 * La palette, réduite comme sur une console des années 80 (palette « Sweetie 16 », domaine public).
 * « x » prend la couleur du texte : l'écrou suit ainsi la couleur de son bouton.
 */
export const PALETTE = {
	k: '#1a1c2c', // contour, presque noir
	d: '#333c57', // gris bleuté sombre
	S: '#94b0c2', // gris clair
	w: '#f4f4f4', // blanc
	p: '#5d275d', // prune
	r: '#b13e53', // rouge
	o: '#ef7d57', // orange
	y: '#ffcd75', // or
	g: '#38b764', // vert
	B: '#3b5dc9', // bleu
	c: '#41a6f6', // bleu ciel
	C: '#73eff7', // cyan
	x: 'currentColor',
} as const;

export type Couleur = keyof typeof PALETTE;

/** Taille des grilles, en pixels. */
export const TAILLE = 16;

/** L'icône de chaque tour, par dossier (content/tours.ts). */
export const ICONES: Readonly<Record<string, readonly string[]>> = {
	// La boule de cristal sur son pied doré, un reflet en haut à gauche.
	'boule-de-cristal': [
		'................',
		'.....kkkkkk.....',
		'...kkpBBBBpkk...',
		'..kpBBBBBBBBpk..',
		'..kBBwcBBBBBBk..',
		'.kpBwcBBBBBBBpk.',
		'.kBBcBBBBBBBBBk.',
		'.kBBBBBBBBBcBBk.',
		'.kpBBBBBBBccBpk.',
		'..kpBBBBBBBBpk..',
		'..kkpBBBBBBpkk..',
		'....kkpppkkk....',
		'.....kyyyyk.....',
		'......kyyk......',
		'...kkkyyyykkk...',
		'...kyyyyyyyyk...',
	],
	// La carte écrite à la main, et la pièce de 20 centimes qui dépasse.
	'pile-ou-face': [
		'................',
		'.kkkkkkkkkkkk...',
		'.kwwwwwwwwwwk...',
		'.kwSSwSSSSwwk...',
		'.kwwwwwwwwwwk...',
		'.kwwwSSSwwwwk...',
		'.kwwwwwwwwwwk...',
		'.kwSSSSSSSSwk...',
		'.kwwwkkkkwwwkkk.',
		'.kwwkyyyykwkyyk.',
		'.kwkyyoyoykkyyk.',
		'.kwkyoyoyykyyyk.',
		'.kwkyyoyoykyyyk.',
		'.kwwkyyyykwkyyk.',
		'.kkkkkkkkkkkkk..',
		'................',
	],
	// Deux dos rouges en éventail, la carte du dessus retournée, écrite.
	'six-predictions': [
		'................',
		'.kkkkk..........',
		'.krrrkkkkk......',
		'.krwrrrrrkkkkkk.',
		'.krrrkrwrrkwwwk.',
		'.krwrkrrrkwwwwk.',
		'.krrrkrwrkwSSwk.',
		'.krwrkrrrkwwwwk.',
		'.krrrkrwrkwSSwk.',
		'.kkkkkrrrkwwwwk.',
		'....kkrwrkwSwwk.',
		'......kkkkwwwwk.',
		'.........kwwwwk.',
		'.........kkkkkk.',
		'................',
		'................',
	],
	// Le pique blanc de l'analyseur, dans l'orbite orange de ses ondes.
	'analyseur-q': [
		'................',
		'......kkkk......',
		'...oo.kwwk.oo...',
		'..o..kwwwwk..o..',
		'.o..kwwwwwwk..o.',
		'.o.kwwwwwwwwk.o.',
		'o..kwwwwwwwwk..o',
		'o..kkwwkkwwkk..o',
		'o...kkkwwkkk...o',
		'.o.....kk.....o.',
		'.o....kwwk....o.',
		'..o..kkkkkk..o..',
		'...oo......oo...',
		'.....oooooo.....',
		'................',
		'................',
	],
};

/**
 * L'écrou ⚙ des réglages : huit dents autour d'un trou de 4 × 4 pixels, au centre exact de la
 * grille. Calculé pour être symétrique dans tous les sens, et non dessiné à la main.
 */
export const ECROU: readonly string[] = [
	'......xxxx......',
	'......xxxx......',
	'..xxx.xxxx.xxx..',
	'..xxxxxxxxxxxx..',
	'..xxxxxxxxxxxx..',
	'...xxxxxxxxxx...',
	'xxxxxx....xxxxxx',
	'xxxxxx....xxxxxx',
	'xxxxxx....xxxxxx',
	'xxxxxx....xxxxxx',
	'...xxxxxxxxxx...',
	'..xxxxxxxxxxxx..',
	'..xxxxxxxxxxxx..',
	'..xxx.xxxx.xxx..',
	'......xxxx......',
	'......xxxx......',
];
