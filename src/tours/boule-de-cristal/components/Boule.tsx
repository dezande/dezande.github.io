/*
 * L'autel : halos, sol, la boule de cristal et son socle. Le nombre émerge de la brume.
 * Classes d'état (styles/tours/boule-de-cristal/_ball.scss) : .stirring (nombre armé, la brume
 * s'agite), .revealed (nombre affiché) et .instant (retour au repos sans transition) sur l'autel,
 * .shown sur le nombre. Les phases sont tenues par src/hooks/usePhasesZones.ts.
 */

import { useReposSansTransition, type EtatZones } from '../../../hooks/usePhasesZones.ts';
import type { Settings } from '../logic/settings.ts';

interface Props {
	etat: EtatZones;
	reglages: Settings;
	/** Appelé une fois l'état de repos appliqué sans transition (.instant retiré). */
	finInstant: () => void;
}

/** Taille du nombre relative à la boule : plus il a de chiffres, plus il est petit. */
function numberScale(value: string): number {
	const length = Array.from(value).length;
	return length <= 2 ? 0.42 : length === 3 ? 0.32 : length === 4 ? 0.25 : 0.2;
}

/**
 * Durée des transitions de la brume et des halos (variable CSS --mist-t), selon la phase : montée
 * lente pendant le délai (rien de perceptible à l'instant du toucher), apparition plus longue que
 * le fondu réglé, disparition au rythme du fondu.
 */
function dureeDeLaBrume(etat: EtatZones, reglages: Settings): number {
	if (etat.phase === 'pending') return Math.max(reglages.delay, 1);
	if (etat.phase === 'shown') return reglages.fade * 1.6;
	return reglages.fade;
}

/** Le socle, dessiné une fois pour toutes. */
const SOCLE = (
	<svg className="base" id="base" viewBox="0 0 240 120" aria-hidden="true">
		<defs>
			<linearGradient id="g-metal" x1="0" x2="1">
				<stop offset="0" stop-color="#040208" />
				<stop offset=".28" stop-color="#1d1030" />
				<stop offset=".42" stop-color="#3a2552" />
				<stop offset=".56" stop-color="#1a0e2b" />
				<stop offset="1" stop-color="#030106" />
			</linearGradient>
			<linearGradient id="g-top" x1="0" x2="1">
				<stop offset="0" stop-color="#07030d" />
				<stop offset=".35" stop-color="#2b1a42" />
				<stop offset=".5" stop-color="#46306a" />
				<stop offset=".7" stop-color="#21133a" />
				<stop offset="1" stop-color="#050209" />
			</linearGradient>
			<radialGradient id="g-lip-glow" cx=".5" cy="0" r=".7">
				<stop offset="0" stop-color="#9a7ce6" stop-opacity=".5" />
				<stop offset="1" stop-color="#9a7ce6" stop-opacity="0" />
			</radialGradient>
			<linearGradient id="g-gold" x1="0" x2="1">
				<stop offset="0" stop-color="#c9a45c" stop-opacity="0" />
				<stop offset=".35" stop-color="#ecd092" stop-opacity=".75" />
				<stop offset=".65" stop-color="#c9a45c" stop-opacity=".5" />
				<stop offset="1" stop-color="#c9a45c" stop-opacity="0" />
			</linearGradient>
		</defs>
		<path d="M16 96 L10 106 C50 122 190 122 230 106 L224 96 Z" fill="url(#g-metal)" />
		<ellipse cx="120" cy="96" rx="104" ry="12" fill="url(#g-top)" />
		<path d="M16 96 C56 110 184 110 224 96" fill="none" stroke="url(#g-gold)" stroke-width=".8" />
		<path d="M76 40 C96 50 144 50 164 40 C150 58 136 70 138 94 C128 100 112 100 102 94 C104 70 90 58 76 40 Z" fill="url(#g-metal)" />
		<path d="M14 10 C58 40 182 40 226 10 L216 30 C178 58 62 58 24 30 Z" fill="url(#g-metal)" />
		<path d="M14 10 C58 40 182 40 226 10 L216 30 C178 58 62 58 24 30 Z" fill="url(#g-lip-glow)" />
		<path d="M14 10 C58 40 182 40 226 10" fill="none" stroke="url(#g-gold)" stroke-width="1" />
		<path d="M24 30 C62 58 178 58 216 30" fill="none" stroke="url(#g-gold)" stroke-width=".6" opacity=".6" />
	</svg>
);

export function Boule({ etat, reglages, finInstant }: Props) {
	const autel = useReposSansTransition<HTMLDivElement>(etat.instant, finInstant);

	const classes = ['altar'];
	if (etat.phase === 'pending') classes.push('stirring');
	if (etat.phase === 'shown') classes.push('revealed');
	if (etat.instant) classes.push('instant');

	return (
		<div ref={autel} className={classes.join(' ')} id="altar" style={{ '--mist-t': `${dureeDeLaBrume(etat, reglages)}s` }}>
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
					<div className={etat.phase === 'shown' ? 'number shown' : 'number'} id="number" style={{ '--num-k': String(numberScale(etat.valeur)) }}>
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
