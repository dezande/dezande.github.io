// Décision de chaque geste : tap, double toucher, appui long, et tout ce qui ne doit rien produire.
import { GESTURE, GestureTracker } from '../../../src/tours/six-predictions/logic/gestures.ts';

/** Un doigt posé puis relevé au même endroit, `ms` plus tard. */
function tap(tracker: GestureTracker, x: number, y: number, at: number, ms = 100): ReturnType<GestureTracker['release']> {
	tracker.press(1, x, y, at);
	return tracker.release(1, x, y, at + ms);
}

test('un tap n’importe où touche la carte', () => {
	const tracker = new GestureTracker();
	expect(tap(tracker, 10, 10, 0)).toBe('tap');
	expect(tap(tracker, 380, 800, 5000)).toBe('tap');
});

test('deux taps rapprochés font un double toucher', () => {
	const tracker = new GestureTracker();
	expect(tap(tracker, 200, 400, 0)).toBe('tap');
	expect(tap(tracker, 210, 410, 300)).toBe('double');
	// Un troisième tap repart d'un simple tap : trois touchers ne font pas deux doubles.
	expect(tap(tracker, 210, 410, 500)).toBe('tap');
});

test('deux taps trop espacés, dans le temps ou sur l’écran, restent deux taps', () => {
	const tracker = new GestureTracker();
	expect(tap(tracker, 200, 400, 0)).toBe('tap');
	expect(tap(tracker, 200, 400, GESTURE.doubleMaxMs + 200)).toBe('tap');

	const loin = new GestureTracker();
	expect(tap(loin, 60, 100, 0)).toBe('tap');
	expect(tap(loin, 60 + GESTURE.doubleSlopPx + 10, 100, 200)).toBe('tap');
});

test('un doigt qui glisse ou qui s’attarde ne fait rien', () => {
	const tracker = new GestureTracker();
	tracker.press(1, 200, 400, 0);
	expect(tracker.move(1, 200 + GESTURE.slopPx + 10, 400), 'le mouvement annule l’appui long').toBe(true);
	expect(tracker.release(1, 200 + GESTURE.slopPx + 10, 400, 200)).toBe('none');

	expect(tap(tracker, 200, 400, 1000, GESTURE.tapMaxMs + 100), 'trop long pour un tap').toBe('none');
});

test('un tap annulé ne compte pas pour le double toucher suivant', () => {
	const tracker = new GestureTracker();
	expect(tap(tracker, 200, 400, 0)).toBe('tap');
	tracker.reset();
	expect(tap(tracker, 200, 400, 200), 'le tap oublié ne fait pas un double').toBe('tap');
});

test('appui long : le menu s’ouvre une fois, et le doigt relevé ne fait rien', () => {
	const tracker = new GestureTracker();
	expect(tracker.press(1, 200, 400, 0)).toBe(true);
	expect(tracker.holdCompleted(1)).toBe(true);
	expect(tracker.holdCompleted(1), 'une seule ouverture par appui').toBe(false);
	expect(tracker.release(1, 200, 400, GESTURE.holdMs + 100)).toBe('none');
});

test('un second doigt annule le geste en cours', () => {
	const tracker = new GestureTracker();
	expect(tracker.press(1, 100, 100, 0)).toBe(true);
	expect(tracker.press(2, 300, 300, 10), 'le second doigt ne démarre pas d’appui long').toBe(false);
	expect(tracker.holdCompleted(1)).toBe(false);
	expect(tracker.release(1, 100, 100, 100)).toBe('none');
});

test('un contact interrompu par le système ne déclenche rien', () => {
	const tracker = new GestureTracker();
	tracker.press(1, 200, 400, 0);
	tracker.cancel(1);
	expect(tracker.release(1, 200, 400, 100)).toBe('none');
});
