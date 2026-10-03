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
import type { MessageTour } from './tours/pont.ts';

const scene = $('#scene');
let cadre: HTMLIFrameElement | null = null;

/** Un tour est ouvert (en routine ou en réglages) : l'app ne doit pas se recharger. */
export const tourOuvert = (): boolean => cadre !== null;

/**
 * Ouvre le tour `dossier` en plein écran. `reglages` : seulement ses réglages (écrou ⚙), que
 * l'on ferme pour revenir au menu.
 */
export function ouvrir(dossier: string, nom: string, reglages = false): void {
	fermer();
	cadre = document.createElement('iframe');
	cadre.title = nom;
	// index.html et non le dossier : c'est sous ce nom que le service worker met la page en cache.
	cadre.src = `tours/${dossier}/index.html${reglages ? '?reglages' : ''}`;
	// Écran allumé (API Screen Wake Lock, ou vidéo muette lue sans geste) depuis le cadre.
	cadre.allow = 'screen-wake-lock; autoplay; fullscreen';
	// Le clavier et la télécommande parlent au tour, pas au menu.
	cadre.addEventListener('load', () => cadre?.contentWindow?.focus());
	scene.replaceChildren(cadre);
	scene.hidden = false;
	history.pushState({ tour: dossier }, '');
}

/**
 * Après la fermeture d'un tour, le menu n'obéit qu'à un toucher qui commence sur lui. Le doigt de
 * l'appui de 3 s est encore posé quand le tour se ferme : en se relevant sur le menu, il
 * « cliquerait » sur la tuile placée dessous et relancerait un tour.
 */
let doigtDuTour = false;

/** Referme le tour et revient au menu principal. */
function fermer(): void {
	if (!cadre) return;
	scene.hidden = true;
	scene.replaceChildren();
	cadre = null;
	doigtDuTour = true;
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

/** Retour au menu demandé par le tour : par l'historique, pour que l'entrée ajoutée s'en aille aussi. */
function revenir(): void {
	if ((history.state as { tour?: string } | null)?.tour) history.back();
	else fermer();
}

window.addEventListener('message', (event: MessageEvent<{ mesTours?: MessageTour }>) => {
	if (event.origin !== location.origin || !cadre || event.source !== cadre.contentWindow) return;
	if (event.data?.mesTours === 'fin' || event.data?.mesTours === 'quitter') revenir();
});

// Geste retour d'Android (ou bouton retour) : le tour se referme.
window.addEventListener('popstate', fermer);
