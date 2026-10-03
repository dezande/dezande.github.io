// Tests des gestes (src/logic/gestures.ts), avec des rythmes de vrais doigts.
// Lancer : npm test
import { DOUBLE_TAP, GestureTracker, HOLD, MOUSE_AFTER_TOUCH_MS, completesResetDoubleTap, isMouseAfterTouch, type StageState, type TapRecord } from '../../../src/tours/boule-de-cristal/logic/gestures.ts';

/* ================= Double tap (règle seule) ================= */

const tapAt = (end: number, durationMs = 120, whileArmed = true, moved = false): TapRecord => ({ end, durationMs, moved, whileArmed });

test('double tap rapide avec un nombre armé', () => {
	expect(completesResetDoubleTap(tapAt(1000), 1150, true)).toBe(true);
});

test('double tap d’un doigt peu assuré : taps appuyés et courte hésitation', () => {
	expect(completesResetDoubleTap(tapAt(1000, 450), 1600, true)).toBe(true);
	expect(completesResetDoubleTap(tapAt(1000, DOUBLE_TAP.maxTapMs), 1000 + DOUBLE_TAP.maxGapMs, true)).toBe(true);
});

test('pause trop longue entre les deux taps', () => {
	expect(completesResetDoubleTap(tapAt(1000), 1000 + DOUBLE_TAP.maxGapMs + 50, true)).toBe(false);
});

test('premier contact trop long (appui, pas un tap)', () => {
	expect(completesResetDoubleTap(tapAt(1000, 900), 1200, true)).toBe(false);
});

test('premier contact qui a glissé', () => {
	expect(completesResetDoubleTap(tapAt(1000, 120, true, true), 1200, true)).toBe(false);
});

test('le tap qui arme le nombre ne compte pas : taper deux fois vite pour armer n’efface rien', () => {
	expect(completesResetDoubleTap(tapAt(1000, 120, false), 1200, true)).toBe(false);
});

test('aucun nombre armé : pas de réinitialisation', () => {
	expect(completesResetDoubleTap(tapAt(1000), 1200, false)).toBe(false);
	expect(completesResetDoubleTap(null, 1200, true)).toBe(false);
});

/* ================= Suivi des contacts (GestureTracker) ================= */

const IDLE: StageState = { armed: false, locked: false };
/** Nombre armé ou affiché. */
const ARMED: StageState = { armed: true, locked: true };
/** Fondu de sortie en cours : verrouillé, mais plus rien d'armé. */
const CLEARING: StageState = { armed: false, locked: true };

/** Tap d'un doigt : posé à `at`, levé `duration` ms plus tard. Renvoie l'action décidée à la pose. */
function tap(g: GestureTracker, at: number, stage: StageState, duration = 100, id = 1) {
	const action = g.press(id, 100, 100, 1, at, stage);
	g.release(id, at + duration);
	return action;
}

test('app au repos : un toucher arme la zone', () => {
	expect(tap(new GestureTracker(), 0, IDLE)).toBe('arm');
});

test('tour en cours : un toucher simple n’arme rien', () => {
	expect(tap(new GestureTracker(), 0, ARMED)).toBe('none');
	expect(tap(new GestureTracker(), 0, CLEARING)).toBe('none');
});

test('un tour complet : armer, double tap pour effacer, réarmer', () => {
	const g = new GestureTracker();
	expect(tap(g, 0, IDLE)).toBe('arm');
	// Nombre affiché : le magicien fait un double tap quelques secondes plus tard.
	expect(tap(g, 5000, ARMED)).toBe('none');
	expect(tap(g, 5250, ARMED)).toBe('reset');
	// Fondu terminé : l'app est de nouveau au repos.
	expect(tap(g, 8000, IDLE)).toBe('arm');
});

test('deux taps rapides pour armer n’effacent pas le nombre', () => {
	const g = new GestureTracker();
	expect(tap(g, 0, IDLE)).toBe('arm');
	expect(tap(g, 200, ARMED)).toBe('none');
});

test('trois taps rapides : un seul effacement', () => {
	const g = new GestureTracker();
	expect(tap(g, 0, ARMED)).toBe('none');
	expect(tap(g, 200, ARMED)).toBe('reset');
	expect(tap(g, 400, CLEARING)).toBe('none');
	expect(tap(g, 600, CLEARING)).toBe('none');
});

test('double tap trop lent : pas d’effacement', () => {
	const g = new GestureTracker();
	tap(g, 0, ARMED);
	expect(tap(g, 100 + DOUBLE_TAP.maxGapMs + 1, ARMED)).toBe('none');
});

test('premier tap qui a glissé : pas de double tap', () => {
	const g = new GestureTracker();
	g.press(1, 100, 100, 1, 0, ARMED);
	g.move(1, 100 + HOLD.slopPx + 1, 100);
	g.release(1, 100);
	expect(tap(g, 200, ARMED)).toBe('none');
});

test('premier contact interrompu par le système : pas de double tap', () => {
	const g = new GestureTracker();
	g.press(1, 100, 100, 1, 0, ARMED);
	g.release(1, 100, true);
	expect(tap(g, 200, ARMED)).toBe('none');
});

test('plusieurs doigts : geste annulé, et le tap précédent est oublié', () => {
	const g = new GestureTracker();
	tap(g, 0, ARMED);
	expect(g.press(2, 50, 50, 2, 150, ARMED)).toBe('cancel');
	expect(g.holdCompleted(2)).toBe(false);
	expect(tap(g, 300, ARMED)).toBe('none');
});

test('plusieurs doigts au repos : rien n’est armé', () => {
	expect(new GestureTracker().press(1, 0, 0, 2, 0, IDLE)).toBe('cancel');
});

/* ---------- Appui long ---------- */

test('appui long : ouvre les réglages si le doigt reste posé, même pendant un tour', () => {
	for (const stage of [IDLE, ARMED, CLEARING]) {
		const g = new GestureTracker();
		g.press(1, 100, 100, 1, 0, stage);
		expect(g.holdCompleted(1)).toBe(true);
	}
});

test('appui long : un petit tremblement du doigt est toléré', () => {
	const g = new GestureTracker();
	g.press(1, 100, 100, 1, 0, IDLE);
	expect(g.move(1, 100 + HOLD.slopPx, 100)).toBe(null);
	expect(g.move(1, 120, 125)).toBe(null);
	expect(g.holdCompleted(1)).toBe(true);
});

test('appui long : annulé si le doigt glisse au-delà de la tolérance', () => {
	const g = new GestureTracker();
	g.press(1, 100, 100, 1, 0, IDLE);
	const distance = g.move(1, 130, 140);
	expect(distance).toBe(50);
	expect(g.holdCompleted(1)).toBe(false);
	// Le glissement n'est signalé qu'une fois, et revenir au point de départ ne rétablit pas l'appui.
	expect(g.move(1, 200, 200)).toBe(null);
	expect(g.move(1, 100, 100)).toBe(null);
	expect(g.holdCompleted(1)).toBe(false);
});

test('appui long : annulé si le doigt est levé ou si un autre doigt se pose', () => {
	const lifted = new GestureTracker();
	lifted.press(1, 100, 100, 1, 0, IDLE);
	lifted.release(1, 2000);
	expect(lifted.holdCompleted(1)).toBe(false);

	const replaced = new GestureTracker();
	replaced.press(1, 100, 100, 1, 0, IDLE);
	replaced.press(2, 200, 200, 1, 1000, ARMED);
	expect(replaced.holdCompleted(1)).toBe(false);
	expect(replaced.holdCompleted(2)).toBe(true);
});

/* ---------- Doigts inconnus et bilan ---------- */

test('mouvements et levers d’un doigt non suivi : ignorés', () => {
	const g = new GestureTracker();
	expect(g.move(7, 500, 500)).toBe(null);
	expect(g.release(7, 100)).toBe(null);
	g.press(1, 100, 100, 1, 0, IDLE);
	expect(g.move(7, 500, 500)).toBe(null);
	expect(g.release(7, 100)).toBe(null);
	expect(g.holdCompleted(1)).toBe(true);
});

test('bilan du contact : durée, glissement maximal, glissé ou non', () => {
	const g = new GestureTracker();
	g.press('mouse', 10, 10, 1, 1000, IDLE);
	g.move('mouse', 30, 10);
	g.move('mouse', 15, 10);
	expect(g.release('mouse', 1800)).toStrictEqual({ durationMs: 800, driftPx: 20, moved: false });
});

/* ---------- Souris ---------- */

test('souris : ignorée juste après un vrai toucher', () => {
	expect(isMouseAfterTouch(1000, 1300)).toBe(true);
	expect(isMouseAfterTouch(1000, 1000 + MOUSE_AFTER_TOUCH_MS)).toBe(false);
	expect(isMouseAfterTouch(-Infinity, 50)).toBe(false);
});
