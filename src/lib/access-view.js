// Qué enseña la puerta de acceso (AUT-TSK-0032) según el estado que da
// onAccessChange. Sin estado todavía se trata como 'checking'.

/** @typedef {import('./firebase-client.js').Access} Access */

const SCREEN_BY_STATUS = {
	checking: 'checking',
	'signed-out': 'sign-in',
	denied: 'denied',
};

const DENIED_MESSAGES = {
	pending: 'Esta cuenta aún no tiene acceso. Tu solicitud está pendiente de aprobación.',
	rejected: 'Esta cuenta no tiene acceso: la solicitud fue rechazada.',
	failed: 'Esta cuenta no tiene acceso y no se ha podido registrar la solicitud. Inténtalo más tarde.',
};

/**
 * Aviso para una cuenta sin acceso según el estado de su solicitud
 * (AUT-TSK-0035).
 * @param {'pending' | 'rejected' | 'failed'} request
 * @returns {string}
 */
export function deniedMessage(request) {
	return DENIED_MESSAGES[request];
}

/**
 * @param {Access | undefined} access
 * @returns {{ showApp: boolean, screen: 'checking' | 'sign-in' | 'denied' | null }}
 */
export function accessView(access) {
	if (access?.status === 'allowed') return { showApp: true, screen: null };
	return { showApp: false, screen: SCREEN_BY_STATUS[access?.status ?? 'checking'] };
}
