import { describe, expect, it, vi } from 'vitest';

const signOutMock = vi.fn().mockResolvedValue(undefined);
const getDocMock = vi.fn();
/** @type {(user: unknown) => Promise<void>} */
let authStateCallback;

vi.mock('firebase/app', () => ({
	initializeApp: vi.fn(() => ({})),
}));

vi.mock('firebase/auth', () => ({
	GoogleAuthProvider: vi.fn(function GoogleAuthProvider() {
		this.setCustomParameters = vi.fn();
	}),
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

const { onAccessChange, onAuthChange } = await import('./firebase-client.js');

describe('onAccessChange', () => {
	it('da allowed con el usuario si tiene documento en allowedUsers', async () => {
		signOutMock.mockClear();
		getDocMock.mockResolvedValueOnce({ exists: () => true });
		const received = [];
		onAccessChange((access) => received.push(access));
		await authStateCallback({ uid: 'alice' });
		expect(received).toEqual([
			{ status: 'checking' },
			{ status: 'allowed', user: { uid: 'alice' } },
		]);
		expect(signOutMock).not.toHaveBeenCalled();
	});

	it('da denied y cierra la sesión si no tiene documento en allowedUsers', async () => {
		signOutMock.mockClear();
		getDocMock.mockResolvedValueOnce({ exists: () => false });
		const received = [];
		onAccessChange((access) => received.push(access));
		await authStateCallback({ uid: 'mallory' });
		expect(received.at(-1)).toEqual({ status: 'denied' });
		expect(signOutMock).toHaveBeenCalledTimes(1);
	});

	it('sigue en denied cuando llega el cierre de sesión que provoca la denegación', async () => {
		getDocMock.mockResolvedValueOnce({ exists: () => false });
		const received = [];
		onAccessChange((access) => received.push(access));
		await authStateCallback({ uid: 'mallory' });
		await authStateCallback(null);
		expect(received.at(-1)).toEqual({ status: 'denied' });
		await authStateCallback(null);
		expect(received.at(-1)).toEqual({ status: 'signed-out' });
	});

	it('da signed-out cuando no hay usuario', async () => {
		const received = [];
		onAccessChange((access) => received.push(access));
		await authStateCallback(null);
		expect(received).toEqual([{ status: 'signed-out' }]);
	});
});

describe('onAuthChange', () => {
	it('pasa el usuario si tiene documento en allowedUsers', async () => {
		getDocMock.mockResolvedValueOnce({ exists: () => true });
		const received = [];
		onAuthChange((user) => received.push(user));
		await authStateCallback({ uid: 'alice' });
		expect(received).toEqual([{ uid: 'alice' }]);
		expect(signOutMock).not.toHaveBeenCalled();
	});

	it('cierra la sesión y pasa null si no tiene documento en allowedUsers', async () => {
		signOutMock.mockClear();
		getDocMock.mockResolvedValueOnce({ exists: () => false });
		const received = [];
		onAuthChange((user) => received.push(user));
		await authStateCallback({ uid: 'mallory' });
		expect(received).toEqual([null]);
		expect(signOutMock).toHaveBeenCalledTimes(1);
	});

	it('cierra la sesión y pasa null si Firestore deniega la lectura (permission-denied)', async () => {
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
