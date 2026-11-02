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
// Debe coincidir con el UID de isOwner() en firestore.rules.
const OWNER_UID = 'qC7bqJkuxfZ6eHPe4Au0JGXLvHn1';

/** @type {import('@firebase/rules-unit-testing').RulesTestEnvironment} */
let testEnv;

/** Contexto autenticado con la cuenta permitida (ver firestore.rules). */
function ownerContext() {
	return testEnv.authenticatedContext(OWNER_UID);
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
