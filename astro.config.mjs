// @ts-check
import { defineConfig } from 'astro/config';
import { pwaServiceWorker } from './src/integrations/pwa.mjs';

// https://astro.build/config
export default defineConfig({
	integrations: [pwaServiceWorker()],
	vite: {
		build: {
			// firebase/firestore (~540 KB minificado) es el único chunk que
			// supera el límite por defecto (500 KB). Ya no forma parte del
			// bundle inicial de ninguna página (AUT-TSK-0025: import()
			// dinámico en history-store.js y question-reports.js, solo se
			// pide al guardar o leer un intento) — el aviso por defecto sería
			// un falso positivo sobre un chunk que sabemos que es bajo demanda.
			chunkSizeWarningLimit: 600,
		},
	},
});
