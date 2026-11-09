import { describe, expect, it } from 'vitest';
import { accessView, deniedMessage } from './access-view.js';

describe('deniedMessage', () => {
	it('avisa de que la solicitud está pendiente', () => {
		expect(deniedMessage('pending')).toContain('pendiente de aprobación');
	});

	it('avisa de que la solicitud fue rechazada', () => {
		expect(deniedMessage('rejected')).toContain('rechazada');
	});

	it('avisa de que no se pudo registrar la solicitud', () => {
		expect(deniedMessage('failed')).toContain('no se ha podido registrar');
	});
});

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
		expect(accessView({ status: 'denied', request: 'pending' })).toEqual({ showApp: false, screen: 'denied' });
	});

	it('muestra la espera mientras se comprueba o antes de saber nada', () => {
		expect(accessView({ status: 'checking' })).toEqual({ showApp: false, screen: 'checking' });
		expect(accessView(undefined)).toEqual({ showApp: false, screen: 'checking' });
	});
});
