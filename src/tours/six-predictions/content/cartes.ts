/*
 * LES SIX PRÉDICTIONS : tout le contenu de la routine est ici, et nulle part ailleurs.
 * Écrire une prédiction ne demande de toucher à aucun autre fichier.
 *
 * Les cartes sont jouées dans l'ordre : la première du tableau est celle du dessus du paquet.
 * Chaque carte porte
 *   texte   la prédiction, écrite à la main au dos de la carte (obligatoire) ;
 *   entete  une petite ligne au-dessus, plus discrète : une date, un nom, un numéro (facultatif).
 *
 * Chaque texte s'écrit dans les deux langues, `{ fr: '…', en: '…' }` — ou une seule fois, en
 * chaîne, quand il est identique dans les deux.
 *
 * Les deux listes ne se traduisent pas mot à mot : chacune est une suite de réactions naturelle
 * dans sa langue. Ce qui compte est l'enchaînement, pas la correspondance terme à terme.
 *
 * La prédiction **remplit la carte** : sa taille est calculée pour occuper toute la place, aussi
 * grande que possible. Un mot court frappe donc plein cadre, et un texte long rétrécit juste ce
 * qu'il faut. Chaque ligne reste d'un seul tenant, jamais coupée au milieu : c'est un retour à la
 * ligne (`\n`) qui décide où ça casse, et nulle part ailleurs.
 *
 * Les tests (tests/logic/cartes.test.ts) vérifient la forme de ce fichier, jamais le sens.
 */

import type { Carte } from '../logic/cartes.ts';

export const CARTES: readonly Carte[] = [
	{ texte: { fr: 'NON!', en: 'NO!' } },
	{ texte: { fr: 'RIEN!', en: 'NEITHER!' } },
	{ texte: { fr: 'NON PLUS!', en: 'NOTHING!' } },
	{ texte: { fr: 'OUPS!', en: 'UYYYY!' } },
	// Un mot par ligne : des retours à la ligne plutôt qu'une phrase qui s'étale.
	{ texte: { fr: 'OUI\nC’EST\nELLE!', en: 'THIS\nONE\nYES!' } },
	{ texte: { fr: 'AUCUNE', en: 'NONE' } },
];
