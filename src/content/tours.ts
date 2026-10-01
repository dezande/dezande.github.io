/*
 * LES TOURS de l'app « Mes tours » : un par accessoire de scène publié sur dezande.github.io.
 *
 * Chaque tour reste une app à part, dans son propre dépôt et son propre dossier du site ; ce menu
 * ne fait que l'ouvrir. L'app « Mes tours » est installée à la racine du site : un tour ouvert
 * depuis ici s'affiche donc dans la même app, en plein écran, et le bouton « Mes tours » du menu
 * de chaque tour ramène ici.
 *
 *   dossier      le dossier du tour sur le site (et le nom de son dépôt) ;
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
