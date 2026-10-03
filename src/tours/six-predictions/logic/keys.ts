/*
 * Touches du clavier, et des télécommandes de présentation (qui envoient les mêmes touches).
 * Fonction pure : testée sous Node (tests/logic/keys.test.ts).
 */

export type KeyAction = 'toucher' | 'remettre' | 'menu' | null;

const KEYS: Record<string, KeyAction> = {
	// Avancer dans la routine : retourner la carte, puis la faire sortir.
	ArrowRight: 'toucher',
	ArrowDown: 'toucher',
	PageDown: 'toucher',
	' ': 'toucher',
	Enter: 'toucher',
	// Remettre le paquet, faces en bas (l'équivalent du double toucher).
	Home: 'remettre',
	r: 'remettre',
	R: 'remettre',
	Escape: 'menu',
	m: 'menu',
	M: 'menu',
};

export function keyAction(key: string): KeyAction {
	return Object.hasOwn(KEYS, key) ? KEYS[key] : null;
}
