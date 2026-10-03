/*
 * La langue de l'app au démarrage : celle enregistrée sur l'appareil par le bouton FR / EN du menu,
 * sinon celle du téléphone (anglais s'il est en anglais, français sinon). Elle vaut pour le menu
 * comme pour tous les tours (LangueContext.tsx).
 */

import { LANGUES, type Langue } from '../content/textes.ts';
import { readStored, writeStored } from '../kit/web/storage.ts';

const CLE = 'mes-tours:langue';

const estLangue = (valeur: unknown): valeur is Langue => LANGUES.includes(valeur as Langue);

/** Langue du téléphone : anglais s'il est en anglais, français sinon. */
function langueDuTelephone(): Langue {
	const premiere = (navigator.languages ?? []).map((tag) => tag.toLowerCase().split('-')[0]).find(estLangue);
	return premiere ?? 'fr';
}

export function langueDeDepart(): Langue {
	const enregistree = readStored(CLE);
	return estLangue(enregistree) ? enregistree : langueDuTelephone();
}

export function enregistrerLangue(langue: Langue): void {
	writeStored(CLE, langue);
}
