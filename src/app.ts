/*
 * Mes tours : point d'entrée de l'app.
 *
 * Tous les accessoires de scène dans une seule app, installée à la racine de dezande.github.io.
 * Le menu principal lance chaque tour en plein écran ; l'écrou ⚙ de sa tuile ouvre ses réglages ;
 * la fin de la routine ramène au menu.
 *
 * Organisation de src/ :
 *   app.ts       ce fichier : démarrage et mises à jour automatiques
 *   menu.ts      le menu principal : une tuile par tour, avec son écrou ⚙
 *   scene.ts     le tour ouvert, en plein écran dans un cadre, et le retour au menu
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
import { tourOuvert } from './scene.ts';

void keepScreenAwake();

// Une nouvelle version ne s'affiche que menu principal à l'écran : jamais en plein tour.
setupUpdates({ canReload: () => !tourOuvert() });
