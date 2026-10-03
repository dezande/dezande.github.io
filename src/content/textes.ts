/*
 * LE TEXTE DU MENU PRINCIPAL, en français et en anglais. Le nom de l'app, « Mes tours », ne se
 * traduit pas : c'est celui qui est écrit sous l'icône du téléphone.
 *
 * La langue choisie ici (bouton FR / EN, src/langue.ts) vaut aussi pour tous les tours : elle leur
 * est passée à l'ouverture (src/scene.ts, src/tours/pont.ts).
 */

export const LANGUES = ['fr', 'en'] as const;
export type Langue = (typeof LANGUES)[number];

/** Un texte dans les deux langues. */
export type Texte = Readonly<Record<Langue, string>>;

export const TEXTES = {
	invite: { fr: 'Choisis un tour', en: 'Pick a trick' },
	langue: { fr: 'Langue', en: 'Language' },
	tours: { fr: 'Tours', en: 'Tricks' },
	// « Réglages : Pile ou face » — le français met une espace avant les deux-points, pas l'anglais.
	reglagesDe: { fr: 'Réglages : ', en: 'Settings: ' },
	version: { fr: 'Version', en: 'Version' },
} as const satisfies Record<string, Texte>;
