/*
 * LES TOURS de l'app « Mes tours » : un par accessoire de scène.
 *
 * Chaque tour a son code dans src/tours/<dossier>/ (branché par src/tours/registre.ts) et ses styles
 * dans src/styles/tours/<dossier>/ ; ses dépôts d'origine ne sont pas touchés. Il s'ouvre en plein
 * écran depuis sa tuile, ses réglages depuis l'écrou ⚙ (src/pages/PageTour.tsx), et revient ici par
 * l'appui de 3 s.
 *
 *   dossier      le dossier du tour dans l'app (et le nom de son dépôt d'origine) ;
 *   nom          ce qui est écrit sur la tuile, en français et en anglais ;
 *   description  une ligne pour se souvenir de ce qu'il fait, dans les deux langues.
 *
 * L'icône de chaque tour est dessinée en pixels dans content/pixels.ts. Les tests
 * (tests/logic/tours.test.ts) vérifient la forme de ce fichier et la présence de chaque copie.
 */

import type { Texte } from './textes.ts';

export interface Tour {
	dossier: string;
	nom: Texte;
	description: Texte;
}

export const TOURS: readonly Tour[] = [
	{
		dossier: 'boule-de-cristal',
		nom: { fr: 'Boule de cristal', en: 'Crystal ball' },
		description: { fr: 'Un nombre apparaît dans la boule', en: 'A number appears in the ball' },
	},
	{
		// La routine Arcane Système, qui était jouée dans la boule de cristal : la carte de visite d'une
		// carte du Théâtre Robert-Houdin, avec le numéro au dos.
		dossier: 'carte-de-visite',
		nom: { fr: 'Carte de visite', en: 'Business card' },
		description: { fr: 'Elle se retourne : le numéro est au dos', en: 'It turns over: the number is on the back' },
	},
	{
		dossier: 'pile-ou-face',
		nom: { fr: 'Pile ou face', en: 'Heads or tails' },
		description: { fr: '0,20 euro, pile en haut, face en bas', en: '20 cents: tails at the top, heads at the bottom' },
	},
	{
		dossier: 'six-predictions',
		nom: { fr: 'Les six prédictions', en: 'The six predictions' },
		description: { fr: 'Six cartes qui se retournent une à une', en: 'Six cards that turn over one by one' },
	},
	{
		// « Analyseur Q » est le nom de l'appareil : le même dans les deux langues, comme dans le tour.
		dossier: 'analyseur-q',
		nom: { fr: 'Analyseur Q', en: 'Analyseur Q' },
		description: { fr: 'Le diaporama de l’analyseur AQ‑52', en: 'The AQ‑52 analyser slideshow' },
	},
];
