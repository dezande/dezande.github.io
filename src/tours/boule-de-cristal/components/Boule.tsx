/*
 * L'autel : halos, sol, la boule de cristal et son socle. Le nombre émerge de la brume.
 * Classes d'état (styles/tours/boule-de-cristal/_ball.scss) : .stirring (nombre armé, la brume
 * s'agite), .revealed (nombre affiché) et .instant (retour au repos sans transition) sur l'autel,
 * .shown sur le nombre. Les phases sont tenues par hooks/useBoule.ts.
 */

import { useLayoutEffect, useRef, type CSSProperties } from 'react';
import { numberScale, type EtatBoule } from '../hooks/useBoule.ts';

interface Props {
	etat: EtatBoule;
	/** Appelé une fois l'état de repos appliqué sans transition (.instant retiré). */
	finInstant: () => void;
}

/** Le socle, dessiné une fois pour toutes. */
const SOCLE = (
	<svg className="base" id="base" viewBox="0 0 240 120" aria-hidden="true">
		<defs>
			<linearGradient id="g-metal" x1="0" x2="1">
				<stop offset="0" stopColor="#040208" />
				<stop offset=".28" stopColor="#1d1030" />
				<stop offset=".42" stopColor="#3a2552" />
				<stop offset=".56" stopColor="#1a0e2b" />
				<stop offset="1" stopColor="#030106" />
			</linearGradient>
			<linearGradient id="g-top" x1="0" x2="1">
				<stop offset="0" stopColor="#07030d" />
				<stop offset=".35" stopColor="#2b1a42" />
				<stop offset=".5" stopColor="#46306a" />
				<stop offset=".7" stopColor="#21133a" />
				<stop offset="1" stopColor="#050209" />
			</linearGradient>
			<radialGradient id="g-lip-glow" cx=".5" cy="0" r=".7">
				<stop offset="0" stopColor="#9a7ce6" stopOpacity=".5" />
				<stop offset="1" stopColor="#9a7ce6" stopOpacity="0" />
			</radialGradient>
			<linearGradient id="g-gold" x1="0" x2="1">
				<stop offset="0" stopColor="#c9a45c" stopOpacity="0" />
				<stop offset=".35" stopColor="#ecd092" stopOpacity=".75" />
				<stop offset=".65" stopColor="#c9a45c" stopOpacity=".5" />
				<stop offset="1" stopColor="#c9a45c" stopOpacity="0" />
			</linearGradient>
		</defs>
		<path d="M16 96 L10 106 C50 122 190 122 230 106 L224 96 Z" fill="url(#g-metal)" />
		<ellipse cx="120" cy="96" rx="104" ry="12" fill="url(#g-top)" />
		<path d="M16 96 C56 110 184 110 224 96" fill="none" stroke="url(#g-gold)" strokeWidth=".8" />
		<path d="M76 40 C96 50 144 50 164 40 C150 58 136 70 138 94 C128 100 112 100 102 94 C104 70 90 58 76 40 Z" fill="url(#g-metal)" />
		<path d="M14 10 C58 40 182 40 226 10 L216 30 C178 58 62 58 24 30 Z" fill="url(#g-metal)" />
		<path d="M14 10 C58 40 182 40 226 10 L216 30 C178 58 62 58 24 30 Z" fill="url(#g-lip-glow)" />
		<path d="M14 10 C58 40 182 40 226 10" fill="none" stroke="url(#g-gold)" strokeWidth="1" />
		<path d="M24 30 C62 58 178 58 216 30" fill="none" stroke="url(#g-gold)" strokeWidth=".6" opacity=".6" />
	</svg>
);

export function Boule({ etat, finInstant }: Props) {
	const autel = useRef<HTMLDivElement>(null);

	// .instant coupe les transitions le temps de retirer les classes d'état : la lecture de la mise
	// en page force le navigateur à appliquer l'état sans transition, avant de les réactiver.
	useLayoutEffect(() => {
		if (!etat.instant) return;
		void autel.current?.offsetWidth;
		finInstant();
	}, [etat.instant, finInstant]);

	const classes = ['altar'];
	if (etat.phase === 'pending') classes.push('stirring');
	if (etat.phase === 'shown') classes.push('revealed');
	if (etat.instant) classes.push('instant');

	return (
		<div ref={autel} className={classes.join(' ')} id="altar" style={{ '--mist-t': `${etat.mistT}s` } as CSSProperties}>
			<div className="halo"></div>
			<div className="halo-warm"></div>
			<div className="floor"></div>

			<div className="ball">
				<div className="globe">
					<div className="mist-wrap back">
						<div className="mist m1"></div>
						<div className="mist m2"></div>
					</div>
					<div className="inner-glow"></div>
					<div className="warm-glow"></div>
					<div className={etat.phase === 'shown' ? 'number shown' : 'number'} id="number" style={{ '--num-k': String(numberScale(etat.valeur)) } as CSSProperties}>
						<span id="number-text">{etat.valeur}</span>
					</div>
					<div className="mist-wrap front">
						<div className="mist m3"></div>
					</div>
					<div className="refract"></div>
					<div className="shade"></div>
					<div className="arc"></div>
					<div className="arc-low"></div>
					<div className="specular"></div>
					<div className="glint"></div>
					<div className="rimline"></div>
				</div>
			</div>

			{SOCLE}
		</div>
	);
}
