/*
 * La vieille table : trois planches de chêne patiné, dans la longueur de la scène (en paysage). Le
 * fil du bois de chaque planche est un bruit (feTurbulence) étiré dans le sens de la planche, dont
 * les courbes de niveau font les veines ; une deuxième trame, très fine, fait les pores.
 * Puis les joints entre planches, les aboutements, les clous, un nœud et quelques rayures.
 *
 * Le dessin est le même à chaque ouverture : les tirages « au hasard » viennent d'un générateur à
 * graine fixe, dans un ordre fixe. Il est tracé une fois, au chargement du tour : la table est un décor.
 */

import { Fragment, type VNode } from 'preact';

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

/** Le filtre du bois d'une planche : veines, teinte de la planche, pores. */
function filtreBois(id: string, i: number, hasard: () => number): VNode {
	// Le fil : un bruit très étiré dans la longueur de la planche (horizontale).
	const frequence = `0.0016 ${(0.018 + hasard() * 0.01).toFixed(4)}`;
	// Ses courbes de niveau : une table en dents de scie fait des veines serrées et nettes, comme sur
	// un chêne scié sur dosse ; chaque planche a les siennes.
	const veines = Array.from({ length: 24 }, (_, k) => (k % 2 ? 0.25 + hasard() * 0.25 : 0.8 + hasard() * 0.2).toFixed(2));
	// La teinte : des bruns de vieux chêne ciré, un peu plus clairs ou plus foncés d'une planche à l'autre.
	const t = 0.8 + hasard() * 0.35;
	const r = (v: number): string => (v * t).toFixed(3);
	return (
		<filter key={id} id={id} x={0} y={0} width={1} height={1} color-interpolation-filters="sRGB">
			<feTurbulence type="fractalNoise" baseFrequency={frequence} numOctaves={5} seed={7 + i * 13} result="fil" />
			<feComponentTransfer in="fil" result="veines">
				<feFuncR type="table" tableValues={veines.join(' ')} />
			</feComponentTransfer>
			<feColorMatrix in="veines" type="matrix" values={`${r(0.36)} 0 0 0 ${r(0.15)}  ${r(0.23)} 0 0 0 ${r(0.075)}  ${r(0.12)} 0 0 0 ${r(0.028)}  0 0 0 0 1`} result="bois" />
			{/* Les pores : une trame très fine, sombre, en petits traits dans le sens du fil. */}
			<feTurbulence type="fractalNoise" baseFrequency="0.018 0.7" numOctaves={2} seed={101 + i} result="trame" />
			<feColorMatrix in="trame" type="matrix" values="0 0 0 0 .05  0 0 0 0 .025  0 0 0 0 .01  -1.5 0 0 0 .95" result="pores" />
			<feComposite in="pores" in2="bois" operator="over" />
		</filter>
	);
}

/** Le dessin de la table : les tirages se font dans le même ordre que les éléments. */
function dessiner(): VNode {
	const hasard = generateur(1845);
	const filtres: VNode[] = [];
	const planches: VNode[] = [];

	for (let i = 0; i < PLANCHES; i++) {
		const y = i * LARGEUR;
		const id = `bois-${i}`;
		filtres.push(filtreBois(id, i, hasard));

		// Un aboutement : la planche est faite de deux longueurs, jointes à un endroit différent pour
		// chaque planche, avec deux clous de part et d'autre.
		const x = 12 + hasard() * 76;
		const clous: VNode[] = [];
		for (const dx of [-1, 1]) {
			for (const dy of [0.22, 0.78]) {
				clous.push(
					<Fragment key={`${dx}-${dy}`}>
						<circle cx={`${x + dx}%`} cy={`${y + LARGEUR * dy}%`} r={3.2} fill="#120a06" />
						<circle cx={`${x + dx}%`} cy={`${y + LARGEUR * dy}%`} r={1.4} fill="#5b4a3a" opacity={0.6} transform="translate(-.8 -.8)" />
					</Fragment>,
				);
			}
		}
		planches.push(
			<Fragment key={id}>
				<rect x={0} y={`${y}%`} width="100%" height={`${LARGEUR}%`} filter={`url(#${id})`} />
				<line x1={`${x}%`} x2={`${x}%`} y1={`${y}%`} y2={`${y + LARGEUR}%`} stroke="#0d0602" stroke-width={2.5} stroke-opacity={0.85} />
				<line x1={`${x}%`} x2={`${x}%`} y1={`${y}%`} y2={`${y + LARGEUR}%`} stroke="#c79a64" stroke-width={1} stroke-opacity={0.12} transform="translate(2 0)" />
				{clous}
			</Fragment>,
		);
	}

	// Les joints entre planches : un creux sombre, et le chant de la planche voisine qui accroche la lumière.
	const joints: VNode[] = [];
	for (let i = 1; i < PLANCHES; i++) {
		const y = `${i * LARGEUR}%`;
		joints.push(
			<Fragment key={i}>
				<line x1={0} x2="100%" y1={y} y2={y} stroke="#0a0402" stroke-width={4} />
				<line x1={0} x2="100%" y1={y} y2={y} stroke="#d1a46c" stroke-width={1} stroke-opacity={0.16} transform="translate(0 2.5)" />
			</Fragment>,
		);
	}

	// Les rayures d'un siècle de service : de fins traits clairs, presque invisibles.
	const rayures: VNode[] = [];
	for (let k = 0; k < 26; k++) {
		const x1 = hasard() * 100;
		const y1 = hasard() * 100;
		const angle = (hasard() - 0.5) * 2.2;
		const longueur = 3 + hasard() * 14;
		const largeur = 0.6 + hasard() * 0.6;
		const opacite = (0.04 + hasard() * 0.08).toFixed(3);
		rayures.push(
			<line
				key={k}
				x1={`${x1}%`}
				y1={`${y1}%`}
				x2={`${(x1 + Math.cos(angle) * longueur * 0.55).toFixed(2)}%`}
				y2={`${(y1 + Math.sin(angle) * longueur).toFixed(2)}%`}
				stroke="#e8c89a"
				stroke-width={largeur}
				stroke-opacity={opacite}
				stroke-linecap="round"
			/>,
		);
	}

	return (
		<svg id="table" aria-hidden="true">
			<defs>
				{/* Le nœud : un œil sombre, étiré dans le sens du fil. */}
				<radialGradient id="noeud">
					<stop offset={0} stop-color="#1a0c05" stop-opacity={0.95} />
					<stop offset={0.35} stop-color="#3a1d0b" stop-opacity={0.75} />
					<stop offset={0.6} stop-color="#2a1407" stop-opacity={0.35} />
					<stop offset={1} stop-color="#2a1407" stop-opacity={0} />
				</radialGradient>
				{filtres}
			</defs>
			{planches}
			{/* Un nœud sur la planche du bas, loin de la carte. */}
			<ellipse cx="88%" cy={`${LARGEUR * 2.6}%`} rx="3.8%" ry="3.2%" fill="url(#noeud)" />
			{joints}
			{rayures}
		</svg>
	);
}

const TABLE = dessiner();

export function Table() {
	return TABLE;
}
