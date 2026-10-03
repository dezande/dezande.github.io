/*
 * Mode « Test des zones » : limites des 4 coins dessinées sur la scène et barre d'état, pour répéter
 * le tour. Il s'ouvre depuis les réglages (aides à la répétition), scène en paysage.
 * Styles dans _test-mode.scss.
 */

import { useLayoutEffect, useState, type RefObject } from 'react';
import { ZONE_NAMES } from '../content/zones.ts';
import type { Phase } from '../hooks/useCarte.ts';
import { NUMEROS, ZONES } from '../logic/settings.ts';
import { zoneRects } from '../logic/zone-logic.ts';

const PHASE_LABELS: Record<Phase, string> = {
	idle: 'Prêt',
	pending: 'Armé · verrouillé',
	shown: 'Retournée · verrouillé',
	clearing: 'Retour au recto…',
};

/** La dernière zone touchée ; `n` change à chaque toucher, pour relancer le clignotement. */
export interface Eclair {
	index: number;
	n: number;
}

interface Props {
	phase: Phase;
	/** La scène, dont les zones suivent les dimensions. */
	scene: RefObject<HTMLElement | null>;
	eclair: Eclair | null;
	/** Retour aux réglages. */
	surReglages: () => void;
	/** Fermer les réglages : retour au menu. */
	surQuitter: () => void;
}

export function ModeTest({ phase, scene, eclair, surReglages, surQuitter }: Props) {
	// Repère de la scène (pivotée ou non) : #zones est dans #app, comme la scène.
	const [taille, setTaille] = useState({ largeur: 0, hauteur: 0 });
	useLayoutEffect(() => {
		const mesurer = (): void => {
			const element = scene.current;
			if (element) setTaille({ largeur: element.clientWidth, hauteur: element.clientHeight });
		};
		mesurer();
		// Rotation de l'écran, passage en paysage, barre d'adresse qui apparaît… : les zones suivent
		// la scène (hooks/usePaysage.ts relance un « resize » à chaque changement de rotation).
		window.addEventListener('resize', mesurer);
		return () => window.removeEventListener('resize', mesurer);
	}, [scene]);

	return (
		<>
			<div id="zones">
				{zoneRects(taille.largeur, taille.hauteur, ZONES).map((r) => {
					const touchee = eclair?.index === r.index;
					// Colonne de droite : trait vertical et étiquette à droite.
					const classes = ['zone'];
					if (r.left > 0) classes.push('right');
					if (touchee) classes.push('hit');
					return (
						// Une nouvelle clé à chaque toucher relance l'animation, même sur des touchers rapprochés.
						<div key={`${r.index}-${touchee ? eclair.n : 0}`} className={classes.join(' ')} style={{ left: `${r.left}px`, top: `${r.top}px`, width: `${r.right - r.left}px`, height: `${r.bottom - r.top}px` }}>
							<span className="tag">{`${ZONE_NAMES[r.index]} →`}<b>{NUMEROS[r.index]}</b></span>
						</div>
					);
				})}
			</div>

			<div id="testbar">
				<span className="state" id="test-state">{PHASE_LABELS[phase]}</span>
				<button type="button" id="test-back" onClick={surReglages}>Réglages</button>
				<button type="button" id="test-quit" onClick={surQuitter}>Quitter</button>
			</div>
		</>
	);
}
