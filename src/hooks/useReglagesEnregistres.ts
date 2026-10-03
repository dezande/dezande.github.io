/*
 * Les réglages d'un tour, enregistrés sur l'appareil (localStorage, kit/web/storage.ts) et gardés
 * d'une ouverture à l'autre. Une mise à jour de l'app ne remplace que le cache hors-ligne, jamais le
 * localStorage : renommer une clé ferait perdre les réglages (garder l'ancienne dans `anciennesCles`).
 *
 * Les réglages relus peuvent venir d'une ancienne version ou être abîmés : tout passe par
 * `valider` (la fonction sanitizeSettings de chaque tour, testée sous Node), qui redonne sa valeur
 * par défaut à chaque champ invalide.
 *
 *   const [reglages, enregistrer] = useReglagesEnregistres('pile-ou-face:settings:v1', valider);
 *   enregistrer({ ...reglages, delai: 2 });   // valide, enregistre, affiche
 *   enregistrer(null);                         // réglages par défaut
 */

import { useCallback, useState } from 'react';
import { readStored, writeStored } from '../kit/web/storage.ts';

export function useReglagesEnregistres<T>(cle: string, valider: (brut: unknown) => T, ...anciennesCles: string[]): [T, (suivants: T | null) => void] {
	const [reglages, setReglages] = useState<T>(() => valider(readStored(cle, ...anciennesCles)));

	const enregistrer = useCallback((suivants: T | null) => {
		const valides = valider(suivants);
		writeStored(cle, valides);
		setReglages(valides);
	}, [cle, valider]);

	return [reglages, enregistrer];
}
