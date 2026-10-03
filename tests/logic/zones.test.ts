// Le découpage de la scène en zones (src/logic/zones.ts).
// Lancer : npm test
import { segmentIndex, segments, zoneIndexForPoint, zoneRects } from '../../src/logic/zones.ts';

/* ---------- Bandes horizontales (2 ou 3 zones) ---------- */

test('3 bandes : tiers supérieur, central, inférieur', () => {
	const h = 900;
	const band = (y: number): number => zoneIndexForPoint(200, y, 390, h, 3);
	expect([0, 299.9, 300, 599.9, 600, 900].map(band)).toStrictEqual([0, 0, 1, 1, 2, 2]);
});

test('indépendant de la hauteur d’écran', () => {
	for (const h of [480, 568, 667, 740.5, 812, 844, 852, 926, 932, 1024, 1366]) {
		expect(zoneIndexForPoint(0, h * 0.1, 390, h, 3), `h=${h}`).toBe(0);
		expect(zoneIndexForPoint(0, h * 0.5, 390, h, 3), `h=${h}`).toBe(1);
		expect(zoneIndexForPoint(0, h * 0.9, 390, h, 3), `h=${h}`).toBe(2);
	}
});

test('2 et 3 bandes : la position horizontale ne compte pas', () => {
	for (const x of [-10, 0, 200, 389, 500]) {
		expect(zoneIndexForPoint(x, 100, 390, 900, 3)).toBe(0);
		expect(zoneIndexForPoint(x, 450, 390, 900, 3)).toBe(1);
		expect(zoneIndexForPoint(x, 800, 390, 900, 2)).toBe(1);
	}
});

/* ---------- 4 coins ---------- */

test('4 zones : les 4 coins', () => {
	const w = 390;
	const h = 844;
	expect(zoneIndexForPoint(10, 10, w, h, 4)).toBe(0);
	expect(zoneIndexForPoint(380, 10, w, h, 4)).toBe(1);
	expect(zoneIndexForPoint(10, 834, w, h, 4)).toBe(2);
	expect(zoneIndexForPoint(380, 834, w, h, 4)).toBe(3);
	// Juste avant et juste sur le centre de l'écran.
	expect(zoneIndexForPoint(194.9, 421.9, w, h, 4)).toBe(0);
	expect(zoneIndexForPoint(195, 422, w, h, 4)).toBe(3);
});

/* ---------- Découpage d'un axe ---------- */

test('coordonnées hors surface ramenées au tronçon le plus proche', () => {
	expect(segmentIndex(-40, 800, 3)).toBe(0);
	expect(segmentIndex(830, 800, 3)).toBe(2);
	expect(zoneIndexForPoint(-20, 900, 390, 844, 4)).toBe(2);
});

test('segments est cohérent avec segmentIndex', () => {
	for (const length of [375, 667, 844, 931]) {
		for (const count of [1, 2, 3, 4]) {
			const parts = segments(length, count);
			expect(parts.length).toBe(count);
			expect(parts[0].start).toBe(0);
			expect(parts[count - 1].end).toBe(length);
			for (const p of parts) {
				expect(segmentIndex(p.start + 0.01, length, count)).toBe(p.index);
				expect(segmentIndex(p.end - 0.01, length, count)).toBe(p.index);
			}
		}
	}
});

/* ---------- Rectangles du mode test ---------- */

test('zoneRects est cohérent avec zoneIndexForPoint', () => {
	for (const [w, h] of [[375, 667], [390, 844], [1024, 1366]]) {
		for (const count of [2, 3, 4]) {
			const rects = zoneRects(w, h, count);
			expect(rects.length).toBe(count);
			expect(rects.map((r) => r.index)).toStrictEqual([...Array(count).keys()]);
			for (const r of rects) {
				expect(zoneIndexForPoint((r.left + r.right) / 2, (r.top + r.bottom) / 2, w, h, count)).toBe(r.index);
				expect(zoneIndexForPoint(r.left + 0.01, r.top + 0.01, w, h, count)).toBe(r.index);
				expect(zoneIndexForPoint(r.right - 0.01, r.bottom - 0.01, w, h, count)).toBe(r.index);
			}
		}
	}
});

/* ---------- Entrées invalides ---------- */

test('entrées invalides', () => {
	expect(segmentIndex(10, 0, 3)).toBe(-1);
	expect(segmentIndex(10, -5, 3)).toBe(-1);
	expect(segmentIndex(NaN, 800, 3)).toBe(-1);
	expect(segmentIndex(10, 800, 0)).toBe(-1);
	expect(segmentIndex(10, 800, 2.5)).toBe(-1);
	expect(segments(0, 3).length).toBe(0);
	expect(zoneIndexForPoint(NaN, 10, 390, 844, 4)).toBe(-1);
	expect(zoneIndexForPoint(10, 10, 390, 844, 0)).toBe(-1);
	expect(zoneRects(0, 800, 4).length).toBe(0);
	expect(zoneRects(390, 800, 0).length).toBe(0);
});
