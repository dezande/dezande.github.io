/*
 * Un dessin en pixels (content/pixels.ts) devenu SVG : un carré par pixel, les pixels voisins de
 * même couleur regroupés en une seule bande pour alléger le dessin. Net à toutes les tailles.
 */

import { PALETTE, TAILLE, type Couleur } from './content/pixels.ts';

const SVG_NS = 'http://www.w3.org/2000/svg';

export function dessinPixel(grille: readonly string[], classe: string): SVGSVGElement {
	const svg = document.createElementNS(SVG_NS, 'svg');
	svg.setAttribute('viewBox', `0 0 ${TAILLE} ${TAILLE}`);
	svg.setAttribute('class', classe);
	svg.setAttribute('aria-hidden', 'true');
	// Pas d'anticrénelage : chaque pixel garde ses bords francs.
	svg.setAttribute('shape-rendering', 'crispEdges');
	grille.forEach((ligne, y) => {
		let x = 0;
		while (x < ligne.length) {
			const c = ligne[x]!;
			let fin = x + 1;
			while (fin < ligne.length && ligne[fin] === c) fin++;
			if (c !== '.') {
				const bande = svg.appendChild(document.createElementNS(SVG_NS, 'rect'));
				bande.setAttribute('x', String(x));
				bande.setAttribute('y', String(y));
				bande.setAttribute('width', String(fin - x));
				bande.setAttribute('height', '1');
				bande.setAttribute('fill', PALETTE[c as Couleur]);
			}
			x = fin;
		}
	});
	return svg;
}
