/*
 * LES RÉGLAGES D'UN TOUR À ZONES (boule de cristal, carte de visite) : délai avant l'apparition,
 * durée de la transition, luminosité, jauge de l'appui long. Les mêmes champs et les mêmes bornes
 * pour tous ; chaque tour n'a que ses valeurs par défaut (son logic/settings.ts).
 *
 *   export const DEFAULTS = Object.freeze({ delay: 3, fade: 1.5, brightness: 100, showHoldRing: true });
 *   export const sanitizeSettings = validerReglagesZones(DEFAULTS);
 *
 * Les réglages relus sur l'appareil peuvent venir d'une ancienne version ou être abîmés : chaque
 * champ absent ou invalide reprend sa valeur par défaut, les nombres sont bornés et arrondis au pas
 * des curseurs (components/zones/ReglagesZones.tsx), et les champs inconnus sont ignorés.
 * Fonctions pures, testées sous Node avec les réglages de chaque tour (tests/tours/<dossier>/).
 */

export interface ReglagesZones {
	/** Délai entre le toucher et l'apparition (du nombre, du verso…), en secondes. */
	delay: number;
	/** Durée de la transition d'apparition et de disparition, en secondes. */
	fade: number;
	/** Luminosité de la scène, en pourcentage. */
	brightness: number;
	/** Jauge de l'appui long sur la scène : aide à la répétition, à masquer avant de jouer. */
	showHoldRing: boolean;
}

interface Borne {
	min: number;
	max: number;
	/** Le pas du curseur à l'écran. */
	pas: number;
	/** Arrondi d'une valeur relue : 2 pour la demi-unité, 10 pour le dixième, 1 pour l'entier. */
	arrondi: number;
}

/** Les curseurs des réglages : les mêmes bornes à l'écran et à la validation. */
export const BORNES = {
	delay: { min: 0, max: 10, pas: 0.5, arrondi: 2 },
	fade: { min: 0.5, max: 6, pas: 0.1, arrondi: 10 },
	brightness: { min: 30, max: 100, pas: 5, arrondi: 1 },
} as const satisfies Record<string, Borne>;

/** Nombre borné et arrondi, ou la valeur par défaut si ce n'est pas un nombre. */
function curseur(v: unknown, defaut: number, { min, max, arrondi }: Borne): number {
	if (typeof v !== 'number' || !Number.isFinite(v)) return defaut;
	return Math.round(Math.min(max, Math.max(min, v)) * arrondi) / arrondi;
}

/** La fonction de validation des réglages d'un tour à zones, avec ses valeurs par défaut. */
export function validerReglagesZones(defauts: Readonly<ReglagesZones>): (brut: unknown) => ReglagesZones {
	return (brut) => {
		const src: Partial<Record<keyof ReglagesZones, unknown>> = brut && typeof brut === 'object' ? brut : {};
		return {
			delay: curseur(src.delay, defauts.delay, BORNES.delay),
			fade: curseur(src.fade, defauts.fade, BORNES.fade),
			brightness: curseur(src.brightness, defauts.brightness, BORNES.brightness),
			showHoldRing: typeof src.showHoldRing === 'boolean' ? src.showHoldRing : defauts.showHoldRing,
		};
	};
}
