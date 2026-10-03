// Gestes : taps, glissements et appui long, avec des rythmes de vrai doigt (lents, hésitants, tremblants).
import { GESTURE, GestureTracker, type Tap } from '../../../src/tours/analyseur-q/logic/gestures.ts';

const WIDTH = 390;
const RIGHT = { x: 300, y: 400 };
const LEFT = { x: 40, y: 400 };

/** Doigt posé en `from` à t=0, déplacé par étapes, levé en `to` au bout de `ms`. */
function gesture(from: { x: number; y: number }, to: { x: number; y: number }, ms: number, tracker = new GestureTracker()): Tap {
	tracker.press(1, from.x, from.y, 0);
	for (let step = 1; step <= 4; step++) {
		tracker.move(1, from.x + ((to.x - from.x) * step) / 4, from.y + ((to.y - from.y) * step) / 4);
	}
	return tracker.release(1, to.x, to.y, ms, WIDTH);
}

test('tap à droite : suivante ; tap sur le tiers gauche : précédente', () => {
	expect(gesture(RIGHT, RIGHT, 80)).toBe('next');
	expect(gesture(LEFT, LEFT, 80)).toBe('prev');
	expect(gesture({ x: WIDTH * GESTURE.prevZone - 1, y: 10 }, { x: WIDTH * GESTURE.prevZone - 1, y: 10 }, 80)).toBe('prev');
	expect(gesture({ x: WIDTH * GESTURE.prevZone + 1, y: 10 }, { x: WIDTH * GESTURE.prevZone + 1, y: 10 }, 80)).toBe('next');
});

test('tap humain : lent et qui tremble un peu, il compte quand même', () => {
	expect(gesture(RIGHT, { x: RIGHT.x + 25, y: RIGHT.y - 20 }, 650)).toBe('next');
	expect(gesture(LEFT, { x: LEFT.x + 30, y: LEFT.y + 15 }, 700)).toBe('prev');
});

test('tap : c’est la zone où le doigt s’est posé qui compte', () => {
	// Posé à gauche, roulé de 35 px vers la droite : toujours « précédente ».
	expect(gesture({ x: 100, y: 400 }, { x: 135, y: 400 }, 200)).toBe('prev');
});

test('appui relâché après la durée d’un tap mais avant le menu : rien', () => {
	expect(gesture(RIGHT, RIGHT, GESTURE.tapMaxMs + 1)).toBe('none');
	expect(gesture(RIGHT, RIGHT, 2500)).toBe('none');
});

test('glissement vers la gauche : suivante ; vers la droite : précédente, même lentement', () => {
	expect(gesture({ x: 300, y: 400 }, { x: 180, y: 420 }, 150)).toBe('next');
	expect(gesture({ x: 100, y: 400 }, { x: 260, y: 380 }, 150)).toBe('prev');
	expect(gesture({ x: 300, y: 400 }, { x: 200, y: 430 }, 1800)).toBe('next');
});

test('glissement surtout vertical ou trop court : rien', () => {
	expect(gesture({ x: 200, y: 200 }, { x: 140, y: 500 }, 200)).toBe('none');
	expect(gesture({ x: 200, y: 400 }, { x: 155, y: 400 }, 200)).toBe('none');
});

test('appui long : ouvre le menu une seule fois, et le relâcher ne change pas de slide', () => {
	const tracker = new GestureTracker();
	expect(tracker.press(1, RIGHT.x, RIGHT.y, 0)).toBe(true);
	tracker.move(1, RIGHT.x + 20, RIGHT.y + 20); // doigt qui bouge un peu pendant 3 s
	expect(tracker.holdCompleted(1)).toBe(true);
	expect(tracker.holdCompleted(1)).toBe(false);
	expect(tracker.release(1, RIGHT.x, RIGHT.y, 3400, WIDTH)).toBe('none');
});

test('appui long annulé par un mouvement franc', () => {
	const tracker = new GestureTracker();
	tracker.press(1, RIGHT.x, RIGHT.y, 0);
	expect(tracker.move(1, RIGHT.x, RIGHT.y + GESTURE.slopPx + 5)).toBe(true);
	expect(tracker.holdCompleted(1)).toBe(false);
});

test('second doigt : le geste est abandonné', () => {
	const tracker = new GestureTracker();
	tracker.press(1, RIGHT.x, RIGHT.y, 0);
	expect(tracker.press(2, LEFT.x, LEFT.y, 50)).toBe(false);
	expect(tracker.holdCompleted(1)).toBe(false);
	expect(tracker.release(2, LEFT.x, LEFT.y, 100, WIDTH)).toBe('none');
	expect(tracker.release(1, RIGHT.x, RIGHT.y, 120, WIDTH)).toBe('none');
	// Le geste suivant fonctionne normalement.
	expect(gesture(RIGHT, RIGHT, 80, tracker)).toBe('next');
});

test('contact interrompu par le système ou remise à zéro : rien ne se déclenche', () => {
	const tracker = new GestureTracker();
	tracker.press(1, RIGHT.x, RIGHT.y, 0);
	tracker.cancel(1);
	expect(tracker.release(1, RIGHT.x, RIGHT.y, 80, WIDTH)).toBe('none');
	tracker.press(1, RIGHT.x, RIGHT.y, 0);
	tracker.reset();
	expect(tracker.holdCompleted(1)).toBe(false);
	expect(tracker.release(1, RIGHT.x, RIGHT.y, 80, WIDTH)).toBe('none');
});
