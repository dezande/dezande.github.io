/*
 * LE TEXTE DU MENU PRINCIPAL, en français et en anglais. Le nom de l'app, « Mes tours », ne se
 * traduit pas : c'est celui qui est écrit sous l'icône du téléphone.
 *
 * La langue choisie ici (bouton FR / EN, src/langue/) vaut aussi pour tous les tours : elle leur est
 * passée par le pont (src/tours/pont.tsx).
 */

import type { Traduction } from '../logic/i18n.ts';

export const TEXTES = {
	invite: { fr: 'Choisis un tour', en: 'Pick a trick' },
	langue: { fr: 'Langue', en: 'Language' },
	tours: { fr: 'Tours', en: 'Tricks' },
	// « Réglages : Pile ou face » — le français met une espace avant les deux-points, pas l'anglais.
	reglagesDe: { fr: 'Réglages : ', en: 'Settings: ' },
	version: { fr: 'Version', en: 'Version' },
	// Le bandeau d'installation, quand l'app est ouverte dans le navigateur (src/pages/Installation.tsx).
	installationTitre: { fr: 'Mes tours est une app', en: 'Mes tours is an app' },
	installationIphone: {
		fr: 'Installe-la pour l’avoir en plein écran, même hors-ligne : Partager → Sur l’écran d’accueil.',
		en: 'Install it to get it full screen, even offline: Share → Add to Home Screen.',
	},
	installationAutres: {
		fr: 'Installe-la pour l’avoir en plein écran, même hors-ligne : menu ⋮ → Installer l’application.',
		en: 'Install it to get it full screen, even offline: menu ⋮ → Install app.',
	},
	// Quand le navigateur propose lui-même l'installation : le bouton suffit.
	installationDirecte: {
		fr: 'Installe-la pour l’avoir en plein écran, même hors-ligne.',
		en: 'Install it to get it full screen, even offline.',
	},
	installer: { fr: 'Installer', en: 'Install' },
} as const satisfies Record<string, Traduction>;
