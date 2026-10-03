/*
 * Mes tours : point d'entrée de l'app.
 *
 * Tous les accessoires de scène dans une seule app React, publiée sur https://dezande.github.io/mes-tours/.
 * Le menu principal lance chaque tour en plein écran ; l'écrou ⚙ de sa tuile ouvre ses réglages ;
 * l'appui de 3 s pendant un tour ramène au menu.
 *
 * Organisation de src/ :
 *   main.tsx     ce fichier : démarrage, écran allumé, mises à jour automatiques
 *   App.tsx      les pages : le menu (#/) et chaque tour (#/tours/<dossier>)
 *   pages/       le menu principal, et la page qui accueille un tour
 *   components/  composants partagés : boutons tactiles, panneau de réglages, jauge, dos de cartes…
 *   hooks/       hooks partagés (toucher au lever du doigt)
 *   langue/      la langue de l'app (FR / EN), pour le menu et tous les tours
 *   content/     LA LISTE DES TOURS (tours.ts), le texte du menu, les dessins en pixels
 *   tours/       les tours, un dossier chacun : index.tsx (le tour), components/, logic/ (logique
 *                pure, testée sous Node), content/ (textes) ; registre.ts les relie au menu
 *   styles/      TOUTES les feuilles de style Sass (main.scss), un dossier par tour
 *   assets/      polices, images et icône de l'app
 *   kit/         code commun des accessoires de scène (sous-module kit-scene, voir son README)
 *   version.ts   numéro de version de l'app (semver), affiché en bas du menu
 *   sw/          compilation du service worker du kit (kit/sw/sw.ts)
 */

// Rotation calculée avant tout le reste : l'app reste en portrait, et #app doit déjà exister.
import './kit/web/orientation.ts';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';
import { requestPersistentStorage } from './kit/web/storage.ts';
import { setupUpdates } from './kit/web/updates.ts';
import { keepScreenAwake } from './kit/web/wake-lock.ts';
import { estDansUnTour } from './tours/registre.ts';
import './styles/main.scss';

void keepScreenAwake();
// Les réglages des tours et le cache hors-ligne ne doivent jamais être effacés par le navigateur.
void requestPersistentStorage();

// Une nouvelle version s'installe depuis le menu, jamais en pleine routine : pendant un tour, elle
// attend l'ouverture suivante. Le service worker n'existe qu'après le build : pas en développement.
if (import.meta.env.PROD) setupUpdates({ canReload: () => !estDansUnTour() });

createRoot(document.getElementById('app')!).render(
	<StrictMode>
		<App />
	</StrictMode>,
);
