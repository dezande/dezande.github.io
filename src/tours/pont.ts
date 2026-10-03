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
 * `langueDemandee` est la langue choisie par le bouton FR / EN du menu principal : elle vaut pour
 * tous les tours, qui n'ont plus de choix de langue à eux.
 *
 * `remplirEntete()` écrit l'en-tête commun des réglages de tous les tours : « Réglages » (ou
 * « Settings ») et, dessous, le nom du tour tel que le menu principal l'affiche.
 *
 * Un tour ouvert seul, hors du cadre (adresse tapée à la main), revient à la racine de l'app.
 */

/** Ce qu'un tour peut dire à l'app. */
export type MessageTour = 'fin' | 'quitter';

const parametres = new URLSearchParams(location.search);

/** Le tour a été ouvert par l'écrou ⚙ : seulement ses réglages. */
export const enReglages = parametres.has('reglages');

/** La langue choisie dans le menu principal (bouton FR / EN), ou null si le tour est ouvert seul. */
export const langueDemandee: 'fr' | 'en' | null = ((valeur) => (valeur === 'fr' || valeur === 'en' ? valeur : null))(parametres.get('lang'));

function envoyer(message: MessageTour): void {
	if (window.parent !== window) window.parent.postMessage({ mesTours: message }, location.origin);
	else location.href = '../../';
}

/** La routine est finie : retour au menu principal. */
export const finDeRoutine = (): void => envoyer('fin');

/** Quitter le tour (sortie de secours, ou réglages fermés) : retour au menu principal. */
export const quitter = (): void => envoyer('quitter');

/** Le nom du tour, dans la langue du menu, tel que le menu principal l'affiche (`?nom=`). */
export const nomDuTour: string | null = parametres.get('nom');

/**
 * L'en-tête commun des réglages : `.titre-reglages` reçoit « Réglages » (ou « Settings »), et
 * `.nom-du-tour` le nom du tour, pour savoir d'un coup d'œil de quel tour on règle quoi.
 */
export function remplirEntete(): void {
	const titre = document.querySelector('.titre-reglages');
	if (titre) titre.textContent = langueDemandee === 'en' ? 'Settings' : 'Réglages';
	const nom = document.querySelector<HTMLElement>('.nom-du-tour');
	if (nom) {
		nom.textContent = nomDuTour ?? '';
		nom.hidden = !nomDuTour;
	}
}
