import { describe, expect, it, vi } from 'vitest';

const signOutMock = vi.fn().mockResolvedValue(undefined);
/** @type {(user: unknown) => void} */
let authStateCallback;

vi.mock('firebase/app', () => ({
	initializeApp: vi.fn(() => ({})),
}));

vi.mock('firebase/auth', () => ({
	GoogleAuthProvider: vi.fn(),
	getAuth: vi.fn(() => ({})),
	onAuthStateChanged: vi.fn((_auth, callback) => {
		authStateCallback = callback;
		return () => {};
	}),
	signInWithPopup: vi.fn(),
	signInWithRedirect: vi.fn(),
	signOut: signOutMock,
}));

const { onAuthChange } = await import('./firebase-client.js');

describe('onAuthChange', () => {
	it('pasa el usuario si su email coincide con el permitido (uso personal, AUT-TSK-0010)', () => {
		const received = [];
		onAuthChange((user) => received.push(user));
		authStateCallback({ email: 'owner@example.com' });
		expect(received).toEqual([{ email: 'owner@example.com' }]);
		expect(signOutMock).not.toHaveBeenCalled();
	});

	it('cierra la sesión y pasa null si el email no coincide', () => {
		signOutMock.mockClear();
		const received = [];
		onAuthChange((user) => received.push(user));
		authStateCallback({ email: 'otra-cuenta@gmail.com' });
		expect(received).toEqual([null]);
		expect(signOutMock).toHaveBeenCalledTimes(1);
	});

	it('pasa null tal cual cuando no hay usuario', () => {
		signOutMock.mockClear();
		const received = [];
		onAuthChange((user) => received.push(user));
		authStateCallback(null);
		expect(received).toEqual([null]);
		expect(signOutMock).not.toHaveBeenCalled();
	});
});
