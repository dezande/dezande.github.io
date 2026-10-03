/*
 * Un bouton qui agit au lever du doigt, appui bref ou long (hooks/useSurToucher.ts) : ceux du menu
 * principal. `onAction` remplace onClick.
 */

import type { ButtonHTMLAttributes } from 'preact';
import { useSurToucher } from '../hooks/useSurToucher.ts';

interface Props extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'type'> {
	onAction: () => void;
}

export function BoutonTactile({ onAction, children, ...attributs }: Props) {
	const ref = useSurToucher<HTMLButtonElement>(onAction);
	return (
		<button ref={ref} type="button" {...attributs}>
			{children}
		</button>
	);
}
