import { describe, expect, it } from 'vitest';
import { toEnvFile } from './write-firebase-env.mjs';

const validConfig = {
	apiKey: 'AIza-fake',
	authDomain: 'example.firebaseapp.com',
	projectId: 'example',
	storageBucket: 'example.firebasestorage.app',
	messagingSenderId: '123',
	appId: '1:123:web:abc',
};

describe('toEnvFile', () => {
	it('convierte la config de Firebase al formato PUBLIC_FIREBASE_* que lee firebase-client.js', () => {
		expect(toEnvFile(validConfig)).toBe(
			[
				'PUBLIC_FIREBASE_API_KEY=AIza-fake',
				'PUBLIC_FIREBASE_AUTH_DOMAIN=example.firebaseapp.com',
				'PUBLIC_FIREBASE_PROJECT_ID=example',
				'PUBLIC_FIREBASE_STORAGE_BUCKET=example.firebasestorage.app',
				'PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123',
				'PUBLIC_FIREBASE_APP_ID=1:123:web:abc',
				'',
			].join('\n'),
		);
	});

	it('lanza si falta alguna clave esperada en la config', () => {
		const withoutStorageBucket = { ...validConfig, storageBucket: undefined };
		expect(() => toEnvFile(withoutStorageBucket)).toThrow(/storageBucket/);
	});
});
