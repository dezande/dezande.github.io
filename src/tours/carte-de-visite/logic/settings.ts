/*
 * Réglages : forme, valeurs par défaut et validation.
 * Fonctions pures, sans DOM ni localStorage : testées sous Node (tests/tours/carte-de-visite/settings.test.ts).
 * Les réglages lus sur l'appareil peuvent être abîmés : tout passe par sanitizeSettings() avant
 * d'être utilisé.
 */

/**
 * La routine Arcane Système : l'écran est coupé en 4 coins, un numéro par coin (écrit au verso de la
 * carte), dans le sens de lecture (haut gauche, haut droite, bas gauche, bas droite).
 * Elle est fixée ici : il n'y a rien à choisir.
 */
export const ZONES = 4;
export const NUMEROS: readonly string[] = Object.freeze(['17', '19', '21', '23']);

export interface Settings {
	/** Délai entre le toucher et le retournement de la carte, en secondes. */
	delay: number;
	/** Durée du retournement de la carte (dans un sens comme dans l'autre), en secondes. */
	fade: number;
	/** Luminosité de la scène, en pourcentage. */
	brightness: number;
	/** Jauge de l'appui long sur la scène : aide à la répétition, à masquer avant de jouer. */
	showHoldRing: boolean;
}

export const DEFAULTS: Readonly<Settings> = Object.freeze({
	delay: 3,
	fade: 1.2,
	brightness: 100,
	showHoldRing: true,
});

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));
/** Nombre borné entre lo et hi, ou la valeur par défaut si ce n'est pas un nombre. */
const num = (v: unknown, fallback: number, lo: number, hi: number): number =>
	typeof v === 'number' && Number.isFinite(v) ? clamp(v, lo, hi) : fallback;
const bool = (v: unknown, fallback: boolean): boolean => (typeof v === 'boolean' ? v : fallback);

/**
 * Réglages valides à partir de n'importe quelle donnée (JSON enregistré, réglages en cours…) :
 * chaque champ absent ou invalide reprend sa valeur par défaut, les nombres sont bornés et arrondis
 * au pas des curseurs.
 */
export function sanitizeSettings(raw: unknown): Settings {
	const src: Partial<Record<keyof Settings, unknown>> = raw && typeof raw === 'object' ? raw : {};
	return {
		delay: Math.round(num(src.delay, DEFAULTS.delay, 0, 10) * 2) / 2,
		fade: Math.round(num(src.fade, DEFAULTS.fade, 0.5, 6) * 10) / 10,
		brightness: Math.round(num(src.brightness, DEFAULTS.brightness, 30, 100)),
		showHoldRing: bool(src.showHoldRing, DEFAULTS.showHoldRing),
	};
}
