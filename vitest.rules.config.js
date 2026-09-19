// Config separada para las pruebas de reglas de Firestore: necesitan el
// emulador arrancado (ver `npm run test:rules`), así que no forman parte de
// la suite normal de `npm test`.
import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'node',
		include: ['tests/**/*.test.js'],
	},
});
