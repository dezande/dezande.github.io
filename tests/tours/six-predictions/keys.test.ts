// Touches du clavier et des télécommandes de présentation.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { keyAction } from '../../../src/tours/six-predictions/logic/keys.ts';

test('avancer dans la routine', () => {
	for (const key of ['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter']) assert.equal(keyAction(key), 'toucher', key);
});

test('remettre le paquet', () => {
	for (const key of ['Home', 'r', 'R']) assert.equal(keyAction(key), 'remettre', key);
});

test('menu', () => {
	for (const key of ['Escape', 'm', 'M']) assert.equal(keyAction(key), 'menu', key);
});

test('les autres touches ne font rien', () => {
	for (const key of ['a', 'F5', 'Tab', 'constructor', 'toString', '']) assert.equal(keyAction(key), null, key);
});
