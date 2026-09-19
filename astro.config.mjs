// @ts-check
import { defineConfig } from 'astro/config';
import { pwaServiceWorker } from './src/integrations/pwa.mjs';

// https://astro.build/config
export default defineConfig({
	integrations: [pwaServiceWorker()],
});
