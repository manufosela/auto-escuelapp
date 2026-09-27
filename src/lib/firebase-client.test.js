import { describe, expect, it, vi } from 'vitest';

const signOutMock = vi.fn().mockResolvedValue(undefined);
const getDocMock = vi.fn();
/** @type {(user: unknown) => Promise<void>} */
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

vi.mock('firebase/firestore', () => ({
	doc: vi.fn(() => ({})),
	getDoc: getDocMock,
	getFirestore: vi.fn(() => ({})),
}));

const { onAuthChange } = await import('./firebase-client.js');

describe('onAuthChange', () => {
	it('pasa el usuario si Firestore permite la lectura de sondeo (cuenta autorizada por firestore.rules)', async () => {
		getDocMock.mockResolvedValueOnce({ exists: () => false });
		const received = [];
		onAuthChange((user) => received.push(user));
		await authStateCallback({ uid: 'alice' });
		expect(received).toEqual([{ uid: 'alice' }]);
		expect(signOutMock).not.toHaveBeenCalled();
	});

	it('cierra la sesión y pasa null si Firestore deniega la lectura de sondeo (permission-denied)', async () => {
		signOutMock.mockClear();
		getDocMock.mockRejectedValueOnce({ code: 'permission-denied' });
		const received = [];
		onAuthChange((user) => received.push(user));
		await authStateCallback({ uid: 'mallory' });
		expect(received).toEqual([null]);
		expect(signOutMock).toHaveBeenCalledTimes(1);
	});

	it('pasa null tal cual cuando no hay usuario', async () => {
		signOutMock.mockClear();
		const received = [];
		onAuthChange((user) => received.push(user));
		await authStateCallback(null);
		expect(received).toEqual([null]);
		expect(signOutMock).not.toHaveBeenCalled();
	});

	it('relanza errores de Firestore que no sean permission-denied', async () => {
		getDocMock.mockRejectedValueOnce(new Error('network down'));
		const received = [];
		onAuthChange((user) => received.push(user));
		await expect(authStateCallback({ uid: 'alice' })).rejects.toThrow('network down');
		expect(received).toEqual([]);
	});
});
