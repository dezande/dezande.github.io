/*
 * Le registre des tours : pour chaque dossier de content/tours.ts, son composant (chargé seulement
 * à la première ouverture du tour) et la couleur de la barre du téléphone pendant le tour.
 *
 * Ajouter un tour : son dossier dans src/tours/<dossier>/ avec son index.tsx, ses styles dans
 * src/styles/tours/<dossier>/, une ligne dans content/tours.ts et une ici.
 */

import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export interface EntreeDuRegistre {
	/** Le tour lui-même : sa scène, et ses réglages quand il est ouvert par l'écrou ⚙. */
	Composant: LazyExoticComponent<ComponentType>;
	/** La couleur de la barre du téléphone (meta theme-color), celle du fond du tour. */
	couleurTheme: string;
}

export const REGISTRE: Readonly<Record<string, EntreeDuRegistre>> = {
	'boule-de-cristal': {
		Composant: lazy(() => import('./boule-de-cristal/index.tsx')),
		couleurTheme: '#05020b',
	},
	'carte-de-visite': {
		Composant: lazy(() => import('./carte-de-visite/index.tsx')),
		couleurTheme: '#140b05',
	},
	'pile-ou-face': {
		Composant: lazy(() => import('./pile-ou-face/index.tsx')),
		couleurTheme: '#071a0f',
	},
	'six-predictions': {
		Composant: lazy(() => import('./six-predictions/index.tsx')),
		couleurTheme: '#071a0f',
	},
	'analyseur-q': {
		Composant: lazy(() => import('./analyseur-q/index.tsx')),
		couleurTheme: '#0b0b0d',
	},
};

/** L'adresse d'un tour dans l'app ; `reglages` : seulement ses réglages (écrou ⚙). */
export const adresseDuTour = (dossier: string, reglages = false): string => `/tours/${dossier}${reglages ? '?reglages' : ''}`;

/** Un tour est-il ouvert ? (Une nouvelle version ne s'installe jamais pendant un tour.) */
export const estDansUnTour = (): boolean => location.hash.startsWith('#/tours/');
