/*
 * Un dessin en pixels (content/pixels.ts) devenu SVG : un carré par pixel, les pixels voisins de
 * même couleur regroupés en une seule bande pour alléger le dessin. Net à toutes les tailles.
 */

import { useMemo } from 'preact/hooks';
import { PALETTE } from '../content/pixels.ts';

interface Bande {
	x: number;
	y: number;
	largeur: number;
	couleur: string;
}

/** Les bandes de pixels de même couleur, ligne par ligne (les pixels vides « . » sont sautés). */
export function bandes(grille: readonly string[]): Bande[] {
	const resultat: Bande[] = [];
	grille.forEach((ligne, y) => {
		let x = 0;
		while (x < ligne.length) {
			const c = ligne[x]!;
			let fin = x + 1;
			while (fin < ligne.length && ligne[fin] === c) fin++;
			if (c !== '.') resultat.push({ x, y, largeur: fin - x, couleur: PALETTE[c] ?? 'currentColor' });
			x = fin;
		}
	});
	return resultat;
}

export function PixelArt({ grille, className }: { grille: readonly string[]; className: string }) {
	const largeur = Math.max(...grille.map((ligne) => ligne.length));
	const rects = useMemo(() => bandes(grille), [grille]);
	return (
		// Pas d'anticrénelage : chaque pixel garde ses bords francs.
		<svg viewBox={`0 0 ${largeur} ${grille.length}`} className={className} aria-hidden="true" shape-rendering="crispEdges">
			{rects.map(({ x, y, largeur: l, couleur }) => (
				<rect key={`${x}-${y}`} x={x} y={y} width={l} height={1} fill={couleur} />
			))}
		</svg>
	);
}
