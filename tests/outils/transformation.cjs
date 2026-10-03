/*
 * La compilation du code pour Jest : SWC (TypeScript, JSX, modules ES vers CommonJS), options dans
 * jest.config.js.
 *
 * Une retouche pour les paquets publiés seulement en modules ES (React Router) : leur `import.meta`
 * (ex. `import.meta.hot` de Vite), qui n'existe pas en CommonJS, devient un objet vide.
 */
const { createTransformer } = require('@swc/jest');

module.exports = {
	createTransformer(options) {
		const swc = createTransformer(options);
		const retouche = (source, chemin) => (chemin.includes('/node_modules/') ? source.replace(/\bimport\.meta\b/g, '({})') : source);
		return {
			...swc,
			process: (source, chemin, config) => swc.process(retouche(source, chemin), chemin, config),
			processAsync: (source, chemin, config) => swc.processAsync(retouche(source, chemin), chemin, config),
			getCacheKey: (source, chemin, config) => swc.getCacheKey(retouche(source, chemin), chemin, config),
		};
	},
};
