/*
 * La langue de l'app, choisie par le bouton FR / EN du menu principal et enregistrée sur
 * l'appareil. Tous les composants la lisent avec useLangue() : le menu comme chaque tour, qui n'ont
 * plus de choix de langue à eux.
 */

import { createContext, type ComponentChildren } from 'preact';
import { useCallback, useContext, useLayoutEffect, useMemo, useState } from 'preact/hooks';
import type { Lang } from '../logic/i18n.ts';
import { enregistrerLangue, langueDeDepart } from './langue.ts';

interface ContexteLangue {
	langue: Lang;
	setLangue: (langue: Lang) => void;
}

const Contexte = createContext<ContexteLangue | null>(null);

export function LangueProvider({ children }: { children: ComponentChildren }) {
	const [langue, setLangueEnCours] = useState<Lang>(langueDeDepart);

	// La langue du document, pour les lecteurs d'écran : posée avant l'affichage.
	useLayoutEffect(() => {
		document.documentElement.lang = langue;
	}, [langue]);

	const setLangue = useCallback((nouvelle: Lang) => {
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
