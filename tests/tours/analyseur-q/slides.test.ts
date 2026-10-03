// Mise en valeur, paragraphes, vérification des slides… et vérification du vrai contenu (content/slides.ts).
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { SLIDES } from '../../../src/tours/analyseur-q/content/slides.ts';
import { checkSlides, paragraphs, parseInline, slideLabel } from '../../../src/tours/analyseur-q/logic/slides.ts';

test('parseInline : **mises en valeur**', () => {
	expect(parseInline('un **mot** ici')).toStrictEqual([
		{ text: 'un ', strong: false },
		{ text: 'mot', strong: true },
		{ text: ' ici', strong: false },
	]);
	expect(parseInline('**tout**')).toStrictEqual([{ text: 'tout', strong: true }]);
	expect(parseInline('rien')).toStrictEqual([{ text: 'rien', strong: false }]);
});

test('parseInline : un ** sans partenaire reste visible', () => {
	expect(parseInline('a **b')).toStrictEqual([{ text: 'a **b', strong: false }]);
	expect(parseInline('**a** et **b')).toStrictEqual([
		{ text: 'a', strong: true },
		{ text: ' et **b', strong: false },
	]);
});

test('parseInline : jamais de HTML interprété (le texte est gardé tel quel)', () => {
	expect(parseInline('<b>x</b>')).toStrictEqual([{ text: '<b>x</b>', strong: false }]);
});

test('paragraphs : ligne vide = paragraphe, retour à la ligne conservé', () => {
	expect(paragraphs('\n  un\ndeux  \n\n\n trois \n')).toStrictEqual([['un', 'deux'], ['trois']]);
	expect(paragraphs('a\r\n\r\nb')).toStrictEqual([['a'], ['b']]);
	expect(paragraphs('a\n  \nb')).toStrictEqual([['a'], ['b']]);
	expect(paragraphs('   ')).toStrictEqual([]);
});

test('slideLabel : titre court pour le menu', () => {
	expect(slideLabel({ titre: 'Rain **Man**', texte: 'x' }, 'fr')).toBe('Rain Man');
	expect(slideLabel({ grand: '52', texte: 'x' }, 'fr')).toBe('52');
	expect(slideLabel({ texte: 'une\n\n  ligne' }, 'fr')).toBe('une ligne');
	const long = slideLabel({ texte: 'mot '.repeat(40) }, 'fr');
	expect(long.length).toBe(60);
	expect(long.endsWith('…')).toBeTruthy();
});

test('slideLabel : dans la langue demandée, chargement compris', () => {
	const slide = { titre: { fr: 'Analyse en cours', en: 'Analysis in progress' } };
	expect(slideLabel(slide, 'fr')).toBe('Analyse en cours');
	expect(slideLabel(slide, 'en')).toBe('Analysis in progress');
	expect(slideLabel({ chargement: 5 }, 'fr')).toBe('Chargement');
	expect(slideLabel({ chargement: 5 }, 'en')).toBe('Loading');
});

test('checkSlides : erreurs lisibles', () => {
	const none = (): boolean => false;
	expect(checkSlides([], none)).toStrictEqual(['aucune slide']);
	expect(checkSlides([{ note: 'seulement une note' }], none)).toStrictEqual(['slide 1 : rien à afficher (titre, grand, texte, image, chargement ou bouton)']);
	expect(checkSlides([{ titre: 'ok' }, { titre: '   ' }], none)).toStrictEqual(['slide 2 : champ « titre » vide']);
	const typo = checkSlides([{ titre: 'x', txte: 'faute' } as never], none);
	expect(typo.length).toBe(1);
	expect(typo[0]).toMatch(/champ inconnu « txte »/);
	expect(checkSlides([{ image: 'carte.png' }], none)).toStrictEqual(['slide 1 : l\'image doit être dans images/ (reçu « carte.png »)']);
	expect(checkSlides([{ image: 'images/carte.png' }], none)).toStrictEqual(['slide 1 : image introuvable src/assets/images/analyseur-q/carte.png']);
	expect(checkSlides([{ image: 'images/carte.png' }], () => true)).toStrictEqual([]);
});

test('checkSlides : bouton', () => {
	const none = (): boolean => false;
	expect(checkSlides([{ bouton: 'Lancer l\'analyse', chargement: 5 }, { titre: 'suite' }], none), 'un bouton seul suffit').toStrictEqual([]);
	expect(checkSlides([{ titre: 'x', bouton: '  ' }, { titre: 'suite' }], none)).toStrictEqual(['slide 1 : champ « bouton » vide']);
	expect(checkSlides([{ titre: 'x' }, { titre: 'fin', bouton: 'Suivant' }], none)).toStrictEqual(['slide 2 : bouton sur la dernière slide, il n\'y a pas de slide suivante (indiquer boutonVers)']);
});

test('checkSlides : boutonVers', () => {
	const none = (): boolean => false;
	expect(checkSlides([{ titre: 'x' }, { titre: 'fin', bouton: 'Recommencer', boutonVers: 1 }], none), 'bouton Recommencer sur la dernière slide').toStrictEqual([]);
	expect(checkSlides([{ titre: 'x', boutonVers: 2 }, { titre: 'y' }], none)).toStrictEqual(['slide 1 : boutonVers sans bouton']);
	for (const target of [0, 3, 1.5, '1']) {
		const errors = checkSlides([{ titre: 'x' }, { titre: 'fin', bouton: 'B', boutonVers: target as number }], none);
		expect(errors.length, String(target)).toBe(1);
		expect(errors[0]).toMatch(/boutonVers doit être un numéro de slide entre 1 et 2/);
	}
});

test('checkSlides : message termine', () => {
	const none = (): boolean => false;
	expect(checkSlides([{ titre: 'x' }, { titre: 'Analyse', chargement: 5, termine: 'Terminée' }], none), 'avec un message, le chargement peut finir le diaporama').toStrictEqual([]);
	expect(checkSlides([{ titre: 'x', termine: 'Terminée' }, { titre: 'suite' }], none)).toStrictEqual(['slide 1 : message termine sans chargement']);
	expect(checkSlides([{ titre: 'x', chargement: 5, termine: ' ' }, { titre: 'suite' }], none)).toStrictEqual(['slide 1 : champ « termine » vide']);
});

test('checkSlides : chargement', () => {
	const none = (): boolean => false;
	expect(checkSlides([{ chargement: 5 }, { titre: 'suite' }], none), 'un chargement seul suffit').toStrictEqual([]);
	expect(checkSlides([{ titre: 'x', chargement: 0 }, { titre: 'suite' }], none)).toStrictEqual(['slide 1 : chargement en secondes, entre 1 et 120 (reçu « 0 »)']);
	expect(checkSlides([{ titre: 'x', chargement: '5' as never }, { titre: 'suite' }], none)).toStrictEqual(['slide 1 : chargement en secondes, entre 1 et 120 (reçu « 5 »)']);
	expect(checkSlides([{ titre: 'x', chargement: NaN }, { titre: 'suite' }], none).length).toBe(1);
	expect(checkSlides([{ titre: 'x' }, { titre: 'fin', chargement: 5 }], none)).toStrictEqual(['slide 2 : chargement sur la dernière slide, il n\'y a pas de slide suivante (ajouter un message termine)']);
});

test('checkSlides : les deux langues', () => {
	const none = (): boolean => false;
	const both = (): boolean => true;
	expect(checkSlides([{ titre: { fr: 'Résultat', en: 'Result' } }], none), 'texte traduit').toStrictEqual([]);

	const missing = checkSlides([{ titre: { fr: 'Résultat' } as never }], none);
	expect(missing.length).toBe(1);
	expect(missing[0]).toMatch(/champ « titre » : un texte, ou un texte par langue/);

	const empty = checkSlides([{ titre: { fr: 'Résultat', en: '  ' } }], none);
	expect(empty.length).toBe(1);
	expect(empty[0]).toMatch(/champ « titre »/);

	expect(checkSlides([{ image: { fr: 'images/figure.svg', en: 'images/figure-en.svg' } }], (path) => path.endsWith('figure.svg')), 'image manquante dans une seule langue').toStrictEqual(['slide 1 (en) : image introuvable src/assets/images/analyseur-q/figure-en.svg']);
	expect(checkSlides([{ image: { fr: 'images/a.svg', en: 'images/b.svg' } }], both)).toStrictEqual([]);
});

test('checkSlides : étapes du chargement', () => {
	const none = (): boolean => false;
	expect(checkSlides([{ chargement: 5, etapes: ['Étalonnage', { fr: 'Mesure', en: 'Measurement' }] }, { titre: 'suite' }], none), 'étapes en texte commun ou traduites').toStrictEqual([]);
	expect(checkSlides([{ titre: 'x', etapes: ['Étalonnage'] }, { titre: 'suite' }], none)).toStrictEqual(['slide 1 : etapes sans chargement']);
	expect(checkSlides([{ chargement: 5, etapes: [] }, { titre: 'suite' }], none)).toStrictEqual(['slide 1 : etapes doit être une liste de textes, ex. etapes: [\'Étalonnage\', \'Mesure\']']);
	expect(checkSlides([{ chargement: 5, etapes: 'Étalonnage' as never }, { titre: 'suite' }], none)).toStrictEqual(['slide 1 : etapes doit être une liste de textes, ex. etapes: [\'Étalonnage\', \'Mesure\']']);
	expect(checkSlides([{ chargement: 5, etapes: ['Étalonnage', '  '] }, { titre: 'suite' }], none)).toStrictEqual(['slide 1 : étape 2 vide']);
	const partial = checkSlides([{ chargement: 5, etapes: [{ fr: 'Mesure' } as never] }, { titre: 'suite' }], none);
	expect(partial.length).toBe(1);
	expect(partial[0]).toMatch(/étape 1 : un texte, ou un texte par langue/);
});

test('contenu du diaporama (src/content/slides.ts) : sans erreur', () => {
	// Les images des slides (« images/logo.svg ») sont rangées dans src/assets/images/analyseur-q/.
	const errors = checkSlides(SLIDES, (path) => existsSync(join('src/assets/images/analyseur-q', path.replace(/^images\//, ''))));
	expect(errors, `Slides à corriger :\n- ${errors.join('\n- ')}`).toStrictEqual([]);
});
