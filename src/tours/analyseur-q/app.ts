/*
 * Analyseur Q (analyseur d'ondes quantiques des cartes à jouer) : point d'entrée de l'app.
 * Accessoire de la routine Rain Man.
 *
 * Un diaporama plein écran, 100 % hors-ligne, pour accompagner la routine.
 *   tap à droite, glisser vers la gauche, → ou télécommande : slide suivante
 *   tap sur le tiers gauche, glisser vers la droite, ←        : slide précédente
 *   appui de 3 s n'importe où, Échap ou M                     : menu
 *   B ou « . » (bouton écran noir des télécommandes)          : écran noir
 *
 * Organisation de src/ :
 *   app.ts       ce fichier : démarrage et mises à jour automatiques
 *   content/     LE TEXTE : slides.ts (les slides, en français et en anglais) et interface.ts (le menu)
 *   stage/       la scène
 *     deck.ts      construction et affichage des slides, ajustement du texte
 *     input.ts     gestes et clavier
 *   settings/    menu et réglages
 *     store.ts     réglages enregistrés sur l'appareil, slide en cours gardée le temps de la session
 *     langue.ts    français ou anglais : textes de l'interface, changement depuis la première slide
 *     panel.ts     menu : aller à une slide, réglages
 *   kit/         code commun des accessoires de scène (sous-module kit-scene, voir son README) :
 *                écran allumé, portrait, hors-ligne et mises à jour, stockage, version
 *   logic/       logique pure, sans DOM, testée sous Node (tests/logic/)
 *     slides.ts      forme d'une slide, mise en valeur, vérification du contenu
 *     deck.ts        position dans le diaporama
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
