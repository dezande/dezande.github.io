/*
 * Les dos de cartes, dessinés en SVG (DosDeCarte.tsx) : ceux de Pile ou face et des six prédictions.
 *
 * Six dessins, d'époques et d'esprits différents — Art déco, Art nouveau, pixel art, minimaliste,
 * pop art et futuriste — tracés dans la couleur du réglage, sur le fond du réglage
 * (styles/tours/<dossier>/_cartes.scss). Un dessin vectoriel plutôt qu'une image : il reste net à toutes les
 * tailles d'écran, ne pèse rien dans le cache hors-ligne, et suit la couleur choisie sans qu'on
 * ait à préparer un fichier par combinaison — six dessins fois quatre couleurs feraient
 * vingt-quatre images.
 *
 * Le repère est celui de la carte, marge de papier déduite : 100 de large pour 140 de haut, soit
 * exactement le rapport d'une carte à jouer. Le SVG s'étire jusqu'aux bords (preserveAspectRatio
 * « none ») sans déformer le dessin.
 */

/**
 * Un élément du dessin : son chemin, puis comment il est peint — au trait de `w` d'épaisseur, ou
 * en aplat quand `w` est absent. `o` l'éclaircit, `miroir` le reprend de l'autre côté de la carte
 * (gauche-droite), `retourne` le renvoie de haut en bas.
 *
 * Tous les dos sont symétriques de gauche à droite ET de haut en bas, autour du centre de la carte
 * (50, 70) : une carte retournée tête-bêche montre le même dos.
 */
export interface Trait {
	d: string;
	w?: number;
	o?: number;
	miroir?: true;
	retourne?: true;
}

/** Le tour de la carte : deux filets, l'épais puis le fin. `r` arrondit les coins. */
const cadre = (r: number): Trait[] => [
	{ d: rect(4, 4, 92, 132, r), w: 1.2 },
	{ d: rect(8, 8, 84, 124, Math.max(0, r - 3)), w: .45 },
];

/** Rectangle `x y l h` aux coins arrondis de `r`, en chemin (les mêmes bords que la carte). */
function rect(x: number, y: number, w: number, h: number, r: number): string {
	if (r <= 0) return `M${x} ${y}H${x + w}V${y + h}H${x}Z`;
	return `M${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}`
		+ `V${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}`
		+ `H${x + r}Q${x} ${y + h} ${x} ${y + h - r}`
		+ `V${y + r}Q${x} ${y} ${x + r} ${y}Z`;
}

/* ---------- Art déco : le soleil levant et les degrés ---------- */

/** Rayons d'un soleil, du rayon `de` au rayon `a`, tous les `pas` degrés autour de (cx, cy). */
function rayons(cx: number, cy: number, de: number, a: number, pas: number): string {
	let d = '';
	for (let angle = 0; angle < 360; angle += pas) {
		const rad = (angle * Math.PI) / 180;
		const [dx, dy] = [Math.cos(rad), Math.sin(rad)];
		d += `M${(cx + dx * de).toFixed(2)} ${(cy + dy * de).toFixed(2)}L${(cx + dx * a).toFixed(2)} ${(cy + dy * a).toFixed(2)}`;
	}
	return d;
}

/** Une bande de chevrons entre x=14 et x=86, sur la ligne `y` ; `hauteur` négative les retourne. */
function chevrons(y: number, hauteur: number, largeur: number): string {
	let d = `M14 ${y}`;
	for (let x = 14; x < 86; x += largeur) {
		d += `L${Math.min(x + largeur / 2, 86)} ${y - hauteur}L${Math.min(x + largeur, 86)} ${y}`;
	}
	return d;
}

const DECO: Trait[] = [
	...cadre(0),
	// Escaliers dans les quatre angles : le degré, signature de l'Art déco.
	{ d: 'M12 30V22H20V14H28M88 30V22H80V14H72M12 110V118H20V126H28M88 110V118H80V126H72', w: 1 },
	// Bandes de chevrons, en haut et en bas du médaillon, à la même distance du bord.
	{ d: chevrons(38, 5, 12), w: .7 },
	{ d: chevrons(102, -5, 12), w: .7 },
	// Le soleil levant, au centre de la carte : rayons serrés, puis deux anneaux.
	{ d: rayons(50, 70, 9, 25, 10), w: .5 },
	{ d: 'M50 43A27 27 0 1 1 50 97A27 27 0 1 1 50 43Z', w: 1.2 },
	{ d: 'M50 49A21 21 0 1 1 50 91A21 21 0 1 1 50 49Z', w: .45 },
	// Losange central, à degrés lui aussi.
	{ d: 'M50 60L60 70L50 80L40 70Z', w: 1 },
	{ d: 'M50 65L55 70L50 75L45 70Z', w: .6 },
	// Traits verticaux qui tendent le dessin vers le haut et le bas.
	{ d: 'M50 14V38M50 102V126M44 18V38M56 18V38M44 102V122M56 102V122', w: .45 },
];

/* ---------- Art nouveau : le coup de fouet ---------- */

/** Une tige montante, sa feuille et sa vrille : le motif de base, repris en miroir. */
const BRANCHE: Trait[] = [
	{ d: 'M50 128C50 114 41 107 35 96C29 84 33 74 43 70', w: 1.1 },
	{ d: 'M39 103C27 99 21 87 25 74C35 81 41 92 39 103Z', w: .8 },
	{ d: 'M33 88C24 82 23 71 30 63C34 69 34 77 31 81', w: .5 },
	{ d: 'M45 118C37 117 32 111 31 104', w: .5 },
];

/** Les mêmes traits, renvoyés de l'autre côté de l'axe de la carte. */
const miroir = (traits: Trait[]): Trait[] => traits.map((trait) => ({ ...trait, miroir: true as const }));
/** Les mêmes traits, renvoyés de haut en bas. */
const retourne = (traits: Trait[]): Trait[] => traits.map((trait) => ({ ...trait, retourne: true as const }));

/** Les deux tiges du bas, en miroir l'une de l'autre. */
const TIGES = [...BRANCHE, ...miroir(BRANCHE)];

const NOUVEAU: Trait[] = [
	...cadre(14),
	// Les tiges montent du bas et descendent du haut : un bouquet symétrique autour de la fleur.
	...TIGES,
	...retourne(TIGES),
	// La corolle, au centre de la carte : quatre pétales autour d'un cœur, dans un halo.
	{ d: 'M50 51C57 57 56 66 50 66C44 66 43 57 50 51Z', w: 1 },
	{ d: 'M50 89C43 83 44 74 50 74C56 74 57 83 50 89Z', w: 1 },
	{ d: 'M31 70C37 63 46 64 46 70C46 76 37 77 31 70Z', w: 1 },
	{ d: 'M69 70C63 63 54 64 54 70C54 76 63 77 69 70Z', w: 1 },
	{ d: 'M50 66A4 4 0 1 1 50 74A4 4 0 1 1 50 66Z', w: .8 },
	{ d: 'M50 49A21 21 0 1 1 50 91A21 21 0 1 1 50 49Z', w: .45 },
];

/* ---------- Pixel art : le dessin posé case par case ---------- */

/**
 * Une grille de 10 × 14 cases de 10 unités, dessinée d'après un damier écrit en toutes lettres :
 * « # » pose une case pleine, tout le reste la laisse vide. Le dessin se relit donc à l'œil.
 */
function damier(lignes: readonly string[]): string {
	const cote = 10;
	let d = '';
	lignes.forEach((ligne, y) => {
		[...ligne].forEach((case_, x) => {
			if (case_ !== '#') return;
			d += `M${x * cote} ${y * cote}h${cote}v${cote}h${-cote}Z`;
		});
	});
	return d;
}

const PIXEL: Trait[] = [
	{
		d: damier([
			'##########',
			'#........#',
			'#........#',
			'#...##...#',
			'#..#..#..#',
			'#.#....#.#',
			'##..##..##',
			'##..##..##',
			'#.#....#.#',
			'#..#..#..#',
			'#...##...#',
			'#........#',
			'#........#',
			'##########',
		]),
	},
	// Une seconde grille, en retrait, donne au cadre son épaisseur de vieil écran.
	{
		d: damier([
			'..........',
			'.########.',
			'.#......#.',
			'.#......#.',
			'.#......#.',
			'.#......#.',
			'.#......#.',
			'.#......#.',
			'.#......#.',
			'.#......#.',
			'.#......#.',
			'.#......#.',
			'.########.',
			'..........',
		]),
		o: .22,
	},
];

/* ---------- Minimaliste : presque rien ---------- */

const MINIMAL: Trait[] = [
	{ d: rect(10, 10, 80, 120, 0), w: .5 },
	{ d: 'M50 54A16 16 0 1 1 50 86A16 16 0 1 1 50 54Z', w: 1 },
	{ d: 'M50 67A3 3 0 1 1 50 73A3 3 0 1 1 50 67Z' },
];

/* ---------- Pop art : trame de points et étoile d'explosion ---------- */

/**
 * Une trame de points pleins : le tramé des bandes dessinées imprimées. Elle part du centre de la
 * carte (50, 70) dans les deux sens, si bien qu'elle a la même marge en haut et en bas, à gauche et
 * à droite.
 */
function trame(pas: number, rayon: number): string {
	let d = '';
	const lignes = Math.floor((70 - pas / 2) / pas);
	for (let k = -lignes; k <= lignes; k++) {
		const y = 70 + k * pas;
		// Une ligne sur deux est décalée d'un demi-pas : la trame ne fait pas de colonnes.
		const decalage = Math.abs(k) % 2 === 1 ? pas / 2 : 0;
		const colonnes = Math.floor((50 - pas / 2 - decalage) / pas);
		for (let m = -colonnes; m <= colonnes; m++) {
			for (const cx of decalage ? [50 + decalage + m * pas, 50 - decalage - m * pas] : [50 + m * pas]) {
				if (decalage && m < 0) continue;
				d += `M${cx - rayon} ${y}a${rayon} ${rayon} 0 1 0 ${rayon * 2} 0a${rayon} ${rayon} 0 1 0 ${-rayon * 2} 0Z`;
			}
		}
	}
	return d;
}

/**
 * Une étoile d'explosion autour d'un centre, comme un « BOUM » dessiné : une pointe longue, une
 * courte, en alternance. L'alternance garde l'étoile symétrique de haut en bas et de gauche à
 * droite (avec un nombre de pointes multiple de 4).
 */
function explosion(cx: number, cy: number, pointes: number, dedans: number, dehors: number): string {
	let d = '';
	for (let i = 0; i < pointes * 2; i++) {
		const rayon = i % 2 === 0 ? dehors : dedans;
		// Les pointes ne font pas toutes la même longueur : une explosion n'est pas une roue dentée.
		const variation = i % 2 === 0 ? (i / 2) % 2 === 0 ? 1 : .82 : 1;
		const angle = ((i / (pointes * 2)) * 2 - .5) * Math.PI;
		const x = cx + Math.cos(angle) * rayon * variation;
		const y = cy + Math.sin(angle) * rayon * variation;
		d += `${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`;
	}
	return `${d}Z`;
}

const POP: Trait[] = [
	{ d: trame(9, 1.5), o: .35 },
	{ d: rect(4, 4, 92, 132, 2), w: 3 },
	{ d: explosion(50, 70, 12, 14, 31), w: 2.6 },
	{ d: explosion(50, 70, 12, 6, 13), o: .9 },
];

/* ---------- Futuriste : un cadran d'instrument ---------- */

/** Un arc de cercle, de l'angle `de` à l'angle `a` (en degrés, 0 à droite). */
function arc(cx: number, cy: number, r: number, de: number, a: number): string {
	const point = (deg: number): string => {
		const rad = (deg * Math.PI) / 180;
		return `${(cx + Math.cos(rad) * r).toFixed(2)} ${(cy + Math.sin(rad) * r).toFixed(2)}`;
	};
	return `M${point(de)}A${r} ${r} 0 ${a - de > 180 ? 1 : 0} 1 ${point(a)}`;
}

/** Des graduations tout autour d'un cercle, tous les `pas` degrés. */
function graduations(cx: number, cy: number, de: number, a: number, pas: number): string {
	let d = '';
	for (let angle = 0; angle < 360; angle += pas) {
		const rad = (angle * Math.PI) / 180;
		const [dx, dy] = [Math.cos(rad), Math.sin(rad)];
		d += `M${(cx + dx * de).toFixed(2)} ${(cy + dy * de).toFixed(2)}L${(cx + dx * a).toFixed(2)} ${(cy + dy * a).toFixed(2)}`;
	}
	return d;
}

const FUTURISTE: Trait[] = [
	// Un cadre aux angles coupés, comme une plaque de blindage.
	{ d: 'M18 4H82L96 18V122L82 136H18L4 122V18Z', w: 1.2 },
	{ d: 'M22 10H78L90 22V118L78 130H22L10 118V22Z', w: .4 },
	// Équerres de visée dans les quatre coins.
	{ d: 'M14 30V20H24M86 30V20H76M14 110V120H24M86 110V120H76', w: 1 },
	// Cadran : deux arcs ouverts face à face (coupés là où passe la ligne de balayage), un anneau
	// de graduations, et deux arcs intérieurs, eux aussi en vis-à-vis.
	{ d: arc(50, 70, 30, -155, -25), w: 1.4 },
	{ d: arc(50, 70, 30, 25, 155), w: 1.4 },
	{ d: graduations(50, 70, 22, 26, 12), w: .5 },
	{ d: arc(50, 70, 16, -150, -30), w: 2.4 },
	{ d: arc(50, 70, 16, 30, 150), w: 2.4 },
	{ d: 'M50 64A6 6 0 1 1 50 76A6 6 0 1 1 50 64Z' },
	// Ligne de balayage et petits témoins, de part et d'autre du cadran.
	{ d: 'M8 70H16M84 70H92', w: 1 },
	{ d: 'M46 46h8v3h-8ZM46 91h8v3h-8Z' },
];

/** Les dessins de dos, dans l'ordre des réglages. */
export const DESSINS_DE_DOS = ['deco', 'nouveau', 'pixel', 'minimal', 'pop', 'futuriste'] as const;
export type DessinDeDos = (typeof DESSINS_DE_DOS)[number];

export const MOTIFS: Readonly<Record<DessinDeDos, readonly Trait[]>> = {
	deco: DECO,
	nouveau: NOUVEAU,
	pixel: PIXEL,
	minimal: MINIMAL,
	pop: POP,
	futuriste: FUTURISTE,
};
