/* Réglages en cours et enregistrement sur l'appareil (localStorage). Validation : logic/settings.ts. */

import { NUMEROS, sanitizeSettings, ZONES, type Settings } from '../logic/settings.ts';

export type { Settings };
export { NUMEROS, ZONES };

const STORAGE_KEY = 'carte-de-visite:settings:v1';

/** Nom de chaque coin, dans l'ordre des zones (voir logic/zone-logic.ts). */
export const ZONE_NAMES: readonly string[] = ['Haut gauche', 'Haut droite', 'Bas gauche', 'Bas droite'];

function loadSettings(): Settings {
	try {
		return sanitizeSettings(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null'));
	} catch {
		return sanitizeSettings(null);
	}
}

/**
 * Réglages en cours. Les autres modules lisent ce binding (toujours à jour) et peuvent modifier
 * ses champs, puis appellent storeSettings() pour valider et enregistrer.
 */
export let settings = loadSettings();

/** Valide et enregistre les réglages. Avec `null` : rétablit les réglages par défaut. */
export function storeSettings(next: unknown = settings): void {
	settings = sanitizeSettings(next);
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
	} catch {
		// Stockage indisponible : réglages conservés pour la session.
	}
}
