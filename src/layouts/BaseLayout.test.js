import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import BaseLayout from './BaseLayout.astro';

async function renderLayout() {
	const container = await AstroContainer.create();
	return container.renderToString(BaseLayout, {
		props: { title: 'Prueba', description: 'Prueba' },
		request: new Request('https://example.com/temario/'),
	});
}

describe('BaseLayout', () => {
	it('pone la navegación principal arriba, antes del contenido', async () => {
		const html = await renderLayout();
		const navIndex = html.indexOf('aria-label="Navegación principal"');
		expect(navIndex).toBeGreaterThan(-1);
		expect(navIndex).toBeLessThan(html.indexOf('<main'));
	});

	it('no deja ninguna barra de navegación fija abajo', async () => {
		const html = await renderLayout();
		expect(html).not.toContain('bottom-nav');
	});

	it('sirve el contenido y la navegación ocultos hasta confirmar el acceso', async () => {
		const html = await renderLayout();
		expect(html).toMatch(/<nav[^>]*data-requires-access[^>]*hidden|<nav[^>]*hidden[^>]*data-requires-access/);
		expect(html).toMatch(/<main[^>]*data-requires-access[^>]*hidden|<main[^>]*hidden[^>]*data-requires-access/);
		expect(html).toContain('<auth-gate');
	});

	it('marca la sección actual', async () => {
		const html = await renderLayout();
		expect(html).toMatch(/href="\/temario\/"[^>]*aria-current="page"/);
	});
});
