/*
 * Les tests, tous avec Jest, en trois projets :
 *
 *   unitaires   la logique pure, sous Node (tests/logic/, tests/tours/) ;
 *   composants  les composants Preact dans un DOM simulé (jsdom), avec Preact Testing Library
 *               (tests/composants/) ;
 *   e2e         l'app compilée (dist/) dans un vrai Chrome sans interface, sur un écran de
 *               téléphone (tests/e2e/) — lancés à part : npm run build && npm run test:e2e.
 *
 * Le code est compilé par SWC (TypeScript, JSX pour Preact) ; les styles et les fichiers (polices, images)
 * importés par les composants sont remplacés par des modules factices (tests/outils/).
 */

/** TypeScript et JSX vers CommonJS, pour Jest. */
const swc = ['@swc/jest', {
	jsc: {
		parser: { syntax: 'typescript', tsx: true },
		transform: { react: { runtime: 'automatic', importSource: 'preact' } },
		target: 'es2022',
	},
	module: { type: 'commonjs' },
}];

const commun = {
	transform: { '^.+\\.[cm]?[jt]sx?$': swc },
	// Preact n'est publié qu'en modules ES : il est compilé comme le reste.
	transformIgnorePatterns: ['/node_modules/(?!preact/)'],
	moduleNameMapper: {
		'\\.(scss|css)$': '<rootDir>/tests/outils/style.ts',
		'\\.(svg|png|webp|woff2)$': '<rootDir>/tests/outils/fichier.ts',
	},
	// Le second argument de expect() : le message qui dit ce qui a échoué.
	setupFilesAfterEnv: ['jest-expect-message'],
};

export default {
	projects: [
		{
			...commun,
			displayName: 'unitaires',
			testEnvironment: 'node',
			testMatch: ['<rootDir>/tests/logic/**/*.test.ts', '<rootDir>/tests/tours/**/*.test.ts'],
		},
		{
			...commun,
			displayName: 'composants',
			testEnvironment: 'jsdom',
			// Les variantes CommonJS des bibliothèques, et non celles « browser » (modules ES).
			testEnvironmentOptions: { customExportConditions: ['require', 'default'] },
			testMatch: ['<rootDir>/tests/composants/**/*.test.tsx'],
			setupFiles: ['<rootDir>/tests/outils/navigateur.ts'],
			setupFilesAfterEnv: [...commun.setupFilesAfterEnv, '@testing-library/jest-dom'],
		},
		{
			...commun,
			displayName: 'e2e',
			testEnvironment: 'node',
			testMatch: ['<rootDir>/tests/e2e/**/*.e2e.ts'],
		},
	],
};
