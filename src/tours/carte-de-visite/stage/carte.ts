/*
 * La carte de visite du Théâtre Robert-Houdin : elle se retourne et montre, au verso, le numéro seul, en grand,
 * écrit à la plume ; puis elle revient sur son recto.
 *
 * Phases : idle → pending (délai, rien ne bouge) → shown (verso) → clearing (retour au recto) → idle.
 * Hors de idle, l'écran est verrouillé : aucun toucher n'arme de nouveau numéro.
 * L'apparence est portée par la classe .retournee de la carte (_carte.scss). Le numéro n'est écrit au
 * verso qu'au toucher : avant, le verso n'a pas de numéro.
 */

import { NUMEROS, settings } from '../settings/store.ts';
import { $ } from '../system/dom.ts';

export type Phase = 'idle' | 'pending' | 'shown' | 'clearing';

const carte = $('#carte');
const numberText = $('#number-text');

let phase: Phase = 'idle';
/** Minuterie de la phase en cours (retournement ou retour au recto). */
let timer = 0;
const listeners: ((phase: Phase) => void)[] = [];

export const getPhase = (): Phase => phase;
/** Un tour est en cours : les touchers n'arment plus rien. */
export const isLocked = (): boolean => phase !== 'idle';
/** Un numéro est armé ou montré (le double tap remet la carte sur son recto). */
export const isArmed = (): boolean => phase === 'pending' || phase === 'shown';

/** Abonne une fonction aux changements de phase (barre du mode test). */
export function onPhaseChange(listener: (phase: Phase) => void): void {
	listeners.push(listener);
}

function setPhase(next: Phase): void {
	phase = next;
	for (const listener of listeners) listener(next);
}

/** Arme le numéro d'un coin : la carte se retournera sur lui après le délai. */
export function arm(zoneIndex: number): void {
	numberText.textContent = NUMEROS[zoneIndex] ?? '';
	clearTimeout(timer);
	timer = window.setTimeout(reveal, settings.delay * 1000);
	setPhase('pending');
}

/** Retourne la carte : le verso montre le numéro. */
function reveal(): void {
	carte.classList.add('retournee');
	setPhase('shown');
}

/** Remet la carte sur son recto, puis réarme le tour une fois le retournement fini. */
export function fadeOut(): void {
	clearTimeout(timer);
	carte.classList.remove('retournee');
	// Reste verrouillé tant que la carte n'est pas revenue sur son recto.
	timer = window.setTimeout(() => setPhase('idle'), settings.fade * 1000 + 150);
	setPhase('clearing');
}

/** Remet la carte sur son recto sans animation (ouverture et fermeture des réglages). */
export function hardReset(): void {
	clearTimeout(timer);
	// .instant coupe les transitions le temps de retirer la classe d'état.
	carte.classList.add('instant');
	carte.classList.remove('retournee');
	// Lecture de la mise en page : force le navigateur à appliquer l'état sans transition
	// avant de les réactiver.
	void carte.offsetWidth;
	carte.classList.remove('instant');
	setPhase('idle');
}
