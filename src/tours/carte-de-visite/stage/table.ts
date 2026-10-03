/*
 * La vieille table : trois planches de chêne patiné, dans la longueur de la scène (en paysage),
 * dessinées une fois au démarrage dans le SVG #table. Le fil du bois de chaque planche est un bruit
 * (feTurbulence) étiré dans le sens de la planche, dont les courbes de niveau font les veines ; une deuxième trame, très fine, fait les pores.
 * Puis les joints entre planches, les aboutements, les clous, un nœud et quelques rayures.
 *
 * Le dessin est le même à chaque ouverture : les tirages « au hasard » viennent d'un générateur à
 * graine fixe. Rien ne bouge ensuite : la table est un décor.
 */

import { $ } from '../system/dom.ts';

const SVG_NS = 'http://www.w3.org/2000/svg';
const PLANCHES = 3;
/** Largeur d'une planche, en pourcentage de la hauteur de la scène. */
const LARGEUR = 100 / PLANCHES;

/** Générateur pseudo-aléatoire à graine fixe (mulberry32) : la même table à chaque fois. */
function generateur(graine: number): () => number {
	let a = graine >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

function el<K extends keyof SVGElementTagNameMap>(nom: K, attributs: Record<string, string | number>, parent?: Element): SVGElementTagNameMap[K] {
	const e = document.createElementNS(SVG_NS, nom);
	for (const [cle, valeur] of Object.entries(attributs)) e.setAttribute(cle, String(valeur));
	parent?.append(e);
	return e;
}

/** Le filtre du bois d'une planche : veines, teinte de la planche, pores. */
function filtreBois(defs: Element, i: number, hasard: () => number): string {
	const id = `bois-${i}`;
	const f = el('filter', { id, x: 0, y: 0, width: 1, height: 1, 'color-interpolation-filters': 'sRGB' }, defs);
	// Le fil : un bruit très étiré dans la longueur de la planche (horizontale).
	el('feTurbulence', { type: 'fractalNoise', baseFrequency: `0.0016 ${(0.018 + hasard() * 0.01).toFixed(4)}`, numOctaves: 5, seed: 7 + i * 13, result: 'fil' }, f);
	// Ses courbes de niveau : une table en dents de scie fait des veines serrées et nettes, comme sur
	// un chêne scié sur dosse ; chaque planche a les siennes.
	const veines = Array.from({ length: 24 }, (_, k) => (k % 2 ? 0.25 + hasard() * 0.25 : 0.8 + hasard() * 0.2).toFixed(2));
	const transfert = el('feComponentTransfer', { in: 'fil', result: 'veines' }, f);
	el('feFuncR', { type: 'table', tableValues: veines.join(' ') }, transfert);
	// La teinte : des bruns de vieux chêne ciré, un peu plus clairs ou plus foncés d'une planche à l'autre.
	const t = 0.8 + hasard() * 0.35;
	const r = (v: number): string => (v * t).toFixed(3);
	el('feColorMatrix', {
		in: 'veines',
		type: 'matrix',
		values: `${r(0.36)} 0 0 0 ${r(0.15)}  ${r(0.23)} 0 0 0 ${r(0.075)}  ${r(0.12)} 0 0 0 ${r(0.028)}  0 0 0 0 1`,
		result: 'bois',
	}, f);
	// Les pores : une trame très fine, sombre, en petits traits dans le sens du fil.
	el('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.018 0.7', numOctaves: 2, seed: 101 + i, result: 'trame' }, f);
	el('feColorMatrix', { in: 'trame', type: 'matrix', values: '0 0 0 0 .05  0 0 0 0 .025  0 0 0 0 .01  -1.5 0 0 0 .95', result: 'pores' }, f);
	el('feComposite', { in: 'pores', in2: 'bois', operator: 'over' }, f);
	return id;
}

/** Dessine la table dans le SVG #table. */
export function dessinerTable(): void {
	const svg = $<SVGSVGElement>('#table');
	const hasard = generateur(1845);
	const defs = el('defs', {}, svg);

	// Le nœud : un œil sombre, étiré dans le sens du fil.
	const noeud = el('radialGradient', { id: 'noeud' }, defs);
	el('stop', { offset: 0, 'stop-color': '#1a0c05', 'stop-opacity': 0.95 }, noeud);
	el('stop', { offset: 0.35, 'stop-color': '#3a1d0b', 'stop-opacity': 0.75 }, noeud);
	el('stop', { offset: 0.6, 'stop-color': '#2a1407', 'stop-opacity': 0.35 }, noeud);
	el('stop', { offset: 1, 'stop-color': '#2a1407', 'stop-opacity': 0 }, noeud);

	for (let i = 0; i < PLANCHES; i++) {
		const y = i * LARGEUR;
		el('rect', { x: 0, y: `${y}%`, width: '100%', height: `${LARGEUR}%`, filter: `url(#${filtreBois(defs, i, hasard)})` }, svg);

		// Un aboutement : la planche est faite de deux longueurs, jointes à un endroit différent pour
		// chaque planche, avec deux clous de part et d'autre.
		const x = 12 + hasard() * 76;
		el('line', { x1: `${x}%`, x2: `${x}%`, y1: `${y}%`, y2: `${y + LARGEUR}%`, stroke: '#0d0602', 'stroke-width': 2.5, 'stroke-opacity': 0.85 }, svg);
		el('line', { x1: `${x}%`, x2: `${x}%`, y1: `${y}%`, y2: `${y + LARGEUR}%`, stroke: '#c79a64', 'stroke-width': 1, 'stroke-opacity': 0.12, transform: 'translate(2 0)' }, svg);
		for (const dx of [-1, 1]) {
			for (const dy of [0.22, 0.78]) {
				el('circle', { cx: `${x + dx}%`, cy: `${y + LARGEUR * dy}%`, r: 3.2, fill: '#120a06' }, svg);
				el('circle', { cx: `${x + dx}%`, cy: `${y + LARGEUR * dy}%`, r: 1.4, fill: '#5b4a3a', opacity: 0.6, transform: 'translate(-.8 -.8)' }, svg);
			}
		}
	}

	// Un nœud sur la planche du bas, loin de la carte.
	el('ellipse', { cx: '88%', cy: `${LARGEUR * 2.6}%`, rx: '3.8%', ry: '3.2%', fill: 'url(#noeud)' }, svg);

	// Les joints entre planches : un creux sombre, et le chant de la planche voisine qui accroche la lumière.
	for (let i = 1; i < PLANCHES; i++) {
		const y = `${i * LARGEUR}%`;
		el('line', { x1: 0, x2: '100%', y1: y, y2: y, stroke: '#0a0402', 'stroke-width': 4 }, svg);
		el('line', { x1: 0, x2: '100%', y1: y, y2: y, stroke: '#d1a46c', 'stroke-width': 1, 'stroke-opacity': 0.16, transform: 'translate(0 2.5)' }, svg);
	}

	// Les rayures d'un siècle de service : de fins traits clairs, presque invisibles.
	for (let k = 0; k < 26; k++) {
		const x1 = hasard() * 100;
		const y1 = hasard() * 100;
		const angle = (hasard() - 0.5) * 2.2;
		const longueur = 3 + hasard() * 14;
		el('line', {
			x1: `${x1}%`,
			y1: `${y1}%`,
			x2: `${(x1 + Math.cos(angle) * longueur * 0.55).toFixed(2)}%`,
			y2: `${(y1 + Math.sin(angle) * longueur).toFixed(2)}%`,
			stroke: '#e8c89a',
			'stroke-width': 0.6 + hasard() * 0.6,
			'stroke-opacity': (0.04 + hasard() * 0.08).toFixed(3),
			'stroke-linecap': 'round',
		}, svg);
	}
}
