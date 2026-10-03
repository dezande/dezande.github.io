// Les adresses de l'app (src/logic/adresses.ts) : strictes, comparées caractère pour caractère.
import { adresseDuTour, resoudre } from '../../src/logic/adresses.ts';

const DOSSIERS = ['boule-de-cristal', 'pile-ou-face'];

test('le menu : #/, ou une adresse vide', () => {
	for (const hash of ['', '#', '#/']) expect(resoudre(hash, DOSSIERS), JSON.stringify(hash)).toStrictEqual({ page: 'menu' });
});

test('un tour publié, à son adresse exacte, et ses réglages seuls', () => {
	expect(resoudre('#/tours/pile-ou-face', DOSSIERS)).toStrictEqual({ page: 'tour', dossier: 'pile-ou-face', reglages: false });
	expect(resoudre('#/tours/pile-ou-face?reglages', DOSSIERS)).toStrictEqual({ page: 'tour', dossier: 'pile-ou-face', reglages: true });
	expect(resoudre(`#${adresseDuTour('boule-de-cristal', true)}`, DOSSIERS)).toStrictEqual({ page: 'tour', dossier: 'boule-de-cristal', reglages: true });
});

test.each([
	['un nom inventé', '#/tours/tour-secret'],
	['un tour hors de la liste', '#/tours/six-predictions'],
	['un nom hérité de tout objet JavaScript', '#/tours/constructor'],
	['un autre nom hérité', '#/tours/__proto__'],
	['une remontée de dossier', '#/tours/../tours/pile-ou-face'],
	['une remontée encodée', '#/tours/%2e%2e%2fpile-ou-face'],
	['un nom encodé', '#/tours/pile%2Dou%2Dface'],
	['une majuscule', '#/tours/Pile-ou-face'],
	['un « / » final', '#/tours/pile-ou-face/'],
	['un dossier de plus', '#/tours/pile-ou-face/autre'],
	['un paramètre inconnu', '#/tours/pile-ou-face?debug'],
	['un paramètre de plus', '#/tours/pile-ou-face?reglages&debug'],
	['une valeur au paramètre', '#/tours/pile-ou-face?reglages=1'],
	['des espaces', '#/tours/ pile-ou-face'],
	['la liste des tours elle-même', '#/tours'],
	['une page inconnue', '#/admin'],
	['un « / » de trop au menu', '#//'],
])('refusée : %s (%s)', (_cas, hash) => {
	expect(resoudre(hash, DOSSIERS)).toStrictEqual({ page: 'refusee' });
});
