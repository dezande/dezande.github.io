/*
 * La langue de l'app, choisie par le bouton FR / EN du menu principal et enregistrée sur
 * l'appareil. Tous les composants la lisent avec useLangue() : le menu comme chaque tour, qui n'ont
 * plus de choix de langue à eux.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Langue } from '../content/textes.ts';
import { enregistrerLangue, langueDeDepart } from './langue.ts';

interface ContexteLangue {
	langue: Langue;
	setLangue: (langue: Langue) => void;
}

const Contexte = createContext<ContexteLangue | null>(null);

export function LangueProvider({ children }: { children: ReactNode }) {
	const [langue, setLangueEnCours] = useState<Langue>(langueDeDepart);

	// La langue du document, pour les lecteurs d'écran.
	useEffect(() => {
		document.documentElement.lang = langue;
	}, [langue]);

	const setLangue = useCallback((nouvelle: Langue) => {
		enregistrerLangue(nouvelle);
		setLangueEnCours(nouvelle);
	}, []);

	const valeur = useMemo(() => ({ langue, setLangue }), [langue, setLangue]);
	return <Contexte.Provider value={valeur}>{children}</Contexte.Provider>;
}

export function useLangue(): ContexteLangue {
	const contexte = useContext(Contexte);
	if (!contexte) throw new Error('useLangue() hors de <LangueProvider>');
	return contexte;
}
