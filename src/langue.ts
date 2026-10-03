/*
 * La langue de l'app, choisie par le bouton FR / EN du menu principal et enregistrée sur
 * l'appareil. Elle vaut pour le menu comme pour tous les tours (src/scene.ts la leur passe).
 * À la toute première ouverture : anglais si le téléphone est en anglais, français sinon.
 */

import { LANGUES, type Langue } from './content/textes.ts';
import { readStored, writeStored } from './kit/web/storage.ts';

const CLE = 'mes-tours:langue';

const estLangue = (valeur: unknown): valeur is Langue => LANGUES.includes(valeur as Langue);

/** Langue du téléphone : anglais s'il est en anglais, français sinon. */
function langueDuTelephone(): Langue {
	const premiere = (navigator.languages ?? []).map((tag) => tag.toLowerCase().split('-')[0]).find(estLangue);
	return premiere ?? 'fr';
}

let langueEnCours: Langue = ((enregistree) => (estLangue(enregistree) ? enregistree : langueDuTelephone()))(readStored(CLE));

export const langue = (): Langue => langueEnCours;

const ecouteurs = new Set<() => void>();

/** À rappeler quand la langue change (reconstruction du menu). */
export function onLangue(ecouteur: () => void): void {
	ecouteurs.add(ecouteur);
}

export function setLangue(nouvelle: Langue): void {
	if (nouvelle === langueEnCours) return;
	langueEnCours = nouvelle;
	writeStored(CLE, nouvelle);
	document.documentElement.lang = nouvelle;
	for (const ecouteur of ecouteurs) ecouteur();
}

document.documentElement.lang = langueEnCours;
