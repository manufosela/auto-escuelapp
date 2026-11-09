import { beforeEach, describe, expect, it, vi } from 'vitest';

const getDocMock = vi.fn();
const getDocsMock = vi.fn();
const updateDocMock = vi.fn().mockResolvedValue(undefined);
const deleteDocMock = vi.fn().mockResolvedValue(undefined);
const batchSet = vi.fn();
const batchDelete = vi.fn();
const batchCommit = vi.fn().mockResolvedValue(undefined);

vi.mock('firebase/firestore', () => ({
	collection: vi.fn((_db, name) => ({ path: name })),
	deleteDoc: deleteDocMock,
	doc: vi.fn((_db, name, id) => ({ path: `${name}/${id}` })),
	getDoc: getDocMock,
	getDocs: getDocsMock,
	getFirestore: vi.fn(() => ({})),
	updateDoc: updateDocMock,
	writeBatch: vi.fn(() => ({ set: batchSet, delete: batchDelete, commit: batchCommit })),
}));

const { approveRequest, isAdminUser, listAccessRequests, listAllowedUsers, rejectRequest, revokeAccess } =
	await import('./access-admin.js');

/** @param {Array<[string, object]>} entries */
function snapshotOf(entries) {
	return { docs: entries.map(([id, data]) => ({ id, data: () => data })) };
}

beforeEach(() => {
	vi.clearAllMocks();
});

describe('isAdminUser', () => {
	it('es true si la cuenta tiene documento en admins', async () => {
		getDocMock.mockResolvedValueOnce({ exists: () => true });
		await expect(isAdminUser({ uid: 'admin' })).resolves.toBe(true);
	});

	it('es false si no lo tiene', async () => {
		getDocMock.mockResolvedValueOnce({ exists: () => false });
		await expect(isAdminUser({ uid: 'son' })).resolves.toBe(false);
	});
});

describe('listAccessRequests', () => {
	it('devuelve las solicitudes con su uid, las pendientes primero y por fecha', async () => {
		getDocsMock.mockResolvedValueOnce(
			snapshotOf([
				['b', { displayName: 'B', email: 'b@example.com', requestedAt: '2026-11-02', status: 'rejected' }],
				['c', { displayName: 'C', email: 'c@example.com', requestedAt: '2026-11-03', status: 'pending' }],
				['a', { displayName: 'A', email: 'a@example.com', requestedAt: '2026-11-01', status: 'pending' }],
			]),
		);
		const requests = await listAccessRequests();
		expect(requests.map((request) => request.uid)).toEqual(['a', 'c', 'b']);
		expect(requests[0]).toEqual({
			uid: 'a',
			displayName: 'A',
			email: 'a@example.com',
			requestedAt: '2026-11-01',
			status: 'pending',
		});
	});
});

describe('listAllowedUsers', () => {
	it('devuelve los usuarios con acceso ordenados por nombre', async () => {
		getDocsMock.mockResolvedValueOnce(snapshotOf([['y', { name: 'Zoe' }], ['x', { name: 'Ana' }]]));
		await expect(listAllowedUsers()).resolves.toEqual([
			{ uid: 'x', name: 'Ana' },
			{ uid: 'y', name: 'Zoe' },
		]);
	});
});

describe('approveRequest', () => {
	it('da de alta en allowedUsers y borra la solicitud en una sola escritura', async () => {
		await approveRequest({ uid: 'son', displayName: 'Hijo', email: 'hijo@example.com' });
		expect(batchSet).toHaveBeenCalledWith(
			{ path: 'allowedUsers/son' },
			{ name: 'Hijo', approvedAt: expect.any(String) },
		);
		expect(batchDelete).toHaveBeenCalledWith({ path: 'accessRequests/son' });
		expect(batchCommit).toHaveBeenCalledTimes(1);
	});

	it('usa el email como nombre si la cuenta no tiene nombre', async () => {
		await approveRequest({ uid: 'son', displayName: '', email: 'hijo@example.com' });
		expect(batchSet).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ name: 'hijo@example.com' }));
	});
});

describe('rejectRequest', () => {
	it('marca la solicitud como rechazada', async () => {
		await rejectRequest('son');
		expect(updateDocMock).toHaveBeenCalledWith({ path: 'accessRequests/son' }, { status: 'rejected' });
	});
});

describe('revokeAccess', () => {
	it('borra el documento de allowedUsers', async () => {
		await revokeAccess('son');
		expect(deleteDocMock).toHaveBeenCalledWith({ path: 'allowedUsers/son' });
	});
});
