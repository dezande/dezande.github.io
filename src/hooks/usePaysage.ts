/*
 * VERROU PAYSAGE d'un tour joué téléphone tenu en largeur (src/logic/paysage.ts) — la carte de
 * visite, ou tout tour à zones avec `paysage` (components/zones/TourAZones.tsx) —, à la place du
 * verrou portrait du kit (kit/web/orientation.ts) le temps du tour : pivote #app et donne sa taille
 * (--app-w, --app-h), que les styles du kit (_app.scss) appliquent. Les marges de sécurité
 * (--safe-*) suivent la rotation par ces mêmes styles.
 *
 * #app est celle de toute l'app : le verrou portrait du kit la recalcule à chaque « resize ». Ses
 * écouteurs sont posés au démarrage (main.tsx), les nôtres après : ils passent après lui et ont le
 * dernier mot. Au départ du tour, nos écouteurs sont retirés et un « resize » rend la main au kit,
 * qui remet #app en portrait pour le menu.
 *
 * Les réglages, eux, restent en portrait (`actif` faux) : ils s'ouvrent depuis le menu, téléphone
 * tenu droit, et suivent le verrou du kit comme ceux des autres tours. La scène et le test des
 * zones sont en paysage.
 */

import type { RefObject } from 'preact';
import { useCallback, useLayoutEffect, useRef } from 'preact/hooks';
import { currentRotation } from '../kit/web/orientation.ts';
import { appSize, toAppPoint, type Rotation, type Viewport } from '../kit/web/orientation-logic.ts';
import { landscapeRotation } from '../logic/paysage.ts';

function viewport(): Viewport {
	// L'angle et le tactile ne servent pas ici : seule compte la forme de la fenêtre.
	return { width: window.innerWidth, height: window.innerHeight, angle: 0, touch: true };
}

/** Le verrou de toute l'app a changé : ceux qui mesurent la scène (test des zones) suivent. */
const signalerResize = (): void => {
	window.dispatchEvent(new Event('resize'));
};

/**
 * Met #app en paysage tant que `actif` (la scène, le test des zones). `scene` : un élément dans
 * #app. Renvoie appPoint : point de l'écran (clientX, clientY) dans le repère de #app, pivotée ou non.
 */
export function usePaysage(actif: boolean, scene: RefObject<HTMLElement | null>) {
	const rotation = useRef<Rotation>(0);
	const actifRef = useRef(actif);

	/** Recalcule la rotation, après le verrou du kit. Inactif : #app reste celle du kit. */
	const appliquer = useCallback((): void => {
		if (!actifRef.current) return;
		const app = scene.current?.closest<HTMLElement>('#app');
		if (!app) return;
		const v = viewport();
		rotation.current = landscapeRotation(v.width, v.height);
		const size = appSize(v, rotation.current);
		app.dataset.rotation = String(rotation.current);
		app.style.setProperty('--app-w', `${size.width}px`);
		app.style.setProperty('--app-h', `${size.height}px`);
	}, [scene]);

	// Écouteurs posés une fois pour toutes (et non à chaque changement d'`actif`) : ils restent
	// avant ceux du test des zones, qui mesure la scène une fois la rotation appliquée.
	useLayoutEffect(() => {
		// Rotation de l'écran : le kit relance lui-même un « resize ». Pointeur changé (souris,
		// tactile) : le kit se recalcule sans « resize », on repasse derrière lui.
		window.addEventListener('resize', appliquer);
		const grossier = typeof window.matchMedia === 'function' ? window.matchMedia('(pointer: coarse)') : null;
		grossier?.addEventListener('change', appliquer);
		return () => {
			window.removeEventListener('resize', appliquer);
			grossier?.removeEventListener('change', appliquer);
			// Le kit reprend #app (portrait) : rotation, tailles, et marges de sécurité avec elles.
			signalerResize();
		};
	}, [appliquer]);

	// Scène ou réglages : le kit recalcule d'abord (portrait), puis nous (paysage si actif).
	useLayoutEffect(() => {
		actifRef.current = actif;
		appliquer();
		signalerResize();
	}, [actif, appliquer]);

	const appPoint = useCallback((clientX: number, clientY: number): { x: number; y: number } => {
		return toAppPoint(clientX, clientY, viewport(), actifRef.current ? rotation.current : currentRotation());
	}, []);

	return { appPoint };
}
