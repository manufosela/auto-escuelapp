import { describe, expect, it, vi } from 'vitest';

const signOutMock = vi.fn().mockResolvedValue(undefined);
const getDocMock = vi.fn();
const setDocMock = vi.fn().mockResolvedValue(undefined);
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
	setDoc: setDocMock,
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

	it('da denied, registra la solicitud pendiente y cierra la sesión si no tiene acceso', async () => {
		signOutMock.mockClear();
		setDocMock.mockClear();
		getDocMock
			.mockResolvedValueOnce({ exists: () => false })
			.mockResolvedValueOnce({ exists: () => false });
		const received = [];
		onAccessChange((access) => received.push(access));
		await authStateCallback({ uid: 'son', displayName: 'Hijo', email: 'hijo@example.com' });
		expect(received.at(-1)).toEqual({ status: 'denied', request: 'pending' });
		expect(setDocMock).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({ displayName: 'Hijo', email: 'hijo@example.com', status: 'pending' }),
		);
		expect(signOutMock).toHaveBeenCalledTimes(1);
	});

	it('no repite la solicitud y avisa si ya estaba rechazada', async () => {
		setDocMock.mockClear();
		getDocMock
			.mockResolvedValueOnce({ exists: () => false })
			.mockResolvedValueOnce({ exists: () => true, data: () => ({ status: 'rejected' }) });
		const received = [];
		onAccessChange((access) => received.push(access));
		await authStateCallback({ uid: 'son' });
		expect(received.at(-1)).toEqual({ status: 'denied', request: 'rejected' });
		expect(setDocMock).not.toHaveBeenCalled();
	});

	it('da denied con la solicitud fallida si no se puede registrar', async () => {
		const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
		getDocMock.mockResolvedValueOnce({ exists: () => false }).mockResolvedValueOnce({ exists: () => false });
		setDocMock.mockRejectedValueOnce(new Error('network down'));
		const received = [];
		onAccessChange((access) => received.push(access));
		await authStateCallback({ uid: 'son' });
		expect(received.at(-1)).toEqual({ status: 'denied', request: 'failed' });
		expect(consoleError).toHaveBeenCalled();
		consoleError.mockRestore();
	});

	it('sigue en denied cuando llega el cierre de sesión que provoca la denegación', async () => {
		getDocMock
			.mockResolvedValueOnce({ exists: () => false })
			.mockResolvedValueOnce({ exists: () => true, data: () => ({ status: 'pending' }) });
		const received = [];
		onAccessChange((access) => received.push(access));
		await authStateCallback({ uid: 'mallory' });
		await authStateCallback(null);
		expect(received.at(-1)).toEqual({ status: 'denied', request: 'pending' });
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
