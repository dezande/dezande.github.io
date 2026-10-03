/*
 * Réglages enregistrés sur l'appareil (localStorage). Validation : logic/settings.ts.
 *
 * L'état du paquet, lui, n'est enregistré nulle part : chaque ouverture de l'app repart d'un
 * paquet neuf, six cartes faces en bas, dans un nouvel étalement. C'est ce qu'on attend d'un
 * accessoire de scène — on l'ouvre pour jouer, pas pour reprendre la routine précédente.
 *
 * Les réglages sont conservés d'une version à l'autre : une mise à jour ne remplace que le cache
 * hors-ligne (sw/sw.ts), jamais le localStorage. Renommer une clé ferait perdre les réglages :
 * garder l'ancienne clé en relecture le jour où l'une changerait de nom. Un nouveau réglage prend
 * sa valeur par défaut sans toucher aux autres (sanitizeSettings).
 */

import { readStored, writeStored } from '../../../kit/web/storage.ts';
import { langueDemandee } from '../../pont.ts';
import { deviceLang } from '../logic/i18n.ts';
import { sanitizeSettings, type Settings } from '../logic/settings.ts';

const SETTINGS_KEY = 'six-predictions:settings:v1';

/**
 * Langue de départ, tant qu'aucune n'a été choisie : celle du téléphone (anglais s'il est en
 * anglais, français sinon). Le choix fait dans l'app est ensuite enregistré comme les autres
 * réglages, et « Rétablir les réglages par défaut » revient à la langue du téléphone.
 */
// Dans « Mes tours », la langue est celle du bouton FR / EN du menu principal, pour tous les tours.
const DEFAULT_LANG = langueDemandee ?? deviceLang(navigator.languages);

/**
 * Réglages en cours. Les autres modules lisent ce binding (toujours à jour) et peuvent modifier
 * ses champs, puis appellent storeSettings() pour valider et enregistrer.
 */
export let settings: Settings = { ...sanitizeSettings(readStored(SETTINGS_KEY), DEFAULT_LANG), ...(langueDemandee ? { langue: langueDemandee } : {}) };

/** Valide et enregistre les réglages. Avec `null` : rétablit les réglages par défaut. */
export function storeSettings(next: unknown = settings): void {
	settings = sanitizeSettings(next, DEFAULT_LANG);
	writeStored(SETTINGS_KEY, settings);
}
