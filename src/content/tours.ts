/*
 * LES TOURS de l'app « Mes tours » : un par accessoire de scène.
 *
 * Chaque tour est une copie de son app, dans src/tours/<dossier>/ (code) et public/tours/<dossier>/
 * (page et fichiers) ; ses dépôts d'origine ne sont pas touchés. Il s'ouvre en plein écran depuis
 * sa tuile, ses réglages depuis l'écrou ⚙, et revient ici à la fin de sa routine (src/scene.ts).
 *
 *   dossier      le dossier du tour dans l'app (et le nom de son dépôt d'origine) ;
 *   nom          ce qui est écrit sur la tuile ;
 *   description  une ligne pour se souvenir de ce qu'il fait.
 *
 * L'icône de chaque tour est public/tours/<dossier>.png, copie de la sienne. Les tests
 * (tests/logic/tours.test.ts) vérifient la forme de ce fichier et la présence des icônes.
 */

export interface Tour {
	dossier: string;
	nom: string;
	description: string;
}

export const TOURS: readonly Tour[] = [
	{ dossier: 'boule-de-cristal', nom: 'Boule de cristal', description: 'Un nombre apparaît dans la boule' },
	{ dossier: 'pile-ou-face', nom: 'Pile ou face', description: '0,20 euro, pile en haut, face en bas' },
	{ dossier: 'six-predictions', nom: 'Les six prédictions', description: 'Six cartes qui se retournent une à une' },
	{ dossier: 'analyseur-q', nom: 'Analyseur Q', description: 'Le diaporama de l’analyseur AQ‑52' },
];
