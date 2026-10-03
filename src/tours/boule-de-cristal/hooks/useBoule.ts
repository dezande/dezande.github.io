/*
 * La boule de cristal : apparition et disparition du nombre.
 *
 * Phases : idle → pending (délai, la brume s'agite) → shown → clearing (fondu de sortie) → idle.
 * Hors de idle, l'écran est verrouillé : aucun toucher n'arme de nouveau nombre.
 * L'apparence de chaque phase est portée par des classes CSS (styles/tours/boule-de-cristal/_ball.scss) :
 * .stirring et .revealed sur l'autel, .shown sur le nombre (components/Boule.tsx).
 */

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { PREDICTIONS, type Settings } from '../logic/settings.ts';

export type Phase = 'idle' | 'pending' | 'shown' | 'clearing';

/** Ce que la boule affiche : lu par components/Boule.tsx. */
export interface EtatBoule {
	phase: Phase;
	/** Le nombre armé (il reste écrit pendant le fondu de sortie). */
	valeur: string;
	/** Durée des transitions de la brume et des halos, en secondes (variable CSS --mist-t). */
	mistT: number;
	/** Retour au repos sans transition (.instant sur l'autel) : retiré par Boule une fois appliqué. */
	instant: boolean;
}

const REPOS: EtatBoule = { phase: 'idle', valeur: '', mistT: 2, instant: false };

/** Un tour est en cours : les touchers n'arment plus rien. */
export const isLocked = (phase: Phase): boolean => phase !== 'idle';
/** Un nombre est armé ou affiché (le double tap peut l'effacer). */
export const isArmed = (phase: Phase): boolean => phase === 'pending' || phase === 'shown';

/** Taille du nombre relative à la boule : plus il a de chiffres, plus il est petit. */
export function numberScale(value: string): number {
	const length = Array.from(value).length;
	return length <= 2 ? 0.42 : length === 3 ? 0.32 : length === 4 ? 0.25 : 0.2;
}

/**
 * L'état de la boule et ses transitions. Les réglages sont lus par une référence : les minuteries
 * voient toujours les derniers.
 */
export function useBoule(reglagesRef: RefObject<Settings>) {
	const [etat, setEtat] = useState<EtatBoule>(REPOS);
	/** Phase en cours, lue par les gestes, qui doivent toujours voir la dernière valeur. */
	const phaseRef = useRef<Phase>('idle');
	/** Minuterie de la phase en cours (apparition ou fin du fondu). */
	const timer = useRef(0);

	const changer = useCallback((suivant: Partial<EtatBoule>): void => {
		if (suivant.phase) phaseRef.current = suivant.phase;
		setEtat((avant) => ({ ...avant, ...suivant }));
	}, []);

	/** Fait apparaître le nombre dans la boule. */
	const reveal = useCallback((): void => {
		changer({ phase: 'shown', mistT: reglagesRef.current.fade * 1.6 });
	}, [changer, reglagesRef]);

	/** Arme la valeur d'une zone : la brume s'agite, le nombre apparaîtra après le délai. */
	const arm = useCallback((zoneIndex: number): void => {
		const reglages = reglagesRef.current;
		const valeur = PREDICTIONS[zoneIndex] ?? '';
		// Montée lente (ease-in) : rien de perceptible à l'instant du toucher.
		changer({ phase: 'pending', valeur, mistT: Math.max(reglages.delay, 1) });
		clearTimeout(timer.current);
		timer.current = window.setTimeout(reveal, reglages.delay * 1000);
	}, [changer, reglagesRef, reveal]);

	/** Efface le nombre en fondu, puis réarme l'app une fois le fondu terminé. */
	const fadeOut = useCallback((): void => {
		clearTimeout(timer.current);
		const fade = reglagesRef.current.fade;
		changer({ phase: 'clearing', mistT: fade });
		// Reste verrouillé tant que le nombre n'a pas totalement disparu.
		timer.current = window.setTimeout(() => changer({ phase: 'idle' }), fade * 1000 + 150);
	}, [changer, reglagesRef]);

	/** Remet la boule au repos sans animation (test des zones ouvert ou refermé). */
	const hardReset = useCallback((): void => {
		clearTimeout(timer.current);
		changer({ phase: 'idle', instant: true });
	}, [changer]);

	/** Transitions rétablies, une fois l'état de repos appliqué sans elles (components/Boule.tsx). */
	const finInstant = useCallback((): void => changer({ instant: false }), [changer]);

	useEffect(() => () => clearTimeout(timer.current), []);

	return { etat, phaseRef, arm, fadeOut, hardReset, finInstant };
}
