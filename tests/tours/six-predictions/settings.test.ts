// Réglages : valeurs par défaut et validation de ce qui est relu sur l'appareil.
import { COULEURS, DEFAULTS, DESSINS, MOTIFS, TEINTES, dessinDeCarte, sanitizeSettings, teinteDeCarte } from '../../../src/tours/six-predictions/logic/settings.ts';

test('des réglages valides sont gardés tels quels', () => {
	const valides = { langue: 'en', motif: 'nouveau', couleur: 'rouge', showHoldRing: false } as const;
	expect(sanitizeSettings(valides)).toStrictEqual(valides);
});

test('chaque champ invalide reprend sa valeur par défaut, sans toucher aux autres', () => {
	expect(sanitizeSettings({ langue: 'de', motif: 'nouveau', couleur: 'rouge', showHoldRing: false })).toStrictEqual({ langue: DEFAULTS.langue, motif: 'nouveau', couleur: 'rouge', showHoldRing: false });
	expect(sanitizeSettings({ motif: 'baroque', couleur: 'rouge', showHoldRing: false }, 'en')).toStrictEqual({ langue: 'en', motif: DEFAULTS.motif, couleur: 'rouge', showHoldRing: false });
	expect(sanitizeSettings({ langue: 'fr', motif: 'deco', couleur: 'vert', showHoldRing: 'oui' })).toStrictEqual({ langue: 'fr', motif: 'deco', couleur: DEFAULTS.couleur, showHoldRing: DEFAULTS.showHoldRing });
});

test('des données absentes ou abîmées donnent les réglages par défaut', () => {
	for (const raw of [null, undefined, 'x', 42, []]) expect(sanitizeSettings(raw)).toStrictEqual(DEFAULTS);
});

test('les réglages d’une version précédente sont repris, les dos disparus revenant au défaut', () => {
	// La version 0.1.0 avait un seul réglage « dos » (bleu, rouge, encre), remplacé par le motif
	// et la couleur : la langue et les autres choix, eux, doivent survivre à la mise à jour.
	expect(sanitizeSettings({ langue: 'en', dos: 'encre', showHoldRing: false })).toStrictEqual({ langue: 'en', motif: DEFAULTS.motif, couleur: DEFAULTS.couleur, showHoldRing: false });
});

test('la langue du téléphone sert de défaut tant qu’aucune n’est enregistrée', () => {
	expect(sanitizeSettings(null, 'en').langue).toBe('en');
	expect(sanitizeSettings({ langue: 'fr' }, 'en').langue).toBe('fr');
});

test('tous les dos proposés sont acceptés, « mélange » compris', () => {
	for (const motif of MOTIFS) expect(sanitizeSettings({ motif }).motif).toBe(motif);
	for (const couleur of COULEURS) expect(sanitizeSettings({ couleur }).couleur).toBe(couleur);
	expect(MOTIFS.includes('mix') && COULEURS.includes('mix')).toBeTruthy();
});

test('un dos choisi vaut pour toutes les cartes', () => {
	for (const dessin of DESSINS) {
		for (let i = 0; i < 6; i++) expect(dessinDeCarte(dessin, i)).toBe(dessin);
	}
	for (const teinte of TEINTES) {
		for (let i = 0; i < 6; i++) expect(teinteDeCarte(teinte, i)).toBe(teinte);
	}
});

test('« mélange » : les dessins et les couleurs se suivent d’une carte à l’autre', () => {
	const dessins = [0, 1, 2, 3, 4, 5].map((i) => dessinDeCarte('mix', i));
	expect(dessins, 'le paquet de six montre les six dessins, dans l’ordre').toStrictEqual([...DESSINS]);
	const teintes = [0, 1, 2, 3, 4, 5].map((i) => teinteDeCarte('mix', i));
	expect(teintes, 'quatre couleurs pour six cartes : elles recommencent').toStrictEqual([...TEINTES, TEINTES[0], TEINTES[1]]);
});

test('« mélange » : un index inattendu donne quand même un dos valide', () => {
	for (const index of [-1, -7, 99, 1000]) {
		expect(DESSINS.includes(dessinDeCarte('mix', index)), `dessin pour ${index}`).toBeTruthy();
		expect(TEINTES.includes(teinteDeCarte('mix', index)), `couleur pour ${index}`).toBeTruthy();
	}
});
