/*
 * Boule de cristal : point d'entrée de l'app.
 *
 * Déroulé d'un tour :
 *   1. le magicien touche discrètement une zone de l'écran (bande ou coin) ;
 *   2. la valeur de cette zone est « armée » : la brume s'agite pendant le délai réglé ;
 *   3. le nombre apparaît dans la boule, l'écran reste verrouillé (plus aucun toucher n'arme) ;
 *   4. un double tap efface le nombre, l'app se réarme pour le tour suivant.
 * Un appui de 3 s n'importe où ouvre les réglages, à tout moment.
 *
 * Organisation de src/ :
 *   app.ts       ce fichier : démarrage et mises à jour automatiques
 *   stage/       la scène vue par le public
 *     touch.ts     gestes : toucher d'une zone, double tap, appui long
 *     ball.ts      phases de la boule : armé, affiché, effacé
 *     dust.ts      particules dorées
 *   settings/    réglages
 *     store.ts     réglages en cours, enregistrement sur l'appareil
 *     panel.ts     panneau de réglages
 *   rehearsal/   aides à la répétition, à masquer avant de jouer
 *     test-mode.ts   mode « Test des zones »
 *     hold-ring.ts   jauge de l'appui long
 *   system/      services du navigateur
 *     dom.ts         accès au DOM et scène
 *   kit/         code commun des accessoires de scène (sous-module kit-scene, voir son README) :
 *                écran allumé, portrait, hors-ligne et mises à jour, version
 *   logic/       logique pure, sans DOM, testée sous Node (tests/logic/)
 *     zone-logic.ts  zone touchée (bandes ou 4 coins)
 *     gestures.ts    décision de chaque geste : armer, effacer, ouvrir les réglages, annuler
 *     settings.ts    forme et validation des réglages
 *   sw/          compilation du service worker du kit (kit/sw/sw.ts)
 *   styles/      styles Sass
 *
 * Importer un module installe ses écouteurs : ce fichier ne fait que le démarrage.
 */

// En premier : la rotation (verrou portrait) est calculée avant que les autres modules mesurent l'écran.
import '../../kit/web/orientation.ts';
import { BUILD } from '../../kit/web/build.ts';
import { keepScreenAwake } from '../../kit/web/wake-lock.ts';
import { enReglages } from '../pont.ts';
import { applySettings, openSettings } from './settings/panel.ts';
import { spawnDust } from './stage/dust.ts';
import './stage/touch.ts';

// Version du build sur la racine du document : invisible en scène, lisible dans l'inspecteur
// et par les tests, qui s'en servent pour reconnaître la version chargée.
document.documentElement.dataset.version = BUILD.version;
applySettings();
spawnDust(18);
void keepScreenAwake();

/* ---------- Dans « Mes tours » ---------- */

// Le hors-ligne et les mises à jour sont ceux de l'app (src/app.ts) : le tour n'enregistre pas de
// service worker à lui.

// Ouvert par l'écrou ⚙ du menu principal : seulement les réglages, que l'on ferme pour revenir.
if (enReglages) openSettings();
