/*
 * Les six prédictions : point d'entrée de l'app.
 *
 * Six cartes empilées, faces en bas, 100 % hors-ligne.
 *   toucher la carte du dessus  : elle se retourne et montre sa prédiction
 *   la toucher à nouveau        : elle sort du cadre, la suivante est dessous
 *   deux touchers sur l'écran vide, ou R : le paquet revient, faces en bas
 *   appui de 3 s n'importe où, Échap ou M : menu
 *
 * Organisation de src/ :
 *   app.ts       ce fichier : démarrage et mises à jour automatiques
 *   content/     LE TEXTE : cartes.ts (les six prédictions, en français et en anglais)
 *                et interface.ts (le menu)
 *   stage/       la scène
 *     paquet.ts    construction des cartes, retournement, sortie du cadre, ajustement du texte
 *     input.ts     gestes et clavier
 *   settings/    menu et réglages
 *     store.ts     réglages enregistrés sur l'appareil (le paquet, lui, repart neuf à chaque ouverture)
 *     langue.ts    français ou anglais : textes de l'interface, changement depuis le menu
 *     panel.ts     menu : aller à une carte, remettre le paquet, réglages
 *   kit/         code commun des accessoires de scène (sous-module kit-scene, voir son README) :
 *                écran allumé, portrait, hors-ligne et mises à jour, stockage, version
 *   logic/       logique pure, sans DOM, testée sous Node (tests/logic/)
 *     cartes.ts      forme d'une carte, vérification du contenu, titre court
 *     paquet.ts      l'état du paquet et ce que chaque toucher en fait
 *     etalement.ts   de combien chaque carte du dessous dépasse de sa voisine, tiré au sort
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
import { enReglages } from '../pont.ts';
import { openMenu } from './settings/panel.ts';
import './stage/input.ts';

void keepScreenAwake();
void requestPersistentStorage();

// Dans « Mes tours », le hors-ligne et les mises à jour sont ceux de l'app (src/app.ts) : le tour
// n'enregistre pas de service worker à lui.

// Ouvert par l'écrou ⚙ du menu principal : seulement les réglages, que l'on ferme pour revenir.
if (enReglages) openMenu();
