// Cliente de Firebase (Auth). La config de abajo es la config pública de la
// app web (apiKey incluida): no es un secreto, está pensada para ir en el
// cliente y protegida por las reglas de seguridad de Firebase, no por
// mantenerla oculta. Nunca añadir aquí una clave de servicio (Admin SDK).
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
	projectId: 'auto-escuelapp',
	appId: '1:74657355837:web:554f6da7ecdeb68d19f254',
	storageBucket: 'auto-escuelapp.firebasestorage.app',
	apiKey: 'AIzaSyBocWdqpQWyeMwY6NAQhH3d6c1RSwilWQA',
	authDomain: 'auto-escuelapp.firebaseapp.com',
	messagingSenderId: '74657355837',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

/**
 * Uso personal (AUT-TSK-0010): solo la cuenta permitida en firestore.rules
 * puede quedar autenticada en la app. La autorización real vive ahí -no
 * aquí- para no enviar el email al bundle público; esta lectura de sondeo
 * solo detecta el permission-denied para poder cerrar la sesión al momento.
 * @param {import('firebase/auth').User} user
 * @returns {Promise<boolean>}
 */
async function hasFirestoreAccess(user) {
	const { doc, getDoc, getFirestore } = await import('firebase/firestore');
	try {
		await getDoc(doc(getFirestore(), 'users', user.uid, 'attempts', '__auth_probe__'));
		return true;
	} catch (error) {
		if (error?.code === 'permission-denied') return false;
		throw error;
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
 * @param {(user: import('firebase/auth').User | null) => void} callback
 * @returns {() => void} función para cancelar la suscripción
 */
export function onAuthChange(callback) {
	return onAuthStateChanged(auth, async (user) => {
		if (!user) {
			callback(null);
			return;
		}
		const allowed = await hasFirestoreAccess(user);
		if (!allowed) {
			signOut(auth).catch((error) =>
				console.error('firebase-client: fallo cerrando una sesión no autorizada', error),
			);
			callback(null);
			return;
		}
		callback(user);
	});
}
