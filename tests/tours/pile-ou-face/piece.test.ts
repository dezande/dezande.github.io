// L'état de la carte : pile en haut, face en bas, armée une seule fois, remise par un double toucher.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { apresGeste, CACHEE, coteDuPoint, enJeu, montrer, type Etat } from '../../../src/tours/pile-ou-face/logic/piece.ts';

test('la moitié du haut fait pile, celle du bas fait face', () => {
	assert.equal(coteDuPoint(0, 800), 'pile');
	assert.equal(coteDuPoint(399, 800), 'pile');
	assert.equal(coteDuPoint(400, 800), 'face');
	assert.equal(coteDuPoint(799, 800), 'face');
});

test('un doigt au-delà du bord compte pour la moitié la plus proche', () => {
	assert.equal(coteDuPoint(-12, 800), 'pile');
	assert.equal(coteDuPoint(830, 800), 'face');
});

test('une mesure invalide ne choisit rien', () => {
	for (const [y, h] of [[10, 0], [10, -5], [Number.NaN, 800], [10, Number.POSITIVE_INFINITY]]) {
		assert.equal(coteDuPoint(y!, h!), null, `${y} sur ${h}`);
	}
});

test('un toucher arme la carte face cachée sur le côté touché', () => {
	assert.deepEqual(apresGeste(CACHEE, 'tap', 'pile', CACHEE), { phase: 'armee', cote: 'pile' });
	assert.deepEqual(apresGeste(CACHEE, 'tap', 'face', CACHEE), { phase: 'armee', cote: 'face' });
});

test('une fois armée ou retournée, un toucher ne change plus la prédiction', () => {
	const armee: Etat = { phase: 'armee', cote: 'pile' };
	const montree: Etat = { phase: 'montree', cote: 'pile' };
	assert.equal(apresGeste(armee, 'tap', 'face', armee), armee);
	assert.equal(apresGeste(montree, 'tap', 'face', montree), montree);
});

test('le délai écoulé retourne la carte armée, et rien d’autre', () => {
	assert.deepEqual(montrer({ phase: 'armee', cote: 'face' }), { phase: 'montree', cote: 'face' });
	assert.equal(montrer(CACHEE), CACHEE);
	const montree: Etat = { phase: 'montree', cote: 'pile' };
	assert.equal(montrer(montree), montree);
});

test('un double toucher sur une carte armée ou retournée la remet face cachée', () => {
	const armee: Etat = { phase: 'armee', cote: 'pile' };
	const montree: Etat = { phase: 'montree', cote: 'face' };
	assert.equal(apresGeste(armee, 'double', 'face', armee), CACHEE);
	assert.equal(apresGeste(montree, 'double', 'pile', montree), CACHEE);
});

test('deux touchers vifs pour armer ne remettent pas aussitôt la carte face cachée', () => {
	// Le premier toucher arme ; le second complète un double toucher, mais la carte était face
	// cachée avant le premier : elle reste armée sur le côté du premier toucher.
	const armee = apresGeste(CACHEE, 'tap', 'pile', CACHEE);
	assert.deepEqual(apresGeste(armee, 'double', 'face', CACHEE), { phase: 'armee', cote: 'pile' });
});

test('un tour est en cours dès que la carte est armée', () => {
	assert.equal(enJeu(CACHEE), false);
	assert.equal(enJeu({ phase: 'armee', cote: 'pile' }), true);
	assert.equal(enJeu({ phase: 'montree', cote: 'face' }), true);
});
