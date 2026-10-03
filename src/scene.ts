/*
 * La scène : le tour choisi, en plein écran, dans un cadre (iframe) par-dessus le menu principal.
 *
 * Chaque tour est une copie de son app (src/tours/<dossier>/, compilée dans dist/tours/<dossier>/),
 * avec ses propres styles, gestes et réglages : le cadre les isole les uns des autres, sans rien
 * avoir à renommer. Le tour rend la main par le pont (src/tours/pont.ts) :
 *
 *   « fin »      la routine est finie (son geste de remise à zéro) ;
 *   « quitter »  sortie de secours (appui de 3 s), ou réglages fermés.
 *
 * Le geste retour d'Android referme aussi le tour : l'ouverture ajoute une entrée à l'historique.
 */

import { $ } from './kit/web/dom.ts';
import type { Langue } from './content/textes.ts';
import { TOURS } from './content/tours.ts';
import type { MessageTour } from './tours/pont.ts';

const scene = $('#scene');
let cadre: HTMLIFrameElement | null = null;

/** Un tour est ouvert (en routine ou en réglages) : l'app ne doit pas se recharger. */
export const tourOuvert = (): boolean => cadre !== null;

/**
 * L'historique : ouvrir un tour y ajoute une entrée, pour que le geste retour d'Android le
 * referme. Quand c'est le tour qui rend la main (fin de routine, croix, appui de 3 s), on ne
 * remonte pas l'historique — sur Android, ce « retour » prend du temps et le menu ne répondait pas
 * tout de suite — : le menu revient aussitôt, et l'entrée, devenue libre, resservira au tour
 * suivant. L'historique ne grandit donc pas d'un tour à l'autre.
 */
let entreeLibre = false;

/**
 * Ouvre le tour `dossier` en plein écran, dans la langue `lang` du menu (bouton FR / EN).
 * `reglages` : seulement ses réglages (écrou ⚙), que l'on ferme pour revenir au menu.
 */
export function ouvrir(dossier: string, nom: string, lang: Langue, reglages = false): void {
	fermer(false);
	cadre = document.createElement('iframe');
	cadre.title = nom;
	// index.html et non le dossier : c'est sous ce nom que le service worker met la page en cache.
	// La langue du menu, et le nom du tour pour l'en-tête de ses réglages (src/tours/pont.ts).
	const nomDuTour = TOURS.find((tour) => tour.dossier === dossier)?.nom[lang] ?? '';
	cadre.src = `tours/${dossier}/index.html?lang=${lang}&nom=${encodeURIComponent(nomDuTour)}${reglages ? '&reglages' : ''}`;
	// Écran allumé (API Screen Wake Lock, ou vidéo muette lue sans geste) depuis le cadre.
	cadre.allow = 'screen-wake-lock; autoplay; fullscreen';
	// Le clavier et la télécommande parlent au tour, pas au menu.
	cadre.addEventListener('load', () => cadre?.contentWindow?.focus());
	scene.replaceChildren(cadre);
	scene.hidden = false;
	if (entreeLibre) history.replaceState({ tour: dossier }, '');
	else history.pushState({ tour: dossier }, '');
	entreeLibre = false;
}

/**
 * Le doigt de l'appui de 3 s est encore posé quand le tour se ferme : en se relevant sur le menu,
 * il « cliquerait » sur la tuile placée dessous et relancerait un tour. Dans ce cas seulement — le
 * tour dit si un doigt est posé (src/tours/pont.ts) —, le menu n'obéit qu'à un toucher qui commence
 * sur lui. Après la croix ou la fin d'une routine, aucun doigt n'est posé : le menu répond aussitôt.
 */
let doigtDuTour = false;

/** Referme le tour et revient au menu principal. `doigtPose` : un doigt est encore sur l'écran. */
function fermer(doigtPose: boolean): void {
	if (!cadre) return;
	scene.hidden = true;
	scene.replaceChildren();
	cadre = null;
	doigtDuTour = doigtPose;
}

// Un toucher qui commence sur le menu (ou une touche) lève la garde ; un clic sans lui est ignoré.
for (const debut of ['pointerdown', 'keydown'] as const) {
	document.addEventListener(debut, () => {
		doigtDuTour = false;
	}, true);
}
document.addEventListener('click', (event) => {
	if (!doigtDuTour) return;
	event.preventDefault();
	event.stopPropagation();
}, true);

window.addEventListener('message', (event: MessageEvent<{ mesTours?: MessageTour; doigtPose?: boolean }>) => {
	if (event.origin !== location.origin || !cadre || event.source !== cadre.contentWindow) return;
	if (event.data?.mesTours !== 'fin' && event.data?.mesTours !== 'quitter') return;
	// Le menu revient tout de suite ; l'entrée d'historique du tour reste, libre pour le suivant.
	fermer(event.data.doigtPose === true);
	history.replaceState(null, '');
	entreeLibre = true;
});

// Geste retour d'Android (ou bouton retour) pendant un tour : il se referme. Le doigt est levé.
window.addEventListener('popstate', () => {
	fermer(false);
	entreeLibre = false;
});

// Un rechargement garde l'entrée d'historique du dernier tour ouvert : au démarrage, aucun tour
// n'est ouvert, elle ne doit pas coûter un « retour » pour rien.
if ((history.state as { tour?: string } | null)?.tour) history.replaceState(null, '');
