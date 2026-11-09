// Operaciones del administrador sobre el acceso a la app (AUT-TSK-0034):
// solicitudes en accessRequests/{uid} y cuentas con acceso en
// allowedUsers/{uid}. firestore.rules solo las permite a cuentas en admins.
import {
	collection,
	deleteDoc,
	doc,
	getDoc,
	getDocs,
	getFirestore,
	updateDoc,
	writeBatch,
} from 'firebase/firestore';

/**
 * @typedef {{ uid: string, displayName: string, email: string, requestedAt: string,
 *   status: 'pending' | 'rejected' }} AccessRequest
 * @typedef {{ uid: string, name: string }} AllowedUser
 */

/**
 * @param {{ uid: string }} user
 * @returns {Promise<boolean>}
 */
export async function isAdminUser(user) {
	const snapshot = await getDoc(doc(getFirestore(), 'admins', user.uid));
	return snapshot.exists();
}

/** @returns {Promise<AccessRequest[]>} pendientes primero, después por fecha */
export async function listAccessRequests() {
	const snapshot = await getDocs(collection(getFirestore(), 'accessRequests'));
	const requests = snapshot.docs.map((entry) => ({ uid: entry.id, ...entry.data() }));
	return requests.toSorted(
		(a, b) =>
			Number(b.status === 'pending') - Number(a.status === 'pending') ||
			a.requestedAt.localeCompare(b.requestedAt),
	);
}

/** @returns {Promise<AllowedUser[]>} ordenados por nombre */
export async function listAllowedUsers() {
	const snapshot = await getDocs(collection(getFirestore(), 'allowedUsers'));
	return snapshot.docs
		.map((entry) => ({ uid: entry.id, name: entry.data().name }))
		.toSorted((a, b) => a.name.localeCompare(b.name));
}

/**
 * Da acceso y borra la solicitud en una sola escritura atómica.
 * @param {Pick<AccessRequest, 'uid' | 'displayName' | 'email'>} request
 * @returns {Promise<void>}
 */
export async function approveRequest(request) {
	const db = getFirestore();
	const batch = writeBatch(db);
	batch.set(doc(db, 'allowedUsers', request.uid), {
		// Una cuenta de Google sin nombre visible se muestra por su email.
		name: request.displayName === '' ? request.email : request.displayName,
		approvedAt: new Date().toISOString(),
	});
	batch.delete(doc(db, 'accessRequests', request.uid));
	await batch.commit();
}

/**
 * Una cuenta que ya tiene acceso puede volver a dejar una solicitud (p. ej.
 * si entró con una sesión abierta antes de ser aprobada): esa solicitud ya
 * no tiene sentido y no se muestra (AUT-BUG-0003).
 * @template {{ uid: string }} T
 * @param {T[]} requests
 * @param {AllowedUser[]} users
 * @returns {{ open: T[], stale: T[] }}
 */
export function splitStaleRequests(requests, users) {
	const allowedUids = new Set(users.map((user) => user.uid));
	const { open = [], stale = [] } = Object.groupBy(requests, (request) =>
		allowedUids.has(request.uid) ? 'stale' : 'open',
	);
	return { open, stale };
}

/**
 * @param {string} uid
 * @returns {Promise<void>}
 */
export function deleteRequest(uid) {
	return deleteDoc(doc(getFirestore(), 'accessRequests', uid));
}

/**
 * @param {string} uid
 * @returns {Promise<void>}
 */
export function rejectRequest(uid) {
	return updateDoc(doc(getFirestore(), 'accessRequests', uid), { status: 'rejected' });
}

/**
 * @param {string} uid
 * @returns {Promise<void>}
 */
export function revokeAccess(uid) {
	return deleteDoc(doc(getFirestore(), 'allowedUsers', uid));
}
