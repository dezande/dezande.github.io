/*
 * Pile ou face : point d'entrée de l'app.
 *
 * Une carte à prédiction, face cachée, 100 % hors-ligne. Le même système que la boule de cristal :
 *   toucher la moitié du haut   : la carte se retourne sur « 0,20 euro pile »
 *   toucher la moitié du bas    : la carte se retourne sur « 0,20 euro face »
 *   (après le délai réglé dans le menu ; 0 s par défaut, au toucher)
 *   deux touchers rapprochés, ou R : la carte revient face cachée
 *   appui de 3 s n'importe où, Échap ou M : menu
 *
 * Organisation de src/ :
 *   app.ts       ce fichier : démarrage et mises à jour automatiques
 *   content/     LE TEXTE : predictions.ts (pile et face) et interface.ts (le menu)
 *   stage/       la scène
 *     carte.ts     construction de la carte, prédiction écrite, retournement, ajustement du texte
 *     dos.ts       les six dessins de dos, repris des six prédictions
 *     ecriture.ts  le soulignement tracé à la main sous la prédiction
 *     input.ts     gestes (haut ou bas de l'écran) et clavier
 *   settings/    menu et réglages
 *     store.ts     réglages enregistrés sur l'appareil (la carte, elle, repart face cachée à chaque ouverture)
 *     langue.ts    français ou anglais : textes de l'interface, changement depuis le menu
 *     panel.ts     menu : remettre la carte, délai, langue, dos de la carte
 *   kit/         code commun des accessoires de scène (sous-module kit-scene, voir son README) :
 *                écran allumé, portrait, hors-ligne et mises à jour, stockage, version
 *   logic/       logique pure, sans DOM, testée sous Node (tests/logic/)
 *     piece.ts       l'état de la carte, et pile ou face selon la moitié touchée
 *     gestures.ts    décision de chaque geste
 *     keys.ts        touches du clavier
 *     settings.ts    forme et validation des réglages
 *     i18n.ts        les deux langues : textes traduits, langue du téléphone
 *   version.ts   numéro de version de l'app (semver), affiché dans le menu
 *   sw/          compilation du service worker du kit (kit/sw/sw.ts)
 *   styles/      styles Sass
 *
 * Importer un module installe ses écouteurs : ce fichier ne fait que le démarrage.
 */

import { requestPersistentStorage } from '../../kit/web/storage.ts';
import { keepScreenAwake } from '../../kit/web/wake-lock.ts';
import { boutonsTactiles } from '../boutons-tactiles.ts';
import { enReglages, remplirEntete } from '../pont.ts';
import { openMenu } from './settings/panel.ts';
import './stage/input.ts';

void keepScreenAwake();
void requestPersistentStorage();

// Dans « Mes tours », le hors-ligne et les mises à jour sont ceux de l'app (src/app.ts) : le tour
// n'enregistre pas de service worker à lui.

// L'en-tête des réglages, le même pour tous les tours : « Réglages » et le nom du tour.
remplirEntete();

// Les boutons des réglages agissent au lever du doigt, appui bref ou long (Android).
const panneau = document.querySelector<HTMLElement>('#menu');
if (panneau) boutonsTactiles(panneau);

// Ouvert par l'écrou ⚙ du menu principal : seulement les réglages, que l'on ferme pour revenir.
if (enReglages) openMenu();
