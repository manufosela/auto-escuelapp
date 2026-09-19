// Integración mínima que genera un service worker (Workbox) precacheando
// todo el output estático tras el build.
//
// No se usa @vite-pwa/astro: verificado en AUT-TSK-0011 que no soporta
// oficialmente Astro 7 (su rango de peer llega hasta ^5) y que, con Astro
// 7.3.3, no inyecta el <link rel="manifest"> ni el script de registro en el
// HTML generado — habría que forzar --legacy-peer-deps en todo el proyecto
// para una integración cuya función principal (la inyección) no funciona.
// El manifest se sirve como fichero estático (public/manifest.webmanifest)
// y el registro del service worker se hace a mano (ver BaseLayout.astro).
import { fileURLToPath } from 'node:url';
import { generateSW } from 'workbox-build';

/**
 * @returns {import('astro').AstroIntegration}
 */
export function pwaServiceWorker() {
	return {
		name: 'pwa-service-worker',
		hooks: {
			'astro:build:done': async ({ dir, logger }) => {
				const distDir = fileURLToPath(dir);
				const { count, size, warnings } = await generateSW({
					globDirectory: distDir,
					globPatterns: ['**/*.{html,js,css,svg,png,webmanifest,json}'],
					swDest: `${distDir}/sw.js`,
					cleanupOutdatedCaches: true,
					clientsClaim: true,
					skipWaiting: true,
					// Astro genera <ruta>/index.html; sin esto, una navegación a
					// /practica (sin /index.html explícito) no encuentra su
					// entrada precacheada y falla en offline. Verificado con
					// Chrome DevTools: sin esta opción, "/" funciona pero
					// "/practica" da ERR_CONNECTION_REFUSED estando offline.
					directoryIndex: 'index.html',
				});
				for (const warning of warnings) logger.warn(warning);
				logger.info(
					`service worker generado: ${count} ficheros precacheados (${Math.round(size / 1024)} KB)`,
				);
			},
		},
	};
}
