// Pruebas de las reglas de seguridad de Firestore contra el emulador real
// (no basta con leer el fichero .rules: hay que ejecutarlas). Se corren con
// `npm run test:rules`, que arranca el emulador con `firebase emulators:exec`.
import { readFileSync } from 'node:fs';
import {
	assertFails,
	assertSucceeds,
	initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';

const PROJECT_ID = 'auto-escuelapp-rules-test';
// Cuenta dada de alta en allowedUsers en cada test (ver beforeEach).
const OWNER_UID = 'owner';
// Cuenta con acceso y además en admins (ver beforeEach).
const ADMIN_UID = 'admin';

/** @type {import('@firebase/rules-unit-testing').RulesTestEnvironment} */
let testEnv;

/** Contexto autenticado con una cuenta autorizada (ver firestore.rules). */
function ownerContext() {
	return testEnv.authenticatedContext(OWNER_UID);
}

function adminContext() {
	return testEnv.authenticatedContext(ADMIN_UID);
}

function validAllowedUser(overrides = {}) {
	return { name: 'Hijo', approvedAt: '2026-11-09T10:00:00.000Z', ...overrides };
}

function validAccessRequest(overrides = {}) {
	return {
		displayName: 'Hijo',
		email: 'hijo@example.com',
		requestedAt: '2026-11-09T09:00:00.000Z',
		status: 'pending',
		...overrides,
	};
}

/** @param {string} uid */
async function seedAccessRequest(uid) {
	await testEnv.withSecurityRulesDisabled(async (context) => {
		await context.firestore().doc(`accessRequests/${uid}`).set(validAccessRequest());
	});
}

function validAttempt(overrides = {}) {
	return {
		mode: 'exam',
		topicId: null,
		startedAt: '2026-09-19T10:00:00.000Z',
		finishedAt: '2026-09-19T10:30:00.000Z',
		total: 2,
		correct: 1,
		failures: 1,
		passed: true,
		answers: [
			{ questionId: 'a', correct: true },
			{ questionId: 'b', correct: false },
		],
		...overrides,
	};
}

function validQuestionReport(overrides = {}) {
	return {
		questionId: 'velocidad-autovia',
		reason: 'wrong_answer',
		createdAt: '2026-09-19T10:00:00.000Z',
		...overrides,
	};
}

beforeAll(async () => {
	testEnv = await initializeTestEnvironment({
		projectId: PROJECT_ID,
		firestore: {
			rules: readFileSync('firestore.rules', 'utf8'),
			host: 'localhost',
			port: 8089,
		},
	});
});

afterAll(async () => {
	await testEnv.cleanup();
});

beforeEach(async () => {
	await testEnv.clearFirestore();
	await testEnv.withSecurityRulesDisabled(async (context) => {
		const db = context.firestore();
		await db.doc(`allowedUsers/${OWNER_UID}`).set({ name: 'owner' });
		await db.doc(`allowedUsers/${ADMIN_UID}`).set({ name: 'admin' });
		await db.doc(`admins/${ADMIN_UID}`).set({ name: 'admin' });
	});
});

describe('admins/{userId}', () => {
	it('permite a cada cuenta comprobar si ella es administradora', async () => {
		await assertSucceeds(adminContext().firestore().doc(`admins/${ADMIN_UID}`).get());
		await assertSucceeds(ownerContext().firestore().doc(`admins/${OWNER_UID}`).get());
	});

	it('deniega leer otros documentos, listar o escribir, incluso al administrador', async () => {
		await assertFails(ownerContext().firestore().doc(`admins/${ADMIN_UID}`).get());
		await assertFails(adminContext().firestore().collection('admins').get());
		await assertFails(ownerContext().firestore().doc(`admins/${OWNER_UID}`).set({ name: 'owner' }));
		await assertFails(adminContext().firestore().doc('admins/son').set({ name: 'son' }));
	});
});

describe('accessRequests/{userId}', () => {
	it('permite a una cuenta sin acceso crear y leer su propia solicitud pendiente', async () => {
		const db = testEnv.authenticatedContext('son').firestore();
		await assertSucceeds(db.doc('accessRequests/son').set(validAccessRequest()));
		await assertSucceeds(db.doc('accessRequests/son').get());
	});

	it('deniega crear la solicitud de otra cuenta, sin sesión o con datos inválidos', async () => {
		const db = testEnv.authenticatedContext('son').firestore();
		await assertFails(db.doc('accessRequests/mallory').set(validAccessRequest()));
		await assertFails(db.doc('accessRequests/son').set(validAccessRequest({ status: 'approved' })));
		await assertFails(db.doc('accessRequests/son').set(validAccessRequest({ extra: true })));
		await assertFails(db.doc('accessRequests/son').set(validAccessRequest({ email: 42 })));
		const anonymous = testEnv.unauthenticatedContext().firestore();
		await assertFails(anonymous.doc('accessRequests/son').set(validAccessRequest()));
	});

	it('deniega a quien la pide editarla, borrarla o listar las de otros', async () => {
		await seedAccessRequest('son');
		const db = testEnv.authenticatedContext('son').firestore();
		await assertFails(db.doc('accessRequests/son').update({ status: 'pending', displayName: 'x' }));
		await assertFails(db.doc('accessRequests/son').delete());
		await assertFails(db.collection('accessRequests').get());
		await assertFails(ownerContext().firestore().doc('accessRequests/son').get());
	});

	it('permite al administrador listar, rechazar y borrar solicitudes', async () => {
		await seedAccessRequest('son');
		const db = adminContext().firestore();
		await assertSucceeds(db.collection('accessRequests').get());
		await assertSucceeds(db.doc('accessRequests/son').update({ status: 'rejected' }));
		await assertSucceeds(db.doc('accessRequests/son').delete());
	});

	it('deniega al administrador cambiar algo más que el estado', async () => {
		await seedAccessRequest('son');
		const db = adminContext().firestore();
		await assertFails(db.doc('accessRequests/son').update({ status: 'approved' }));
		await assertFails(db.doc('accessRequests/son').update({ email: 'otro@example.com' }));
	});
});

describe('allowedUsers/{userId}', () => {
	it('permite a una cuenta autorizada leer su propio documento', async () => {
		await assertSucceeds(ownerContext().firestore().doc(`allowedUsers/${OWNER_UID}`).get());
	});

	it('permite a una cuenta no autorizada comprobar que no tiene documento', async () => {
		const db = testEnv.authenticatedContext('mallory').firestore();
		await assertSucceeds(db.doc('allowedUsers/mallory').get());
	});

	it('deniega leer el documento de otra cuenta o listar la colección', async () => {
		const db = testEnv.authenticatedContext('mallory').firestore();
		await assertFails(db.doc(`allowedUsers/${OWNER_UID}`).get());
		await assertFails(db.collection('allowedUsers').get());
	});

	it('deniega escribir a quien no es administrador, incluso darse de alta a sí mismo', async () => {
		const db = testEnv.authenticatedContext('mallory').firestore();
		await assertFails(db.doc('allowedUsers/mallory').set(validAllowedUser()));
		await assertFails(ownerContext().firestore().doc(`allowedUsers/${OWNER_UID}`).delete());
	});

	it('permite al administrador listar, dar de alta y quitar acceso', async () => {
		const db = adminContext().firestore();
		await assertSucceeds(db.collection('allowedUsers').get());
		await assertSucceeds(db.doc('allowedUsers/son').set(validAllowedUser()));
		await assertSucceeds(db.doc(`allowedUsers/${OWNER_UID}`).delete());
	});

	it('deniega al administrador altas con datos inválidos o ediciones', async () => {
		const db = adminContext().firestore();
		await assertFails(db.doc('allowedUsers/son').set({ name: 'son' }));
		await assertFails(db.doc('allowedUsers/son').set(validAllowedUser({ extra: true })));
		await assertFails(db.doc(`allowedUsers/${OWNER_UID}`).update({ name: 'otro' }));
	});

	it('deniega leerla sin autenticación', async () => {
		const db = testEnv.unauthenticatedContext().firestore();
		await assertFails(db.doc(`allowedUsers/${OWNER_UID}`).get());
	});
});

describe('users/{userId}/attempts', () => {
	it('permite a un usuario crear un intento válido bajo su propio uid', async () => {
		const db = ownerContext().firestore();
		await assertSucceeds(
			db.collection(`users/${OWNER_UID}/attempts`).add(validAttempt()),
		);
	});

	it('deniega crear un intento bajo el uid de otra persona', async () => {
		const db = ownerContext().firestore();
		await assertFails(db.collection('users/bob/attempts').add(validAttempt()));
	});

	it('deniega crear o leer sin autenticación', async () => {
		const db = testEnv.unauthenticatedContext().firestore();
		await assertFails(db.collection(`users/${OWNER_UID}/attempts`).add(validAttempt()));
		await assertFails(db.collection(`users/${OWNER_UID}/attempts`).get());
	});

	it('permite leer los propios intentos pero no los de otra persona', async () => {
		await testEnv.withSecurityRulesDisabled(async (context) => {
			await context
				.firestore()
				.collection(`users/${OWNER_UID}/attempts`)
				.add(validAttempt());
		});
		const ownerDb = ownerContext().firestore();
		await assertSucceeds(ownerDb.collection(`users/${OWNER_UID}/attempts`).get());
		const bobDb = testEnv.authenticatedContext('bob').firestore();
		await assertFails(bobDb.collection(`users/${OWNER_UID}/attempts`).get());
	});

	it('deniega un intento con forma inválida (correct + failures != total)', async () => {
		const db = ownerContext().firestore();
		await assertFails(
			db.collection(`users/${OWNER_UID}/attempts`).add(validAttempt({ total: 5 })),
		);
	});

	it('deniega un intento con un campo requerido ausente', async () => {
		const db = ownerContext().firestore();
		const withoutMode = validAttempt();
		delete withoutMode.mode;
		await assertFails(db.collection(`users/${OWNER_UID}/attempts`).add(withoutMode));
	});

	it('deniega un modo que no sea exam o practice', async () => {
		const db = ownerContext().firestore();
		await assertFails(
			db.collection(`users/${OWNER_UID}/attempts`).add(validAttempt({ mode: 'nope' })),
		);
	});

	it('deniega modificar o borrar un intento ya creado, incluso siendo el propietario', async () => {
		// withSecurityRulesDisabled no devuelve lo que retorna el callback:
		// se usa un id fijo (.doc en vez de .add) para no depender de ello.
		await testEnv.withSecurityRulesDisabled(async (context) => {
			await context
				.firestore()
				.doc(`users/${OWNER_UID}/attempts/fixed-id`)
				.set(validAttempt());
		});
		const db = ownerContext().firestore();
		await assertFails(db.doc(`users/${OWNER_UID}/attempts/fixed-id`).update({ passed: false }));
		await assertFails(db.doc(`users/${OWNER_UID}/attempts/fixed-id`).delete());
	});

	it('deniega el acceso a quien sea propietario de su uid pero no sea la cuenta permitida', async () => {
		const db = testEnv.authenticatedContext('mallory').firestore();
		await assertFails(db.collection('users/mallory/attempts').add(validAttempt()));
		await assertFails(db.collection('users/mallory/attempts').get());
	});
});

describe('users/{userId}/questionReports', () => {
	it('permite a un usuario crear un reporte válido bajo su propio uid', async () => {
		const db = ownerContext().firestore();
		await assertSucceeds(
			db.collection(`users/${OWNER_UID}/questionReports`).add(validQuestionReport()),
		);
	});

	it('deniega crear un reporte bajo el uid de otra persona', async () => {
		const db = ownerContext().firestore();
		await assertFails(
			db.collection('users/bob/questionReports').add(validQuestionReport()),
		);
	});

	it('deniega crear o leer sin autenticación', async () => {
		const db = testEnv.unauthenticatedContext().firestore();
		await assertFails(
			db.collection(`users/${OWNER_UID}/questionReports`).add(validQuestionReport()),
		);
		await assertFails(db.collection(`users/${OWNER_UID}/questionReports`).get());
	});

	it('deniega un motivo que no esté en la lista permitida', async () => {
		const db = ownerContext().firestore();
		await assertFails(
			db
				.collection(`users/${OWNER_UID}/questionReports`)
				.add(validQuestionReport({ reason: 'porque sí' })),
		);
	});

	it('permite leer los propios reportes pero no los de otra persona', async () => {
		await testEnv.withSecurityRulesDisabled(async (context) => {
			await context
				.firestore()
				.collection(`users/${OWNER_UID}/questionReports`)
				.add(validQuestionReport());
		});
		const ownerDb = ownerContext().firestore();
		await assertSucceeds(ownerDb.collection(`users/${OWNER_UID}/questionReports`).get());
		const bobDb = testEnv.authenticatedContext('bob').firestore();
		await assertFails(bobDb.collection(`users/${OWNER_UID}/questionReports`).get());
	});

	it('deniega modificar o borrar un reporte ya creado', async () => {
		await testEnv.withSecurityRulesDisabled(async (context) => {
			await context
				.firestore()
				.doc(`users/${OWNER_UID}/questionReports/fixed-id`)
				.set(validQuestionReport());
		});
		const db = ownerContext().firestore();
		await assertFails(
			db.doc(`users/${OWNER_UID}/questionReports/fixed-id`).update({ reason: 'other' }),
		);
		await assertFails(db.doc(`users/${OWNER_UID}/questionReports/fixed-id`).delete());
	});
});
