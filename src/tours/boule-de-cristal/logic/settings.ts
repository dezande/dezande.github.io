/*
 * Réglages : forme, valeurs par défaut et validation.
 * Fonctions pures, sans DOM ni localStorage : testées sous Node (tests/logic/settings.test.ts).
 * Les réglages lus sur l'appareil peuvent venir d'une ancienne version de l'app ou être abîmés :
 * tout passe par sanitizeSettings() avant d'être utilisé.
 */

import { validerReglagesZones, type ReglagesZones } from '../../../logic/reglages-zones.ts';

/**
 * La routine des 3 boulettes : l'écran est coupé en 3 bandes horizontales, une prédiction par bande,
 * de haut en bas. Elle est fixée ici : il n'y a plus de routine à choisir (Arcane Système est devenu
 * son propre tour, la carte d'hôtel).
 */
export const ZONES = 3;
export const PREDICTIONS: readonly string[] = Object.freeze(['6', '16', '26']);

/** Les réglages d'un tour à zones (src/logic/reglages-zones.ts). */
export type Settings = ReglagesZones;

export const DEFAULTS: Readonly<Settings> = Object.freeze({
	delay: 3,
	fade: 1.5,
	brightness: 100,
	showHoldRing: true,
});

export const sanitizeSettings = validerReglagesZones(DEFAULTS);
