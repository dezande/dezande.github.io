/*
 * Ce que jsdom n'a pas et que l'app attend du navigateur, posé avant chaque fichier de tests des
 * composants (jest.config.js, setupFiles) :
 *   - #app, que le verrou portrait du kit (kit/web/orientation.ts) cherche dès son import ;
 *   - matchMedia (pointeur grossier, mode d'affichage) ;
 *   - la lecture des vidéos, que le maintien de l'écran allumé (kit/web/wake-lock.ts) lance ;
 *   - TextEncoder et TextDecoder, dont React Router se sert.
 */

import { TextDecoder, TextEncoder } from 'node:util';

Object.assign(globalThis, { TextEncoder, TextDecoder });

const app = document.createElement('div');
app.id = 'app';
document.body.append(app);

window.matchMedia ??= (query: string) => ({
	matches: false,
	media: query,
	onchange: null,
	addEventListener: () => undefined,
	removeEventListener: () => undefined,
	addListener: () => undefined,
	removeListener: () => undefined,
	dispatchEvent: () => false,
});

HTMLMediaElement.prototype.play = () => Promise.resolve();
HTMLMediaElement.prototype.pause = () => undefined;
