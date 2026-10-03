/*
 * Les réglages de la carte de visite, ouverts par l'écrou ⚙ du menu principal : rappel des numéros
 * de la routine Arcane Système, délai avant le retournement, durée du retournement, luminosité,
 * aides à la répétition (jauge de l'appui long, test des zones), réglages par défaut. L'interface de
 * la carte est en français seulement.
 */

import { PanneauReglages } from '../../../components/PanneauReglages.tsx';
import { ZONE_NAMES } from '../content/zones.ts';
import { NUMEROS, type Settings } from '../logic/settings.ts';

interface Props {
	reglages: Settings;
	/** Enregistre les réglages (null : réglages par défaut). */
	enregistrer: (suivants: Settings | null) => void;
	/** Passe des réglages au mode « Test des zones ». */
	surTest: () => void;
}

/** Nombre à la française, une décimale au plus (« 1,5 »). */
const fmt = (n: number): string => n.toLocaleString('fr-FR', { maximumFractionDigits: 1 });

/** Curseurs : réglage piloté, bornes, et texte affiché à côté. */
const CURSEURS = [
	{ cle: 'delay', id: 'delay', titre: 'Délai avant le retournement', min: 0, max: 10, pas: 0.5, label: (v: number) => (v === 0 ? 'immédiat' : `${fmt(v)} s`) },
	{ cle: 'fade', id: 'fade', titre: 'Durée du retournement', min: 0.5, max: 6, pas: 0.1, label: (v: number) => `${fmt(v)} s` },
	{ cle: 'brightness', id: 'brightness', titre: 'Luminosité', min: 30, max: 100, pas: 5, label: (v: number) => `${v} %` },
] as const;

export function Reglages({ reglages, enregistrer, surTest }: Props) {
	const changer = (changement: Partial<Settings>): void => enregistrer({ ...reglages, ...changement });

	return (
		<PanneauReglages id="settings" classeNom="sub">
			<div className="card">
				<div className="row-label">Arcane Système <small>4 coins de l'écran</small></div>
				{/* Rappel des numéros, coin par coin (lecture seule) : ils ne changent pas. */}
				<div className="values" id="routine-values">
					{NUMEROS.map((valeur, i) => (
						<div key={i} className="value-row"><span>{ZONE_NAMES[i] ?? ''}</span><b>{valeur}</b></div>
					))}
				</div>
			</div>

			{CURSEURS.map(({ cle, id, titre, min, max, pas, label }) => (
				<div key={id} className="card">
					<label className="row-label" htmlFor={id}>{titre} <output id={`${id}-out`}>{label(reglages[cle])}</output></label>
					<input id={id} type="range" min={min} max={max} step={pas} value={reglages[cle]} onChange={(event) => changer({ [cle]: Number(event.target.value) })} />
				</div>
			))}

			<div className="card options">
				<p className="hint">Aide à la répétition : à masquer avant de jouer si le public voit l'écran.</p>
				<label className="toggle-row" htmlFor="show-hold-ring">Afficher la jauge de l'appui long <input id="show-hold-ring" type="checkbox" checked={reglages.showHoldRing} onChange={(event) => changer({ showHoldRing: event.target.checked })} /></label>
				{/* Le test des zones est une aide à la répétition : il rejoint les autres. */}
				<button type="button" id="test-btn" className="test-zones" onClick={surTest}>Test des zones</button>
			</div>

			<button type="button" id="defaults-btn" className="link" onClick={() => enregistrer(null)}>Rétablir les réglages par défaut</button>
		</PanneauReglages>
	);
}
