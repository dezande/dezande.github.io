/*
 * Le pont entre un tour et l'app « Mes tours », qui l'affiche en plein écran dans un cadre
 * (src/scene.ts). Chaque tour s'en sert pour rendre la main au menu principal :
 *
 *   finDeRoutine()  la routine est finie (le geste de remise à zéro du tour) : retour au menu ;
 *   quitter()       sortie de secours (appui de 3 s pendant le tour), ou fermeture des réglages.
 *
 * `enReglages` dit si le tour a été ouvert par l'écrou ⚙ du menu principal : il ne montre alors
 * que son panneau de réglages, et le fermer ramène au menu.
 *
 * Un tour ouvert seul, hors du cadre (adresse tapée à la main), revient à la racine de l'app.
 */

/** Ce qu'un tour peut dire à l'app. */
export type MessageTour = 'fin' | 'quitter';

/** Le tour a été ouvert par l'écrou ⚙ : seulement ses réglages. */
export const enReglages = new URLSearchParams(location.search).has('reglages');

function envoyer(message: MessageTour): void {
	if (window.parent !== window) window.parent.postMessage({ mesTours: message }, location.origin);
	else location.href = '../../';
}

/** La routine est finie : retour au menu principal. */
export const finDeRoutine = (): void => envoyer('fin');

/** Quitter le tour (sortie de secours, ou réglages fermés) : retour au menu principal. */
export const quitter = (): void => envoyer('quitter');
