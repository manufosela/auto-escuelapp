// Persistencia del historial de intentos: en Firestore si hay sesión, en
// localStorage si no. Al iniciar sesión, los intentos locales se suben y se
// borran de local (una sola vez, no se duplican).
//
// firebase/firestore se importa con import() dinámico (nunca en el nivel
// superior del módulo): este fichero se carga en el layout global de toda
// la app, y la mayoría de páginas (temario, elegir tema) no llegan a
// guardar ni leer ningún intento. Con import estático, Firestore entraba en
// el chunk inicial de cada página (AUT-TSK-0025).
import { auth, onAuthChange } from './firebase-client.js';

/** @returns {Promise<typeof import('firebase/firestore')>} */
function loadFirestore() {
	return import('firebase/firestore');
}

const LOCAL_STORAGE_KEY = 'auto-escuelapp:local-attempts:v1';

function readLocalAttempts() {
	try {
		const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
		return raw ? JSON.parse(raw) : [];
	} catch {
		return [];
	}
}

function writeLocalAttempts(attempts) {
	try {
		localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(attempts));
	} catch {
		// almacenamiento no disponible: el intento se pierde al recargar,
		// pero la app sigue funcionando (ver AC de AUT-TSK-0013).
	}
}

/**
 * Guarda un intento: en Firestore si hay sesión, si no en localStorage.
 * @param {import('./attempt.js').Attempt} attempt
 * @returns {Promise<void>}
 */
export async function saveAttempt(attempt) {
	const user = auth.currentUser;
	if (!user) {
		writeLocalAttempts([...readLocalAttempts(), attempt]);
		return;
	}
	const { addDoc, collection, getFirestore } = await loadFirestore();
	await addDoc(collection(getFirestore(), 'users', user.uid, 'attempts'), attempt);
}

/**
 * Sube a Firestore los intentos guardados localmente y los borra de local.
 * No hace nada si no hay ninguno.
 * @param {string} uid
 * @returns {Promise<number>} número de intentos migrados
 */
export async function migrateLocalAttempts(uid) {
	const attempts = readLocalAttempts();
	if (attempts.length === 0) return 0;
	const { addDoc, collection, getFirestore } = await loadFirestore();
	const attemptsRef = collection(getFirestore(), 'users', uid, 'attempts');
	await Promise.all(attempts.map((attempt) => addDoc(attemptsRef, attempt)));
	writeLocalAttempts([]);
	return attempts.length;
}

/**
 * Se suscribe una sola vez para migrar el historial local en cuanto haya
 * sesión. Pensado para llamarse una vez desde el layout de la app.
 * @returns {() => void} función para cancelar la suscripción
 */
export function watchAndMigrateLocalAttempts() {
	return onAuthChange((user) => {
		if (user) migrateLocalAttempts(user.uid).catch((error) => console.error('history-store: fallo migrando el historial local', error));
	});
}

/**
 * @returns {Promise<import('./attempt.js').Attempt[]>} los intentos del
 *   usuario con sesión iniciada, o los locales si no hay sesión.
 */
export async function loadAttempts() {
	const user = auth.currentUser;
	if (!user) return readLocalAttempts();
	const { collection, getDocs, getFirestore } = await loadFirestore();
	const snapshot = await getDocs(collection(getFirestore(), 'users', user.uid, 'attempts'));
	return snapshot.docs.map((doc) => doc.data());
}
