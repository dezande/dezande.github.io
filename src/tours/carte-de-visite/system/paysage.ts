/*
 * Verrou paysage de la carte de visite (logic/paysage.ts), à la place du verrou portrait du kit :
 * pivote #app et donne sa taille (--app-w, --app-h), que les styles du kit (_app.scss) appliquent.
 * À importer avant les modules qui mesurent la scène au démarrage.
 *
 * Les réglages, eux, restent en portrait : ils s'ouvrent depuis le menu, téléphone tenu droit
 * (settings/panel.ts appelle enPaysage(false) à leur ouverture, enPaysage(true) pour la scène et le
 * test des zones).
 */

import { $ } from '../../../kit/web/dom.ts';
import { appSize, toAppPoint, type Rotation, type Viewport } from '../../../kit/web/orientation-logic.ts';
import { landscapeRotation } from '../logic/paysage.ts';

const app = $('#app');
let rotation: Rotation = 0;
/** La scène est à l'écran (et non les réglages) : elle se met en paysage. */
let paysage = true;

function viewport(): Viewport {
	// L'angle et le tactile ne servent pas ici : seule compte la forme de la fenêtre.
	return { width: window.innerWidth, height: window.innerHeight, angle: 0, touch: true };
}

/** Recalcule la rotation. Écouteur enregistré avant ceux des modules importés après celui-ci. */
function update(): void {
	const v = viewport();
	rotation = paysage ? landscapeRotation(v.width, v.height) : 0;
	const size = appSize(v, rotation);
	app.dataset.rotation = String(rotation);
	app.style.setProperty('--app-w', `${size.width}px`);
	app.style.setProperty('--app-h', `${size.height}px`);
}

/** Met l'app en paysage (la scène, le test des zones) ou la laisse en portrait (les réglages). */
export function enPaysage(actif: boolean): void {
	if (actif === paysage) return;
	paysage = actif;
	update();
	// Les modules qui mesurent la scène (test des zones) suivent sa nouvelle taille.
	window.dispatchEvent(new Event('resize'));
}

/** Point de l'écran (clientX, clientY) dans le repère de #app, pivotée ou non. */
export function appPoint(clientX: number, clientY: number): { x: number; y: number } {
	return toAppPoint(clientX, clientY, viewport(), rotation);
}

window.addEventListener('resize', update);
screen.orientation?.addEventListener('change', () => {
	update();
	window.dispatchEvent(new Event('resize'));
});
update();
