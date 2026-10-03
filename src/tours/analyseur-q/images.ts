/*
 * Les images des slides. content/slides.ts les nomme comme avant, « images/logo.svg » (le chemin
 * que vérifie logic/slides.ts) ; les fichiers sont rangés dans src/assets/images/analyseur-q/ et
 * empaquetés avec l'app. Chaque image est importée ici une par une, et non par un motif : une
 * image renommée ou supprimée fait échouer la compilation, au lieu d'un cadre vide sur scène.
 *
 * Ajouter une image : la placer dans src/assets/images/analyseur-q/, l'importer ci-dessous et
 * l'ajouter à IMAGES sous son nom « images/<fichier> ».
 */

import troisDePique from '../../assets/images/analyseur-q/3-de-pique.svg';
import carreau from '../../assets/images/analyseur-q/carreau.svg';
import cartesPaires from '../../assets/images/analyseur-q/cartes-paires.svg';
import figureBarreeEn from '../../assets/images/analyseur-q/figure-barree-en.svg';
import figureBarree from '../../assets/images/analyseur-q/figure-barree.svg';
import logo from '../../assets/images/analyseur-q/logo.svg';
import royalFlushCoeurEn from '../../assets/images/analyseur-q/royal-flush-coeur-en.svg';
import royalFlushCoeur from '../../assets/images/analyseur-q/royal-flush-coeur.svg';

/** Le nom d'une image dans content/slides.ts → son adresse dans l'app empaquetée. */
const IMAGES: Readonly<Record<string, string>> = {
	'images/3-de-pique.svg': troisDePique,
	'images/carreau.svg': carreau,
	'images/cartes-paires.svg': cartesPaires,
	'images/figure-barree-en.svg': figureBarreeEn,
	'images/figure-barree.svg': figureBarree,
	'images/logo.svg': logo,
	'images/royal-flush-coeur-en.svg': royalFlushCoeurEn,
	'images/royal-flush-coeur.svg': royalFlushCoeur,
};

/** L'adresse de l'image `chemin` (« images/logo.svg »), ou undefined si elle n'est pas déclarée ici. */
export function adresseDeLImage(chemin: string): string | undefined {
	if (!Object.hasOwn(IMAGES, chemin)) {
		// Bien visible pendant les répétitions : l'image manque ici, pas seulement à l'écran.
		console.error(`Analyseur Q : image inconnue « ${chemin} » (à déclarer dans src/tours/analyseur-q/images.ts)`);
		return undefined;
	}
	return IMAGES[chemin];
}
