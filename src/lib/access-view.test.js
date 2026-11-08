import { describe, expect, it } from 'vitest';
import { accessView } from './access-view.js';

describe('accessView', () => {
	it('muestra la app solo con acceso permitido', () => {
		expect(accessView({ status: 'allowed', user: { uid: 'a' } })).toEqual({
			showApp: true,
			screen: null,
		});
	});

	it('muestra la pantalla de entrada sin sesión', () => {
		expect(accessView({ status: 'signed-out' })).toEqual({ showApp: false, screen: 'sign-in' });
	});

	it('muestra el aviso a una cuenta no autorizada', () => {
		expect(accessView({ status: 'denied' })).toEqual({ showApp: false, screen: 'denied' });
	});

	it('muestra la espera mientras se comprueba o antes de saber nada', () => {
		expect(accessView({ status: 'checking' })).toEqual({ showApp: false, screen: 'checking' });
		expect(accessView(undefined)).toEqual({ showApp: false, screen: 'checking' });
	});
});
