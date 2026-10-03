/*
 * LE TEST DES ZONES d'un tour à zones, pour répéter : les limites des zones dessinées sur la scène,
 * chacune avec son nom et sa valeur, et une barre d'état (la phase en cours, « Réglages » pour y
 * revenir, « Quitter » pour le menu). Il s'ouvre depuis les réglages (aides à la répétition) ; la
 * zone touchée clignote (`eclair`). Rendu par components/zones/TourAZones.tsx.
 *
 * Ids et classes : #zones, .zone (+ .right pour la colonne de droite des 4 coins, .hit pour la zone
 * touchée), .tag, #testbar, #test-state, #test-back, #test-quit ; les styles sont ceux de chaque
 * tour (styles/tours/<dossier>/_test-mode.scss).
 */

import { useLayoutEffect, useState, type RefObject } from 'react';
import type { Phase } from '../../hooks/usePhasesZones.ts';
import { zoneRects } from '../../logic/zones.ts';

/** La dernière zone touchée ; `n` change à chaque toucher, pour relancer le clignotement. */
export interface Eclair {
	index: number;
	n: number;
}

interface Props {
	/** Le nombre de zones (src/logic/zones.ts : 2 ou 3 bandes, ou 4 coins). */
	zones: number;
	/** Le nom de chaque zone (« Haut », « Bas gauche »…) et sa valeur, dans l'ordre des zones. */
	noms: readonly string[];
	valeurs: readonly string[];
	/** Ce que dit la barre d'état pour chaque phase du tour. */
	libellesPhases: Readonly<Record<Phase, string>>;
	phase: Phase;
	/** La scène, dont les zones suivent les dimensions. */
	scene: RefObject<HTMLElement | null>;
	eclair: Eclair | null;
	/** Retour aux réglages. */
	surReglages: () => void;
	/** Retour au menu. */
	surQuitter: () => void;
}

export function ModeTest({ zones, noms, valeurs, libellesPhases, phase, scene, eclair, surReglages, surQuitter }: Props) {
	// Repère de la scène (pivotée ou non) : #zones est dans #app, comme la scène.
	const [taille, setTaille] = useState({ largeur: 0, hauteur: 0 });
	useLayoutEffect(() => {
		const mesurer = (): void => {
			const element = scene.current;
			if (element) setTaille({ largeur: element.clientWidth, hauteur: element.clientHeight });
		};
		mesurer();
		// Rotation de l'écran, passage en paysage (hooks/usePaysage.ts relance un « resize »), barre
		// d'adresse qui apparaît… : les zones suivent la scène.
		window.addEventListener('resize', mesurer);
		return () => window.removeEventListener('resize', mesurer);
	}, [scene]);

	return (
		<>
			<div id="zones">
				{zoneRects(taille.largeur, taille.hauteur, zones).map((r) => {
					const touchee = eclair?.index === r.index;
					// Colonne de droite des 4 coins : trait vertical et étiquette à droite.
					const classes = ['zone'];
					if (r.left > 0) classes.push('right');
					if (touchee) classes.push('hit');
					return (
						// Une nouvelle clé à chaque toucher relance l'animation, même sur des touchers rapprochés.
						<div key={`${r.index}-${touchee ? eclair.n : 0}`} className={classes.join(' ')} style={{ left: `${r.left}px`, top: `${r.top}px`, width: `${r.right - r.left}px`, height: `${r.bottom - r.top}px` }}>
							<span className="tag">{`${noms[r.index]} →`}<b>{valeurs[r.index]}</b></span>
						</div>
					);
				})}
			</div>

			<div id="testbar">
				<span className="state" id="test-state">{libellesPhases[phase]}</span>
				<button type="button" id="test-back" onClick={surReglages}>Réglages</button>
				<button type="button" id="test-quit" onClick={surQuitter}>Quitter</button>
			</div>
		</>
	);
}
