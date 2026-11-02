#!/usr/bin/env node
// Convierte la config web de Firebase (bajada con `firebase apps:sdkconfig`)
// al .env que lee firebase-client.js. Se usa en CI justo antes del build
// para no commitear nunca esos valores (AUT-TSK-0026): Firebase es la única
// fuente, no se duplican en un segundo sitio.
import { readFileSync, writeFileSync } from 'node:fs';

const KEY_MAP = {
	apiKey: 'PUBLIC_FIREBASE_API_KEY',
	authDomain: 'PUBLIC_FIREBASE_AUTH_DOMAIN',
	projectId: 'PUBLIC_FIREBASE_PROJECT_ID',
	storageBucket: 'PUBLIC_FIREBASE_STORAGE_BUCKET',
	messagingSenderId: 'PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
	appId: 'PUBLIC_FIREBASE_APP_ID',
};

/**
 * @param {Record<string, string>} config
 * @returns {string}
 */
export function toEnvFile(config) {
	const lines = Object.entries(KEY_MAP).map(([sourceKey, envKey]) => {
		const value = config[sourceKey];
		if (!value) throw new Error(`write-firebase-env: falta "${sourceKey}" en la config de Firebase`);
		return `${envKey}=${value}`;
	});
	return `${lines.join('\n')}\n`;
}

function main() {
	const [, , configPath, outPath] = process.argv;
	if (!configPath || !outPath) {
		console.error('Uso: write-firebase-env.mjs <config.json> <ruta-salida>');
		process.exit(1);
	}
	const config = JSON.parse(readFileSync(configPath, 'utf8'));
	writeFileSync(outPath, toEnvFile(config));
}

if (import.meta.url === `file://${process.argv[1]}`) {
	main();
}
