/*
 * Réglages : forme, valeurs par défaut et validation.
 * Fonctions pures, sans DOM ni localStorage : testées sous Node (tests/tours/carte-de-visite/settings.test.ts).
 * Les réglages lus sur l'appareil peuvent être abîmés : tout passe par sanitizeSettings() avant
 * d'être utilisé.
 */

import { validerReglagesZones, type ReglagesZones } from '../../../logic/reglages-zones.ts';

/**
 * La routine Arcane Système : l'écran est coupé en 4 coins, un numéro par coin (écrit au verso de la
 * carte), dans le sens de lecture (haut gauche, haut droite, bas gauche, bas droite).
 * Elle est fixée ici : il n'y a rien à choisir.
 */
export const ZONES = 4;
export const NUMEROS: readonly string[] = Object.freeze(['17', '19', '21', '23']);

/** Les réglages d'un tour à zones (src/logic/reglages-zones.ts). */
export type Settings = ReglagesZones;

export const DEFAULTS: Readonly<Settings> = Object.freeze({
	delay: 3,
	fade: 1.2,
	brightness: 100,
	showHoldRing: true,
});

export const sanitizeSettings = validerReglagesZones(DEFAULTS);
