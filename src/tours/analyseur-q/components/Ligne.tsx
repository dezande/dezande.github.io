/*
 * Une ligne de texte d'une slide, avec ses **mises en valeur** (logic/slides.ts : parseInline).
 * Le texte est toujours affiché tel quel, jamais interprété comme du HTML.
 */

import { parseInline } from '../logic/slides.ts';

export function Ligne({ texte }: { texte: string }) {
	return <>{parseInline(texte).map((morceau, n) => (morceau.strong ? <strong key={n}>{morceau.text}</strong> : morceau.text))}</>;
}
