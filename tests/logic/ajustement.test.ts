// Ajuster un texte à sa place (src/logic/ajustement.ts) : la plus grande échelle qui tient.
import { plusGrandeEchelle } from '../../src/logic/ajustement.ts';

test('trouve la plus grande échelle qui tient, à la précision près', () => {
	const echelle = plusGrandeEchelle((s) => s * 100 <= 250, 0.25, 12);
	expect(echelle).toBeLessThanOrEqual(2.5);
	expect(echelle).toBeGreaterThan(2.5 - (12 - 0.25) / 2 ** 16);
});

test('rien ne tient : la plus petite échelle', () => {
	expect(plusGrandeEchelle(() => false, 0.25, 1)).toBe(0.25);
});

test('tout tient : presque la plus grande, jamais au-delà', () => {
	const echelle = plusGrandeEchelle(() => true, 0.25, 1, 8);
	expect(echelle).toBeLessThan(1);
	expect(echelle).toBeGreaterThanOrEqual(1 - 0.75 / 2 ** 8);
});

test('le nombre d’essais est celui demandé', () => {
	let essais = 0;
	plusGrandeEchelle(() => (essais++, true), 0, 1, 8);
	expect(essais).toBe(8);
});
