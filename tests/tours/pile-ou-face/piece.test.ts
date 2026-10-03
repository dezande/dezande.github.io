// L'état de la carte : pile en haut, face en bas, armée une seule fois, remise par un double toucher.
import { apresGeste, CACHEE, coteDuPoint, enJeu, montrer, type Etat } from '../../../src/tours/pile-ou-face/logic/piece.ts';

test('la moitié du haut fait pile, celle du bas fait face', () => {
	expect(coteDuPoint(0, 800)).toBe('pile');
	expect(coteDuPoint(399, 800)).toBe('pile');
	expect(coteDuPoint(400, 800)).toBe('face');
	expect(coteDuPoint(799, 800)).toBe('face');
});

test('un doigt au-delà du bord compte pour la moitié la plus proche', () => {
	expect(coteDuPoint(-12, 800)).toBe('pile');
	expect(coteDuPoint(830, 800)).toBe('face');
});

test('une mesure invalide ne choisit rien', () => {
	for (const [y, h] of [[10, 0], [10, -5], [Number.NaN, 800], [10, Number.POSITIVE_INFINITY]]) {
		expect(coteDuPoint(y!, h!), `${y} sur ${h}`).toBe(null);
	}
});

test('un toucher arme la carte face cachée sur le côté touché', () => {
	expect(apresGeste(CACHEE, 'tap', 'pile', CACHEE)).toStrictEqual({ phase: 'armee', cote: 'pile' });
	expect(apresGeste(CACHEE, 'tap', 'face', CACHEE)).toStrictEqual({ phase: 'armee', cote: 'face' });
});

test('une fois armée ou retournée, un toucher ne change plus la prédiction', () => {
	const armee: Etat = { phase: 'armee', cote: 'pile' };
	const montree: Etat = { phase: 'montree', cote: 'pile' };
	expect(apresGeste(armee, 'tap', 'face', armee)).toBe(armee);
	expect(apresGeste(montree, 'tap', 'face', montree)).toBe(montree);
});

test('le délai écoulé retourne la carte armée, et rien d’autre', () => {
	expect(montrer({ phase: 'armee', cote: 'face' })).toStrictEqual({ phase: 'montree', cote: 'face' });
	expect(montrer(CACHEE)).toBe(CACHEE);
	const montree: Etat = { phase: 'montree', cote: 'pile' };
	expect(montrer(montree)).toBe(montree);
});

test('un double toucher sur une carte armée ou retournée la remet face cachée', () => {
	const armee: Etat = { phase: 'armee', cote: 'pile' };
	const montree: Etat = { phase: 'montree', cote: 'face' };
	expect(apresGeste(armee, 'double', 'face', armee)).toBe(CACHEE);
	expect(apresGeste(montree, 'double', 'pile', montree)).toBe(CACHEE);
});

test('deux touchers vifs pour armer ne remettent pas aussitôt la carte face cachée', () => {
	// Le premier toucher arme ; le second complète un double toucher, mais la carte était face
	// cachée avant le premier : elle reste armée sur le côté du premier toucher.
	const armee = apresGeste(CACHEE, 'tap', 'pile', CACHEE);
	expect(apresGeste(armee, 'double', 'face', CACHEE)).toStrictEqual({ phase: 'armee', cote: 'pile' });
});

test('un tour est en cours dès que la carte est armée', () => {
	expect(enJeu(CACHEE)).toBe(false);
	expect(enJeu({ phase: 'armee', cote: 'pile' })).toBe(true);
	expect(enJeu({ phase: 'montree', cote: 'face' })).toBe(true);
});
