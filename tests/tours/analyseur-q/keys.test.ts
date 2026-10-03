import { keyAction } from '../../../src/tours/analyseur-q/logic/keys.ts';

test('touches des télécommandes de présentation et du clavier', () => {
	for (const key of ['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter']) expect(keyAction(key), key).toBe('next');
	for (const key of ['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace']) expect(keyAction(key), key).toBe('prev');
	expect(keyAction('Home')).toBe('first');
	expect(keyAction('End')).toBe('last');
	for (const key of ['Escape', 'm', 'M']) expect(keyAction(key), key).toBe('menu');
	for (const key of ['b', 'B', '.']) expect(keyAction(key), key).toBe('black');
});

test('autres touches : ignorées', () => {
	for (const key of ['a', 'Tab', 'Shift', 'toString', '__proto__']) expect(keyAction(key), key).toBe(null);
});
