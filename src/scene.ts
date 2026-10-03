/*
 * Ouvrir un tour : sa page s'ouvre à la place du menu, dans la même app installée, en plein écran.
 *
 * Chaque tour est une copie de son app (src/tours/<dossier>/, compilée dans dist/tours/<dossier>/).
 * Il reçoit dans son adresse la langue du menu (`lang`), son nom (`nom`, pour l'en-tête de ses
 * réglages) et, ouvert par l'écrou ⚙, `reglages`. Il revient au menu par le pont
 * (src/tours/pont.ts) : à la fin de sa routine, par l'appui de 3 s, ou quand ses réglages se
 * ferment. Le geste retour d'Android y ramène aussi.
 *
 * Les tours s'affichaient d'abord dans un cadre (iframe) par-dessus le menu. Sur Android, fermer
 * ce cadre dérangeait le navigateur : le menu, puis le tour rouvert, ne recevaient plus les
 * événements « pointer » du doigt et ne répondaient plus ; et dans un cadre, les marges de l'écran
 * (caméra frontale) valent 0, si bien que le tour passait sous la caméra. Une page ouverte
 * normalement n'a aucun de ces deux défauts.
 */

import type { Langue } from './content/textes.ts';
import { TOURS } from './content/tours.ts';

/**
 * Ouvre le tour `dossier` dans la langue `lang` du menu (bouton FR / EN). `reglages` : seulement
 * ses réglages (écrou ⚙), que l'on ferme pour revenir au menu.
 */
export function ouvrir(dossier: string, lang: Langue, reglages = false): void {
	const nomDuTour = TOURS.find((tour) => tour.dossier === dossier)?.nom[lang] ?? '';
	// index.html et non le dossier : c'est sous ce nom que le service worker met la page en cache.
	location.assign(`tours/${dossier}/index.html?lang=${lang}&nom=${encodeURIComponent(nomDuTour)}${reglages ? '&reglages' : ''}`);
}
