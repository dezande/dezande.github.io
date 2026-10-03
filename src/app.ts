/*
 * Mes tours : point d'entrée de l'app.
 *
 * Tous les accessoires de scène dans une seule app, publiée sur https://dezande.github.io/mes-tours/.
 * Le menu principal lance chaque tour en plein écran ; l'écrou ⚙ de sa tuile ouvre ses réglages ;
 * la fin de la routine ramène au menu.
 *
 * Organisation de src/ :
 *   app.ts       ce fichier : démarrage et mises à jour automatiques
 *   menu.ts      le menu principal : une tuile par tour, avec son écrou ⚙
 *   scene.ts     ouvrir un tour : sa page, à la place du menu
 *   installation.ts  le bandeau « c'est une app », quand elle est ouverte dans le navigateur
 *   content/     LA LISTE DES TOURS : tours.ts
 *   tours/       les tours eux-mêmes, copies de leurs apps, un dossier chacun ;
 *                pont.ts : ce qu'un tour dit à l'app (« fin », « quitter »)
 *   kit/         code commun des accessoires de scène (sous-module kit-scene, voir son README)
 *   version.ts   numéro de version de l'app (semver), affiché en bas du menu
 *   sw/          compilation du service worker du kit (kit/sw/sw.ts)
 *   styles/      styles Sass
 *
 * Importer un module installe ses écouteurs : ce fichier ne fait que le démarrage.
 */

// Rotation calculée avant tout le reste : l'app reste en portrait, comme les tours.
import './kit/web/orientation.ts';
import { setupUpdates } from './kit/web/updates.ts';
import { keepScreenAwake } from './kit/web/wake-lock.ts';
import './menu.ts';
import './installation.ts';

void keepScreenAwake();

// Une nouvelle version s'installe depuis le menu : les tours sont des pages à part, jamais rechargées
// en pleine routine.
setupUpdates({ canReload: () => true });
