/*
 * LES ADRESSES DE L'APP, après le « # » de l'adresse (le service worker ne connaît ainsi qu'une
 * page, index.html, qui s'ouvre hors-ligne quel que soit le tour demandé) :
 *
 *   #/                          le menu principal (une adresse vide aussi)
 *   #/tours/<dossier>           un tour, prêt pour une nouvelle routine
 *   #/tours/<dossier>?reglages  seulement ses réglages (écrou ⚙ du menu)
 *
 * Des adresses strictes : elles sont comparées telles quelles, caractère pour caractère, aux
 * adresses des tours publiés. Rien n'est décodé ni nettoyé. Toute autre adresse — un nom inventé
 * ou hérité de JavaScript (« constructor »), une majuscule, un « / » final, un dossier de plus,
 * un paramètre inconnu ou avec une valeur — est refusée, et l'app ramène au menu.
 *
 * Fonctions pures, testées sous Node (tests/logic/adresses.test.ts). Le suivi de l'adresse dans le
 * navigateur est dans src/routeur.ts.
 */

/** Ce qu'une adresse ouvre. */
export type Page =
	| { readonly page: 'menu' }
	| { readonly page: 'tour'; readonly dossier: string; readonly reglages: boolean }
	| { readonly page: 'refusee' };

/** L'adresse d'un tour ; `reglages` : seulement ses réglages (écrou ⚙). */
export const adresseDuTour = (dossier: string, reglages = false): string => `/tours/${dossier}${reglages ? '?reglages' : ''}`;

/**
 * Ce que ouvre l'adresse `hash` (location.hash, avec son « # »), parmi les tours publiés
 * `dossiers` (la liste des tours, et rien d'autre).
 */
export function resoudre(hash: string, dossiers: readonly string[]): Page {
	const adresse = hash.startsWith('#') ? hash.slice(1) : hash;
	if (adresse === '' || adresse === '/') return { page: 'menu' };
	for (const dossier of dossiers) {
		if (adresse === adresseDuTour(dossier)) return { page: 'tour', dossier, reglages: false };
		if (adresse === adresseDuTour(dossier, true)) return { page: 'tour', dossier, reglages: true };
	}
	return { page: 'refusee' };
}
