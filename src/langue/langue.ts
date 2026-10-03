/*
 * La langue de l'app au démarrage : celle enregistrée sur l'appareil par le bouton FR / EN du menu,
 * sinon celle du téléphone (anglais s'il est en anglais, français sinon). Elle vaut pour le menu
 * comme pour tous les tours (LangueContext.tsx).
 */

import { deviceLang, isLang, type Lang } from '../logic/i18n.ts';
import { readStored, writeStored } from '../kit/web/storage.ts';

const CLE = 'mes-tours:langue';

export function langueDeDepart(): Lang {
	const enregistree = readStored(CLE);
	return isLang(enregistree) ? enregistree : deviceLang(navigator.languages);
}

export function enregistrerLangue(langue: Lang): void {
	writeStored(CLE, langue);
}
