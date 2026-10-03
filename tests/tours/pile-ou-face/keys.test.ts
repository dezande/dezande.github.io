// Touches du clavier et des télécommandes de présentation.
import { keyAction } from '../../../src/tours/pile-ou-face/logic/keys.ts';

test('le haut fait pile', () => {
	for (const key of ['ArrowUp', 'PageUp']) expect(keyAction(key), key).toBe('pile');
});

test('le bas fait face', () => {
	for (const key of ['ArrowDown', 'PageDown']) expect(keyAction(key), key).toBe('face');
});

test('remettre la carte face cachée', () => {
	for (const key of ['Home', 'r', 'R']) expect(keyAction(key), key).toBe('cacher');
});

test('menu', () => {
	for (const key of ['Escape', 'm', 'M']) expect(keyAction(key), key).toBe('menu');
});

test('les autres touches ne font rien', () => {
	for (const key of ['a', ' ', 'Enter', 'F5', 'Tab', 'constructor', 'toString', '']) expect(keyAction(key), key).toBe(null);
});
