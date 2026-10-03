/*
 * Jauge de l'appui long : un anneau qui se remplit sous le doigt jusqu'au retour au menu (appui de
 * 3 s). Elle n'apparaît qu'une fois passée la durée d'un tap, pour qu'un toucher de la routine ne la
 * montre jamais. Masquable dans les réglages de chaque tour : c'est une aide à la répétition, pas un
 * élément de la scène.
 *
 * Le remplissage est une animation CSS (styles/components/_jauge.scss, #hold-ring.run), réglée
 * par --ring-delay et --ring-duration : rien à calculer à chaque image. Chaque appui remonte
 * l'élément (clé `n`), ce qui relance l'animation depuis le début.
 *
 * Un tour ne s'en sert pas directement : l'appui long (hooks/useAppuiLong.ts) tient la jauge, et
 * le tour l'affiche.
 *
 *   const appui = useAppuiLong({ dureeMs: 3000, delaiJaugeMs: 800, jaugeVisible: reglages.showHoldRing });
 *   <JaugeAppui jauge={appui.jauge} />
 */

import { useCallback, useRef, useState, type CSSProperties } from 'react';

export interface Jauge {
	/** Le point touché, dans le repère de #app (kit/web/orientation.ts : appPoint). */
	x: number;
	y: number;
	/** Rien avant ce délai, puis remplissage en `dureeMs`. */
	delaiMs: number;
	dureeMs: number;
	/** Numéro de l'appui : un nouvel appui relance l'animation. */
	n: number;
}

export function useJaugeAppui() {
	const [jauge, setJauge] = useState<Jauge | null>(null);
	const compteur = useRef(0);
	const montrerJauge = useCallback((x: number, y: number, delaiMs: number, dureeMs: number) => {
		compteur.current += 1;
		setJauge({ x, y, delaiMs, dureeMs, n: compteur.current });
	}, []);
	const cacherJauge = useCallback(() => setJauge(null), []);
	return { jauge, montrerJauge, cacherJauge };
}

const ANNEAU = (
	<svg viewBox="0 0 100 100">
		<circle className="track" cx="50" cy="50" r="44" />
		<circle className="fill" cx="50" cy="50" r="44" pathLength="100" />
	</svg>
);

export function JaugeAppui({ jauge }: { jauge: Jauge | null }) {
	if (!jauge) return <div id="hold-ring" aria-hidden="true" hidden>{ANNEAU}</div>;
	const style = {
		left: `${jauge.x}px`,
		top: `${jauge.y}px`,
		'--ring-delay': `${jauge.delaiMs}ms`,
		'--ring-duration': `${jauge.dureeMs}ms`,
	} as CSSProperties;
	return <div key={jauge.n} id="hold-ring" className="run" aria-hidden="true" style={style}>{ANNEAU}</div>;
}
