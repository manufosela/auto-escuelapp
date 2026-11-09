// Cliente de Firebase (Auth). La config de abajo es la config pública de la
// app web (apiKey incluida): no es un secreto, está pensada para ir en el
// cliente y protegida por las reglas de seguridad de Firebase, no por
// mantenerla oculta. Nunca añadir aquí una clave de servicio (Admin SDK).
// Los valores viven en PUBLIC_FIREBASE_* (.env, nunca commiteado) en vez de
// hardcodeados: ver .env.example y AUT-TSK-0026.
import { initializeApp } from 'firebase/app';
import {
	GoogleAuthProvider,
	getAuth,
	onAuthStateChanged,
	signInWithPopup,
	signInWithRedirect,
	signOut,
} from 'firebase/auth';

const firebaseConfig = {
	projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID,
	appId: import.meta.env.PUBLIC_FIREBASE_APP_ID,
	storageBucket: import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET,
	apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY,
	authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
	messagingSenderId: import.meta.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
// Pedir siempre elegir cuenta: tras un acceso denegado hay que poder entrar
// con otra, no con la última usada (AUT-TSK-0032).
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Solo las cuentas con documento en allowedUsers/{uid} usan la app
 * (AUT-TSK-0031). firestore.rules aplica la misma lista a los datos; esta
 * lectura sirve para que la interfaz sepa si mostrar la app o cerrar sesión.
 * @param {import('firebase/auth').User} user
 * @returns {Promise<boolean>}
 */
async function isAllowedUser(user) {
	const { doc, getDoc, getFirestore } = await import('firebase/firestore');
	try {
		const snapshot = await getDoc(doc(getFirestore(), 'allowedUsers', user.uid));
		return snapshot.exists();
	} catch (error) {
		if (error?.code === 'permission-denied') return false;
		throw error;
	}
}

/**
 * Deja la solicitud de acceso de una cuenta sin acceso en
 * accessRequests/{uid}, si no la tenía ya (AUT-TSK-0035). El administrador
 * la aprueba o la rechaza desde /admin.
 * @param {import('firebase/auth').User} user
 * @returns {Promise<'pending' | 'rejected' | 'failed'>}
 */
async function requestAccess(user) {
	try {
		const { doc, getDoc, getFirestore, setDoc } = await import('firebase/firestore');
		const requestRef = doc(getFirestore(), 'accessRequests', user.uid);
		const snapshot = await getDoc(requestRef);
		if (snapshot.exists()) return snapshot.data().status;
		await setDoc(requestRef, {
			displayName: user.displayName ?? '',
			email: user.email ?? '',
			requestedAt: new Date().toISOString(),
			status: 'pending',
		});
		return 'pending';
	} catch (error) {
		console.error('firebase-client: fallo registrando la solicitud de acceso', error);
		return 'failed';
	}
}

/**
 * Inicia sesión con Google. Usa una ventana emergente y, si el navegador la
 * bloquea, recurre a una redirección de página completa.
 * @returns {Promise<void>}
 */
export async function signInWithGoogle() {
	try {
		await signInWithPopup(auth, googleProvider);
	} catch (error) {
		if (error?.code === 'auth/popup-blocked' || error?.code === 'auth/cancelled-popup-request') {
			await signInWithRedirect(auth, googleProvider);
			return;
		}
		throw error;
	}
}

/** @returns {Promise<void>} */
export function signOutUser() {
	return signOut(auth);
}

/**
 * @typedef {{ status: 'checking' } | { status: 'signed-out' }
 *   | { status: 'denied', request: 'pending' | 'rejected' | 'failed' }
 *   | { status: 'allowed', user: import('firebase/auth').User }} Access
 */

/**
 * Estado de acceso a la app. Una cuenta sin documento en allowedUsers deja
 * su solicitud, queda en 'denied' y se le cierra la sesión; el cierre de
 * sesión que eso provoca no la devuelve a 'signed-out', para que la interfaz
 * pueda avisar.
 * @param {(access: Access) => void} callback
 * @returns {() => void} función para cancelar la suscripción
 */
export function onAccessChange(callback) {
	/** @type {Access | null} */
	let lastDenied = null;
	return onAuthStateChanged(auth, async (user) => {
		if (!user) {
			callback(lastDenied ?? { status: 'signed-out' });
			lastDenied = null;
			return;
		}
		callback({ status: 'checking' });
		if (await isAllowedUser(user)) {
			callback({ status: 'allowed', user });
			return;
		}
		// La solicitud se registra antes de cerrar la sesión: hace falta estar
		// autenticado para escribirla.
		lastDenied = { status: 'denied', request: await requestAccess(user) };
		signOut(auth).catch((error) =>
			console.error('firebase-client: fallo cerrando una sesión no autorizada', error),
		);
		callback(lastDenied);
	});
}

/**
 * @param {(user: import('firebase/auth').User | null) => void} callback
 * @returns {() => void} función para cancelar la suscripción
 */
export function onAuthChange(callback) {
	return onAccessChange((access) => {
		if (access.status === 'checking') return;
		callback(access.status === 'allowed' ? access.user : null);
	});
}
