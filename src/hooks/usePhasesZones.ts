/*
 * LES PHASES D'UN TOUR À ZONES (boule de cristal, carte de visite), d'un toucher à l'autre :
 *
 *   idle ──toucher une zone──▶ pending ──délai──▶ shown ──double tap──▶ clearing ──transition──▶ idle
 *
 *   idle      au repos, prêt : un toucher arme la valeur de la zone touchée ;
 *   pending   la valeur est armée, elle apparaîtra après le délai réglé ;
 *   shown     la valeur est montrée (le nombre dans la boule, le numéro au dos de la carte) ;
 *   clearing  elle disparaît, le temps de la transition réglée, puis le tour se réarme.
 * Hors de idle, l'écran est verrouillé : aucun toucher n'arme une nouvelle valeur.
 *
 * Le hook ne dessine rien : le décor du tour lit `etat` (sa phase, la valeur armée) et en fait ses
 * classes CSS. `instant` demande un retour au repos sans transition (test des zones) : le décor
 * l'applique, puis appelle finInstant().
 *
 * Les réglages sont lus par une référence : les minuteries voient toujours les derniers.
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import type { ReglagesZones } from '../logic/reglages-zones.ts';

export type Phase = 'idle' | 'pending' | 'shown' | 'clearing';

/** Ce que le décor du tour montre. */
export interface EtatZones {
	phase: Phase;
	/** La valeur armée ; elle reste écrite pendant la disparition, et jusqu'au toucher suivant. */
	valeur: string;
	/** Retour au repos sans transition : à appliquer par le décor, qui appelle ensuite finInstant(). */
	instant: boolean;
}

const REPOS: EtatZones = { phase: 'idle', valeur: '', instant: false };

/** Un tour est en cours : les touchers n'arment plus rien. */
export const isLocked = (phase: Phase): boolean => phase !== 'idle';
/** Une valeur est armée ou montrée (le double tap la fait disparaître). */
export const isArmed = (phase: Phase): boolean => phase === 'pending' || phase === 'shown';

/** `valeurs` : une valeur par zone, dans l'ordre des zones (src/logic/zones.ts). */
export function usePhasesZones(reglagesRef: RefObject<ReglagesZones>, valeurs: readonly string[]) {
	const [etat, setEtat] = useState<EtatZones>(REPOS);
	/** Phase en cours, lue par les gestes, qui doivent toujours voir la dernière valeur. */
	const phaseRef = useRef<Phase>('idle');
	/** Minuterie de la phase en cours (apparition, ou fin de la disparition). */
	const timer = useRef(0);

	const changer = useCallback((suivant: Partial<EtatZones>): void => {
		if (suivant.phase) phaseRef.current = suivant.phase;
		setEtat((avant) => ({ ...avant, ...suivant }));
	}, []);

	/** Arme la valeur d'une zone : elle apparaîtra après le délai réglé. */
	const armer = useCallback((zone: number): void => {
		clearTimeout(timer.current);
		timer.current = window.setTimeout(() => changer({ phase: 'shown' }), reglagesRef.current.delay * 1000);
		changer({ phase: 'pending', valeur: valeurs[zone] ?? '' });
	}, [changer, reglagesRef, valeurs]);

	/** La valeur disparaît ; le tour se réarme une fois la transition finie (verrouillé jusque-là). */
	const effacer = useCallback((): void => {
		clearTimeout(timer.current);
		timer.current = window.setTimeout(() => changer({ phase: 'idle' }), reglagesRef.current.fade * 1000 + 150);
		changer({ phase: 'clearing' });
	}, [changer, reglagesRef]);

	/** Retour au repos sans transition (test des zones ouvert ou refermé). */
	const remettre = useCallback((): void => {
		clearTimeout(timer.current);
		changer({ phase: 'idle', instant: true });
	}, [changer]);

	/** Transitions rétablies, une fois le repos appliqué sans elles. */
	const finInstant = useCallback((): void => changer({ instant: false }), [changer]);

	useEffect(() => () => clearTimeout(timer.current), []);

	return { etat, phaseRef, armer, effacer, remettre, finInstant };
}

/**
 * Pour le décor : applique le repos sans transition quand `etat.instant` est vrai. La classe
 * .instant (posée par le décor) coupe les transitions le temps de retirer les classes d'état ; la
 * lecture de la mise en page force le navigateur à appliquer l'état sans transition, puis
 * finInstant() les réactive. Renvoie la référence à poser sur l'élément qui porte .instant.
 */
export function useReposSansTransition<T extends HTMLElement>(instant: boolean, finInstant: () => void): RefObject<T | null> {
	const ref = useRef<T>(null);
	useLayoutEffect(() => {
		if (!instant) return;
		void ref.current?.offsetWidth;
		finInstant();
	}, [instant, finInstant]);
	return ref;
}
