// Qué enseña la puerta de acceso (AUT-TSK-0032) según el estado que da
// onAccessChange. Sin estado todavía se trata como 'checking'.

/** @typedef {import('./firebase-client.js').Access} Access */

const SCREEN_BY_STATUS = {
	checking: 'checking',
	'signed-out': 'sign-in',
	denied: 'denied',
};

/**
 * @param {Access | undefined} access
 * @returns {{ showApp: boolean, screen: 'checking' | 'sign-in' | 'denied' | null }}
 */
export function accessView(access) {
	if (access?.status === 'allowed') return { showApp: true, screen: null };
	return { showApp: false, screen: SCREEN_BY_STATUS[access?.status ?? 'checking'] };
}
