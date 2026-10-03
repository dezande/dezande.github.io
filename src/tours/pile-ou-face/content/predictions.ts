/*
 * LES DEUX PRÉDICTIONS : tout le texte de la carte est ici, et nulle part ailleurs.
 *
 *   pile  écrite quand on touche la moitié du haut de l'écran ;
 *   face  écrite quand on touche la moitié du bas.
 *
 * Chaque prédiction tient sur deux lignes : c'est le retour à la ligne (`\n`) qui décide où ça
 * casse, et nulle part ailleurs. Elle **remplit la carte** : sa taille est calculée pour occuper
 * toute la place, et un texte sur plusieurs lignes reste toujours d'aplomb.
 *
 * Chaque prédiction s'écrit dans les deux langues, `{ fr: '…', en: '…' }` : la langue choisie
 * dans le menu vaut pour la carte comme pour l'interface. Les tests (tests/logic/predictions.test.ts) vérifient la forme de ce
 * fichier : deux lignes par prédiction, et rien de vide.
 */

import type { Texte } from '../logic/i18n.ts';
import type { Cote } from '../logic/piece.ts';

export const PREDICTIONS: Readonly<Record<Cote, Texte>> = {
	// En anglais, pile se dit « tails » et face « heads » ; le point décimal remplace la virgule.
	pile: { fr: '0,20 euro\npile', en: '0.20 euro\ntails' },
	face: { fr: '0,20 euro\nface', en: '0.20 euro\nheads' },
};
