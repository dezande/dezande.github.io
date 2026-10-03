// Touches du clavier et des télécommandes de présentation.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { keyAction } from '../../../src/tours/pile-ou-face/logic/keys.ts';

test('le haut fait pile', () => {
	for (const key of ['ArrowUp', 'PageUp']) assert.equal(keyAction(key), 'pile', key);
});

test('le bas fait face', () => {
	for (const key of ['ArrowDown', 'PageDown']) assert.equal(keyAction(key), 'face', key);
});

test('remettre la carte face cachée', () => {
	for (const key of ['Home', 'r', 'R']) assert.equal(keyAction(key), 'cacher', key);
});

test('menu', () => {
	for (const key of ['Escape', 'm', 'M']) assert.equal(keyAction(key), 'menu', key);
});

test('les autres touches ne font rien', () => {
	for (const key of ['a', ' ', 'Enter', 'F5', 'Tab', 'constructor', 'toString', '']) assert.equal(keyAction(key), null, key);
});
