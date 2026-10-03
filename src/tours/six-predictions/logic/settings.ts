/*
 * Réglages : forme, valeurs par défaut et validation.
 * Fonctions pures, sans DOM ni localStorage : testées sous Node (tests/logic/settings.test.ts).
 * Les réglages relus sur l'appareil peuvent venir d'une ancienne version ou être abîmés :
 * tout passe par sanitizeSettings() avant d'être utilisé.
 */

import { isLang, type Lang } from './i18n.ts';

/** Les dessins de dos, tels qu'ils sont tracés (stage/dos.ts). */
export const DESSINS = ['deco', 'nouveau', 'pixel', 'minimal', 'pop', 'futuriste'] as const;
export type Dessin = (typeof DESSINS)[number];

/** Ce qui se choisit dans le menu : un dessin, ou « mix » — un dessin différent par carte. */
export const MOTIFS = [...DESSINS, 'mix'] as const;
export type Motif = (typeof MOTIFS)[number];

/** Les couleurs de dos, telles qu'elles sont peintes (styles/_cartes.scss). */
export const TEINTES = ['noir', 'rouge', 'bleu', 'blanc'] as const;
export type Teinte = (typeof TEINTES)[number];

/** Ce qui se choisit dans le menu : une couleur, ou « mix » — une couleur différente par carte. */
export const COULEURS = [...TEINTES, 'mix'] as const;
export type Couleur = (typeof COULEURS)[number];

/**
 * Le dessin du dos de la carte `index`. Avec « mix », les dessins se suivent d'une carte à
 * l'autre : le paquet de six en montre six différents, toujours dans le même ordre — on sait donc
 * d'avance ce qu'on va voir, ce qui compte pour un accessoire de scène.
 */
export const dessinDeCarte = (motif: Motif, index: number): Dessin =>
	motif === 'mix' ? DESSINS[((index % DESSINS.length) + DESSINS.length) % DESSINS.length]! : motif;

/** La couleur du dos de la carte `index`. Avec « mix », les couleurs se suivent de la même façon. */
export const teinteDeCarte = (couleur: Couleur, index: number): Teinte =>
	couleur === 'mix' ? TEINTES[((index % TEINTES.length) + TEINTES.length) % TEINTES.length]! : couleur;

export interface Settings {
	/** Langue des prédictions et de l'interface. */
	langue: Lang;
	/** Dessin du dos des cartes, ou « mix » : un dessin différent par carte. */
	motif: Motif;
	/** Couleur du dos des cartes, ou « mix » : une couleur différente par carte. */
	couleur: Couleur;
	/** Jauge de l'appui long : aide visuelle, à masquer si le public voit l'écran. */
	showHoldRing: boolean;
}

/**
 * Valeurs par défaut. La langue par défaut dépend du téléphone (i18n.ts : deviceLang) :
 * elle est passée à sanitizeSettings, celle inscrite ici n'est qu'un dernier recours.
 */
export const DEFAULTS: Readonly<Settings> = Object.freeze({
	langue: 'fr',
	motif: 'deco',
	couleur: 'noir',
	showHoldRing: true,
});

const bool = (v: unknown, fallback: boolean): boolean => (typeof v === 'boolean' ? v : fallback);
const isMotif = (v: unknown): v is Motif => (MOTIFS as readonly string[]).includes(v as string);
const isCouleur = (v: unknown): v is Couleur => (COULEURS as readonly string[]).includes(v as string);

/**
 * Réglages valides à partir de n'importe quelle donnée : chaque champ invalide reprend sa valeur
 * par défaut. `defaultLang` est la langue à prendre quand aucune n'est enregistrée (celle du
 * téléphone, calculée par l'app) ; avec `null`, tout revient aux valeurs par défaut.
 */
export function sanitizeSettings(raw: unknown, defaultLang: Lang = DEFAULTS.langue): Settings {
	const src: Partial<Record<keyof Settings, unknown>> = raw && typeof raw === 'object' ? raw : {};
	return {
		langue: isLang(src.langue) ? src.langue : defaultLang,
		motif: isMotif(src.motif) ? src.motif : DEFAULTS.motif,
		couleur: isCouleur(src.couleur) ? src.couleur : DEFAULTS.couleur,
		showHoldRing: bool(src.showHoldRing, DEFAULTS.showHoldRing),
	};
}
