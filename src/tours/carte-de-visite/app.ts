/*
 * Carte de visite : point d'entrée du tour, la routine Arcane Système.
 *
 * Le tour se joue téléphone tenu en largeur (system/paysage.ts).
 * Sur une vieille table de bois, la carte de visite du Théâtre Robert-Houdin, le théâtre de magie de
 * Jean-Eugène Robert-Houdin (1845), au 8, boulevard des Italiens, démoli en 1924. Déroulé d'un tour :
 *   1. le magicien touche discrètement un des 4 coins de l'écran ;
 *   2. le numéro de ce coin (17, 19, 21 ou 23) est « armé » : rien ne bouge pendant le délai réglé ;
 *   3. la carte se retourne : au dos, le numéro seul, en grand, écrit à la plume ; l'écran reste
 *      verrouillé ;
 *   4. un double tap remet la carte sur son recto, pour le tour suivant.
 * Un appui de 3 s n'importe où ramène au menu de « Mes tours », à tout moment.
 *
 * Les gestes sont ceux de la boule de cristal, dont ce tour est issu (l'ancienne routine Arcane
 * Système de la boule) :
 *   stage/       la scène vue par le public
 *     touch.ts     gestes : toucher d'un coin, double tap, appui long
 *     carte.ts     phases de la carte : armé, retournée, revenue sur son recto
 *     table.ts     la vieille table de bois, dessinée au démarrage
 *   settings/    réglages (store.ts : enregistrement sur l'appareil ; panel.ts : panneau)
 *   rehearsal/   aides à la répétition : test des zones, jauge de l'appui long
 *   logic/       logique pure, sans DOM, testée sous Node (tests/tours/carte-de-visite/)
 *
 * Importer un module installe ses écouteurs : ce fichier ne fait que le démarrage.
 */

// En premier : la rotation (verrou paysage, propre à ce tour) est calculée avant que les autres
// modules mesurent l'écran.
import './system/paysage.ts';
import { BUILD } from '../../kit/web/build.ts';
import { keepScreenAwake } from '../../kit/web/wake-lock.ts';
import { boutonsTactiles } from '../boutons-tactiles.ts';
import { enReglages, remplirEntete } from '../pont.ts';
import { applySettings, openSettings } from './settings/panel.ts';
import { dessinerTable } from './stage/table.ts';
import './stage/touch.ts';

// Version du build sur la racine du document : invisible en scène, lisible dans l'inspecteur
// et par les tests, qui s'en servent pour reconnaître la version chargée.
document.documentElement.dataset.version = BUILD.version;
applySettings();
dessinerTable();
void keepScreenAwake();

// Le hors-ligne et les mises à jour sont ceux de l'app (src/app.ts) : le tour n'enregistre pas de
// service worker à lui.

// L'en-tête des réglages, le même pour tous les tours : « Réglages » et le nom du tour.
remplirEntete();

// Les boutons des réglages agissent au lever du doigt, appui bref ou long (Android).
const panneau = document.querySelector<HTMLElement>('#settings');
if (panneau) boutonsTactiles(panneau);

// Ouvert par l'écrou ⚙ du menu principal : seulement les réglages, que l'on ferme pour revenir.
if (enReglages) openSettings();
