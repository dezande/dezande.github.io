/*
 * Touches du clavier, et des télécommandes de présentation (qui envoient les mêmes touches).
 * Fonction pure : testée sous Node (tests/logic/keys.test.ts).
 *
 * Comme à l'écran, le haut fait pile et le bas fait face : sur une télécommande, « précédent »
 * (Page précédente) donne pile et « suivant » (Page suivante) donne face.
 */

export type KeyAction = 'pile' | 'face' | 'cacher' | 'menu' | null;

const KEYS: Record<string, KeyAction> = {
	ArrowUp: 'pile',
	PageUp: 'pile',
	ArrowDown: 'face',
	PageDown: 'face',
	// Remettre la carte face cachée (l'équivalent du double toucher).
	Home: 'cacher',
	r: 'cacher',
	R: 'cacher',
	Escape: 'menu',
	m: 'menu',
	M: 'menu',
};

export function keyAction(key: string): KeyAction {
	return Object.hasOwn(KEYS, key) ? KEYS[key] : null;
}
