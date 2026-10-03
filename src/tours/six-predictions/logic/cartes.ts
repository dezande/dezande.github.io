/*
 * Forme d'une carte à prédiction et vérification du contenu.
 * Fonctions pures, sans DOM : testées sous Node (tests/logic/cartes.test.ts).
 * Le contenu lui-même est dans content/cartes.ts.
 */

import { isTexte, t, type Lang, type Texte } from './i18n.ts';

export interface Carte {
	/** La prédiction, écrite à la main au dos de la carte. C'est le seul champ obligatoire. */
	texte: Texte;
	/** Petite ligne au-dessus de la prédiction, plus discrète : une date, un nom, un numéro. */
	entete?: Texte;
}

/** Champs admis dans une carte : tout autre nom est une faute de frappe, signalée par checkCartes(). */
const CHAMPS = ['texte', 'entete'] as const;

/**
 * Fautes trouvées dans une liste de cartes : champ obligatoire manquant, champ inconnu,
 * texte vide ou traduction incomplète. Une liste vide veut dire que tout va bien.
 * Appelée par les tests (tests/logic/cartes.test.ts) : une faute de frappe ne part jamais en scène.
 */
export function checkCartes(cartes: readonly unknown[]): string[] {
	const fautes: string[] = [];
	cartes.forEach((raw, i) => {
		const numero = `carte ${i + 1}`;
		if (!raw || typeof raw !== 'object') {
			fautes.push(`${numero} : ce n'est pas une carte`);
			return;
		}
		const carte = raw as Record<string, unknown>;
		for (const champ of Object.keys(carte)) {
			if (!CHAMPS.includes(champ as (typeof CHAMPS)[number])) fautes.push(`${numero} : champ inconnu « ${champ} »`);
		}
		if (!isTexte(carte.texte)) fautes.push(`${numero} : « texte » manquant ou incomplet (les deux langues sont obligatoires)`);
		if (carte.entete !== undefined && !isTexte(carte.entete)) fautes.push(`${numero} : « entete » incomplet`);
	});
	return fautes;
}

/** Titre court d'une carte dans la liste du menu : le début de sa prédiction. */
export function carteLabel(carte: Carte | undefined, lang: Lang, max = 40): string {
	const texte = (t(carte?.texte, lang) ?? '').replace(/\s+/g, ' ').trim();
	if (texte.length <= max) return texte;
	// Coupe au dernier mot entier qui tient, pour ne pas laisser une syllabe orpheline.
	const coupe = texte.slice(0, max);
	const espace = coupe.lastIndexOf(' ');
	return `${(espace > max / 2 ? coupe.slice(0, espace) : coupe).trimEnd()}…`;
}
