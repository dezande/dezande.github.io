/* Particules dorées qui montent lentement sur la scène (animations dans _stage.scss). */

import { useState, type CSSProperties } from 'react';

const random = (min: number, max: number): number => min + Math.random() * (max - min);

/** Une particule : position, taille et rythme aléatoires. */
function particule(): CSSProperties {
	const duration = random(26, 56);
	return {
		left: `${random(0, 100).toFixed(2)}%`,
		'--s': `${random(1.2, 3.6).toFixed(2)}px`, // taille
		'--dur': `${duration.toFixed(1)}s`, // durée de la montée
		'--delay': `${(-random(0, duration)).toFixed(1)}s`, // négatif : la particule part déjà en cours de montée
		'--dx': `${random(-8, 8).toFixed(2)}vw`, // amplitude du balancement horizontal
		'--tw': `${random(3, 8).toFixed(1)}s`, // rythme du scintillement
		'--o': random(0.35, 0.85).toFixed(2), // opacité maximale
	} as CSSProperties;
}

/** `nombre` particules, tirées une fois à l'ouverture du tour. */
export function Poussiere({ nombre }: { nombre: number }) {
	const [particules] = useState(() => Array.from({ length: nombre }, particule));
	return (
		<div id="dust">
			{particules.map((style, i) => <i key={i} className="mote" style={style} />)}
		</div>
	);
}
