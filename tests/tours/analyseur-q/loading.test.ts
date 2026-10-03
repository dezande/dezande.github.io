import { loadingProgress, percentLabel, stepIndex } from '../../../src/tours/analyseur-q/logic/loading.ts';

test('loadingProgress : de 0 à 1, bornée', () => {
	expect(loadingProgress(0)).toBe(0);
	expect(loadingProgress(1)).toBe(1);
	expect(loadingProgress(-2)).toBe(0);
	expect(loadingProgress(3)).toBe(1);
	expect(loadingProgress(NaN)).toBe(0);
});

test('loadingProgress : ne recule jamais, et reste irrégulière (pas une droite)', () => {
	let previous = 0;
	let maxGap = 0;
	for (let i = 1; i <= 1000; i++) {
		const t = i / 1000;
		const p = loadingProgress(t);
		expect(p >= previous, `recul à ${t} : ${p} < ${previous}`).toBeTruthy();
		expect(p <= 1).toBeTruthy();
		previous = p;
		maxGap = Math.max(maxGap, Math.abs(p - t));
	}
	expect(maxGap > 0.05, 'progression visiblement différente d\'une droite').toBeTruthy();
});

test('percentLabel : 100 % seulement à la fin', () => {
	expect(percentLabel(0)).toBe('0 %');
	expect(percentLabel(0.999)).toBe('99 %');
	expect(percentLabel(loadingProgress(0.999))).toBe('99 %');
	expect(percentLabel(1)).toBe('100 %');
});

test('stepIndex : les étapes se partagent la progression, la dernière tient jusqu\'à 100 %', () => {
	expect(stepIndex(0, 4)).toBe(0);
	expect(stepIndex(0.24, 4)).toBe(0);
	expect(stepIndex(0.25, 4)).toBe(1);
	expect(stepIndex(0.99, 4)).toBe(3);
	expect(stepIndex(1, 4), 'à 100 %, la dernière étape reste affichée').toBe(3);
	expect(stepIndex(2, 4), 'progression hors bornes').toBe(3);
	expect(stepIndex(-1, 4)).toBe(0);
	expect(stepIndex(0.5, 1)).toBe(0);
});

test('stepIndex : sans étape, rien à afficher', () => {
	expect(stepIndex(0.5, 0)).toBe(-1);
	expect(stepIndex(0.5, -3)).toBe(-1);
});
