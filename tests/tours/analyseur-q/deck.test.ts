import { applyMove, clampIndex, counterLabel } from '../../../src/tours/analyseur-q/logic/deck.ts';

test('clampIndex : toute valeur relue donne un index valide', () => {
	expect(clampIndex(2, 5)).toBe(2);
	expect(clampIndex(9, 5)).toBe(4);
	expect(clampIndex(-3, 5)).toBe(0);
	expect(clampIndex(2.7, 5)).toBe(2);
	for (const raw of [null, undefined, '3', NaN, Infinity, {}]) expect(clampIndex(raw, 5)).toBe(0);
	expect(clampIndex(3, 0)).toBe(0);
});

test('applyMove : on s’arrête aux extrémités', () => {
	expect(applyMove(0, 'next', 3)).toBe(1);
	expect(applyMove(2, 'next', 3)).toBe(2);
	expect(applyMove(0, 'prev', 3)).toBe(0);
	expect(applyMove(2, 'prev', 3)).toBe(1);
	expect(applyMove(1, 'first', 3)).toBe(0);
	expect(applyMove(1, 'last', 3)).toBe(2);
});

test('counterLabel', () => {
	expect(counterLabel(0, 12)).toBe('1 / 12');
});
