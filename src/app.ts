/*
 * Mes tours : point d'entrée de l'app.
 *
 * Le menu principal de tous les accessoires de scène, installé à la racine de dezande.github.io.
 * Chrome sur Android ne gère bien qu'une app installée par site : plutôt que d'installer chaque
 * tour, on installe celle-ci, et chaque tour s'ouvre dedans, en plein écran.
 *
 * Organisation de src/ :
 *   app.ts       ce fichier : démarrage et mises à jour automatiques
 *   menu.ts      le menu : une tuile par tour
 *   content/     LA LISTE DES TOURS : tours.ts
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
import './menu.ts';

// Le menu n'a rien en cours : une nouvelle version peut s'afficher dès qu'elle est installée.
setupUpdates({ canReload: () => true });
