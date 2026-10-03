// Touches du clavier et des télécommandes de présentation.
import { keyAction } from '../../../src/tours/six-predictions/logic/keys.ts';

test('avancer dans la routine', () => {
	for (const key of ['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter']) expect(keyAction(key), key).toBe('toucher');
});

test('remettre le paquet', () => {
	for (const key of ['Home', 'r', 'R']) expect(keyAction(key), key).toBe('remettre');
});

test('menu', () => {
	for (const key of ['Escape', 'm', 'M']) expect(keyAction(key), key).toBe('menu');
});

test('les autres touches ne font rien', () => {
	for (const key of ['a', 'F5', 'Tab', 'constructor', 'toString', '']) expect(keyAction(key), key).toBe(null);
});
