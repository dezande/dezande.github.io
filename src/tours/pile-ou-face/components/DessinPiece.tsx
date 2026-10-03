/*
 * La pièce de 20 centimes d'euro, dessinée à la main sous la prédiction, du côté annoncé :
 *   pile  le côté commun, celui de la valeur : un grand « 20 », « EURO CENT », la carte de
 *         l'Europe et les traits étoilés ;
 *   face  le côté français : la Semeuse qui marche dans le soleil levant, « RF » et les douze
 *         étoiles.
 *
 * Ce n'est pas une gravure mais un croquis au stylo, de la même encre que la prédiction
 * (`currentColor`) : le bord est repassé deux fois sans jamais retomber tout à fait au même
 * endroit, et un léger tremblé (filtre SVG) fait vibrer chaque trait comme une main qui dessine.
 * La pièce a le bord de la vraie : un cercle marqué de sept encoches (la « fleur espagnole »).
 *
 * Le repère fait 100 × 100 ; la pièce grandit avec la prédiction (styles/tours/pile-ou-face/_cartes.scss :
 * .piece).
 */

import type { Cote } from '../logic/piece.ts';

/** Tirage déterministe entre -1 et 1 : le même dessin à chaque fois, mais jamais tiré à la règle. */
function tremble(graine: number): number {
	const x = Math.sin(graine * 12.9898 + 78.233) * 43758.5453;
	return (x - Math.floor(x)) * 2 - 1;
}

/**
 * Le bord de la pièce : un cercle de rayon `r` creusé de sept encoches, tracé à main levée. Le
 * trait part et revient un peu à côté de son point de départ, comme un vrai coup de stylo.
 */
function bord(r: number, graine: number): string {
	const pas = 140;
	const points: string[] = [];
	const depart = tremble(graine) * 0.4;
	// Une main qui ondule doucement, et non un trait qui grésille : quelques vagues lentes.
	const [p1, p2] = [tremble(graine + 1) * Math.PI, tremble(graine + 2) * Math.PI];
	for (let i = 0; i <= pas + 4; i++) {
		const a = depart + (i / pas) * Math.PI * 2;
		// Sept encoches régulières, en creux arrondi.
		const encoche = Math.cos((a - Math.PI / 2) * 7);
		const creux = encoche > 0.82 ? Math.sin(((encoche - 0.82) / 0.18) * (Math.PI / 2)) * 2.2 : 0;
		const main = Math.sin(a * 3 + p1) * 0.45 + Math.sin(a * 5 + p2) * 0.25;
		const rayon = r - creux + main + (i / pas) * 0.6;
		points.push(`${(50 + Math.cos(a) * rayon).toFixed(2)} ${(50 + Math.sin(a) * rayon).toFixed(2)}`);
	}
	return `M${points.join('L')}`;
}

/** Une petite étoile à cinq branches, tracée d'un seul trait, centrée en (x, y). */
function etoile(x: number, y: number, taille: number, graine: number): string {
	const points: string[] = [];
	for (let i = 0; i <= 5; i++) {
		const a = -Math.PI / 2 + (i * 4 * Math.PI) / 5 + tremble(graine + i) * 0.08;
		points.push(`${(x + Math.cos(a) * taille).toFixed(2)} ${(y + Math.sin(a) * taille).toFixed(2)}`);
	}
	return `M${points.join('L')}`;
}

/** Côté pile : la valeur, la carte de l'Europe et les traits étoilés. */
const PILE: readonly string[] = [
	// La carte de l'Europe, esquissée en haut à gauche : la côte, la Scandinavie, la botte de l'Italie.
	'M23 38C26 35 29 36 31 33C33 30 36 32 38 29C40 27 43 28 45 25',
	'M36 30C37 27 39 24 42 22C44 24 43 27 45 27',
	'M29 40C31 39 34 40 35 38C37 40 38 41 39 44',
	// Les traits qui traversent la pièce, côté droit.
	'M68 21L73 76',
	'M72 21L77 73',
	'M76 23L80 69',
	'M80 27L83 62',
];

/** Côté face : la Semeuse dans le soleil levant. */
const FACE: readonly string[] = [
	// Le soleil levant, derrière elle, et ses rayons.
	'M54 66C55 57 62 51 70 52C76 53 80 58 80 64',
	'M67 49L66 44', 'M75 51L77 46', 'M60 52L57 48', 'M81 56L85 53',
	// Le sol labouré.
	'M20 67C32 65 46 67 58 66C66 65 74 67 82 66',
	'M26 71C36 70 44 72 52 71',
	// La tête, coiffée du bonnet phrygien.
	'M39 26C37 29 38 33 41 34C44 35 46 32 45 29C44 26 41 25 39 26Z',
	'M38 27C38 23 41 21 45 22C47 22 49 24 48 26C46 25 44 26 45 28',
	// Les cheveux au vent.
	'M45 30C48 31 50 30 52 32',
	// Le buste et la robe qui flotte vers l'arrière.
	'M41 35C40 40 41 45 39 50C37 55 35 59 33 64',
	'M43 35C46 41 49 46 53 50C56 53 58 57 57 63',
	'M37 55C42 56 47 57 53 56',
	// Le bras qui lance les graines, et les graines.
	'M43 38C49 37 55 38 60 35',
	'M62 33L63 33', 'M64 36L65 36', 'M61 38L62 38',
	// Le bras qui tient le sac de graines.
	'M41 38C38 42 36 45 35 48C37 50 40 49 41 46',
	// Les jambes, en marche vers la gauche.
	'M38 64L35 69', 'M50 63L54 69',
];

/** Un groupe de traits à l'encre de la carte. */
function Traits({ chemins, epaisseur }: { chemins: readonly string[]; epaisseur: number }) {
	return (
		<g fill="none" stroke="currentColor" stroke-width={epaisseur} stroke-linecap="round" stroke-linejoin="round">
			{chemins.map((d, i) => <path key={i} d={d} />)}
		</g>
	);
}

/** Une inscription, écrite à la main dans la police de la prédiction. */
function Inscription({ texte, x, y, taille }: { texte: string; x: number; y: number; taille: number }) {
	return <text x={x} y={y} font-size={taille} font-family="Caveat, cursive" font-weight="700" text-anchor="middle" fill="currentColor">{texte}</text>;
}

/** Les douze étoiles de l'Europe, sur l'anneau entre le listel et le bord (côté face). */
const ETOILES_FACE = Array.from({ length: 12 }, (_, i) => {
	const a = -Math.PI / 2 + (i * Math.PI * 2) / 12;
	return etoile(50 + Math.cos(a) * 42.7, 50 + Math.sin(a) * 42.7, 1.9, i * 3);
});

/** La pièce de 20 centimes, côté `cote`, à poser sous la prédiction. */
export function DessinPiece({ cote }: { cote: Cote }) {
	/*
	 * Le tremblé de la main : un bruit fin qui déplace chaque trait d'un demi-point. Un identifiant
	 * par côté, les deux dessins pouvant exister en même temps (aperçus, tests).
	 */
	const filtre = `main-${cote}`;
	return (
		<svg className="piece" viewBox="0 0 100 100" aria-hidden="true" data-cote={cote}>
			<defs>
				<filter id={filtre} x="-5%" y="-5%" width="110%" height="110%">
					<feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves={2} seed={7} result="bruit" />
					<feDisplacementMap in="SourceGraphic" in2="bruit" scale={1.1} />
				</filter>
			</defs>
			<g filter={`url(#${filtre})`}>
				{/* Le bord, repassé deux fois, et le listel intérieur. */}
				<Traits chemins={[bord(46, 1), bord(45.3, 9)]} epaisseur={1.4} />
				<Traits chemins={[bord(39.5, 4)]} epaisseur={0.9} />
				{cote === 'pile' ? (
					<>
						<Traits chemins={PILE} epaisseur={1.3} />
						<Traits chemins={[etoile(73, 81, 2.2, 3), etoile(77.5, 78, 2.2, 5), etoile(81, 73.5, 2.2, 8), etoile(84, 67, 2.2, 11)]} epaisseur={0.8} />
						<Inscription texte="20" x={38} y={76} taille={32} />
						<Inscription texte="EURO" x={56} y={41} taille={8.5} />
						<Inscription texte="CENT" x={56} y={50} taille={8.5} />
					</>
				) : (
					<>
						<Traits chemins={FACE} epaisseur={1.3} />
						<Traits chemins={ETOILES_FACE} epaisseur={0.8} />
						<Inscription texte="RF" x={24} y={47} taille={10} />
						<Inscription texte="2026" x={50} y={82} taille={8} />
					</>
				)}
			</g>
		</svg>
	);
}
