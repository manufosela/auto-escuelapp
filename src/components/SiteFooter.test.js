import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import SiteFooter from './SiteFooter.astro';

describe('SiteFooter', () => {
	it('mantiene el aviso de no afiliación sin enlazar al código ni a las licencias', async () => {
		const container = await AstroContainer.create();
		const html = await container.renderToString(SiteFooter);
		expect(html).toContain('Proyecto no oficial');
		expect(html).not.toContain('<a');
	});
});
