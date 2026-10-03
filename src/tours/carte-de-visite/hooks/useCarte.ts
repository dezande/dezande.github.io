/*
 * La carte de visite : elle se retourne et montre, au verso, le numéro seul, en grand, écrit à la
 * plume ; puis elle revient sur son recto.
 *
 * Phases : idle → pending (délai, rien ne bouge) → shown (verso) → clearing (retour au recto) → idle.
 * Hors de idle, l'écran est verrouillé : aucun toucher n'arme de nouveau numéro.
 * L'apparence est portée par la classe .retournee de la carte (_carte.scss, components/Carte.tsx).
 * Le numéro n'est écrit au verso qu'au toucher : avant, le verso n'a pas de numéro.
 */

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { NUMEROS, type Settings } from '../logic/settings.ts';

export type Phase = 'idle' | 'pending' | 'shown' | 'clearing';

/** Ce que la carte montre : lu par components/Carte.tsx. */
export interface EtatCarte {
	phase: Phase;
	/** Le numéro armé, écrit au verso (il y reste jusqu'au toucher suivant). */
	numero: string;
	/** Retour au recto sans transition (.instant sur la carte) : retiré par Carte une fois appliqué. */
	instant: boolean;
}

const REPOS: EtatCarte = { phase: 'idle', numero: '', instant: false };

/** Un tour est en cours : les touchers n'arment plus rien. */
export const isLocked = (phase: Phase): boolean => phase !== 'idle';
/** Un numéro est armé ou montré (le double tap remet la carte sur son recto). */
export const isArmed = (phase: Phase): boolean => phase === 'pending' || phase === 'shown';

/**
 * L'état de la carte et ses transitions. Les réglages sont lus par une référence : les minuteries
 * voient toujours les derniers.
 */
export function useCarte(reglagesRef: RefObject<Settings>) {
	const [etat, setEtat] = useState<EtatCarte>(REPOS);
	/** Phase en cours, lue par les gestes, qui doivent toujours voir la dernière valeur. */
	const phaseRef = useRef<Phase>('idle');
	/** Minuterie de la phase en cours (retournement ou retour au recto). */
	const timer = useRef(0);

	const changer = useCallback((suivant: Partial<EtatCarte>): void => {
		if (suivant.phase) phaseRef.current = suivant.phase;
		setEtat((avant) => ({ ...avant, ...suivant }));
	}, []);

	/** Arme le numéro d'un coin : la carte se retournera sur lui après le délai. */
	const arm = useCallback((zoneIndex: number): void => {
		clearTimeout(timer.current);
		// Retourne la carte : le verso montre le numéro.
		timer.current = window.setTimeout(() => changer({ phase: 'shown' }), reglagesRef.current.delay * 1000);
		changer({ phase: 'pending', numero: NUMEROS[zoneIndex] ?? '' });
	}, [changer, reglagesRef]);

	/** Remet la carte sur son recto, puis réarme le tour une fois le retournement fini. */
	const fadeOut = useCallback((): void => {
		clearTimeout(timer.current);
		// Reste verrouillé tant que la carte n'est pas revenue sur son recto.
		timer.current = window.setTimeout(() => changer({ phase: 'idle' }), reglagesRef.current.fade * 1000 + 150);
		changer({ phase: 'clearing' });
	}, [changer, reglagesRef]);

	/** Remet la carte sur son recto sans animation (test des zones ouvert ou refermé). */
	const hardReset = useCallback((): void => {
		clearTimeout(timer.current);
		changer({ phase: 'idle', instant: true });
	}, [changer]);

	/** Transitions rétablies, une fois le recto rétabli sans elles (components/Carte.tsx). */
	const finInstant = useCallback((): void => changer({ instant: false }), [changer]);

	useEffect(() => () => clearTimeout(timer.current), []);

	return { etat, phaseRef, arm, fadeOut, hardReset, finInstant };
}
