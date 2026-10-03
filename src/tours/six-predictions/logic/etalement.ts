/*
 * L'étalement du paquet : de combien chaque carte du dessous dépasse de sa voisine, et de quel
 * biais elle est posée. Fonctions pures, sans DOM : testées sous Node (tests/logic/etalement.test.ts).
 *
 * Un paquet étalé à la main n'est jamais régulier : les écarts sont inégaux, les cartes un peu de
 * travers. On tire donc ces écarts au sort — mais à partir d'un semis, pour que le même paquet
 * reste le même tant qu'on ne le remet pas (un rechargement de la page en pleine routine ne doit
 * pas redistribuer les cartes sous les yeux du public).
 *
 * Les écarts sont ensuite ramenés à leur somme exacte : la pile occupe toujours la même hauteur,
 * quelle que soit la façon dont le hasard l'a répartie. C'est ce qui permet à styles/_cartes.scss
 * de calculer une bonne fois la place qu'il lui faut sans jamais déborder de l'écran.
 *
 * Ces écarts valent pour une carte, et pour elle seule : une carte posée là y reste jusqu'à ce
 * qu'elle sorte du cadre. Quand celle du dessus s'envole, les autres ne remontent pas — c'est un
 * paquet étalé sur une table, pas une pile qui se tasse. La première carte, elle, est toujours
 * posée bien droite : c'est celle par laquelle la routine commence.
 */

/** Ce qui décale une carte par rapport à la première du paquet. */
export interface Cran {
	/** Descente, en nombre de crans d'étalement (0 pour la première carte). */
	dy: number;
	/** Décalage latéral, en pixels. */
	dx: number;
	/** Inclinaison, en degrés. */
	rot: number;
}

/** Écart le plus serré et le plus large entre deux cartes voisines, en parts d'un cran moyen. */
const ECART = { min: .5, max: 1.5 } as const;
/** Décalage latéral maximal d'une carte, en pixels. */
const DX_MAX = 8;
/** Écart d'inclinaison maximal d'une carte, en degrés, en plus de la pente régulière. */
const ROT_MAX = 1.8;
/** Pente d'ensemble de la pile : chaque cran penche un peu plus, en degrés. */
const PENTE = -.4;

/** Tirage déterministe entre 0 et 1, à partir d'un semis et d'un rang (mulberry32). */
function alea(semis: number, rang: number): number {
	let x = (semis + rang * 0x9e3779b9) >>> 0;
	x = (x + 0x6d2b79f5) >>> 0;
	let t = Math.imul(x ^ (x >>> 15), 1 | x);
	t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
	return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** Un semis au hasard, pour un paquet qu'on vient de remettre. */
export const nouveauSemis = (): number => Math.floor(Math.random() * 0x100000000);

/**
 * Les écarts des `nombre` cartes du paquet, de la première à celle du fond. La première est
 * toujours droite, les suivantes descendent sans jamais remonter, et la dernière est exactement à
 * `nombre - 1` crans : le hasard change la répartition, jamais la hauteur totale.
 */
export function crans(semis: number, nombre: number): Cran[] {
	if (nombre <= 0) return [];
	const liste: Cran[] = [{ dy: 0, dx: 0, rot: 0 }];
	if (nombre === 1) return liste;

	// Un écart tiré au sort par intervalle, puis ramenés ensemble à la hauteur voulue.
	const ecarts: number[] = [];
	for (let carte = 1; carte < nombre; carte++) {
		ecarts.push(ECART.min + alea(semis, carte) * (ECART.max - ECART.min));
	}
	const total = ecarts.reduce((somme, ecart) => somme + ecart, 0);
	const facteur = (nombre - 1) / total;

	let dy = 0;
	for (let carte = 1; carte < nombre; carte++) {
		dy += ecarts[carte - 1]! * facteur;
		liste.push({
			dy,
			dx: (alea(semis, carte + 1000) * 2 - 1) * DX_MAX,
			rot: PENTE * dy + (alea(semis, carte + 2000) * 2 - 1) * ROT_MAX,
		});
	}
	return liste;
}
