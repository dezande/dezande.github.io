/*
 * Verrou paysage : la carte de visite se joue téléphone tenu en largeur.
 *
 * L'app « Mes tours » est verrouillée en portrait (manifest.json) : tenu en largeur, le téléphone
 * garde un écran en portrait. Toute la scène pivote alors d'un quart de tour, le haut de la scène du
 * côté droit de l'écran : c'est le côté qui monte quand on tourne le téléphone vers la gauche, le
 * paysage habituel. Si l'écran est déjà en paysage (navigateur non verrouillé), rien ne pivote.
 *
 * Fonction pure, testée sous Node (tests/tours/carte-de-visite/paysage.test.ts). Les calculs de taille
 * et de coordonnées sont ceux du verrou portrait du kit (kit/web/orientation-logic.ts).
 */

import type { Rotation } from '../../../kit/web/orientation-logic.ts';

/** Rotation qui met la scène en paysage : 90° sur un écran en portrait, rien sinon. */
export function landscapeRotation(width: number, height: number): Rotation {
	return width < height ? 90 : 0;
}
