import { describe, expect, it } from 'vitest';
import { resolveEffectiveVersion } from './legal-version.js';

// Datos reales del art. 48 del Reglamento General de Circulación
// (BOE-A-2003-23514), obtenidos de la API del BOE el 2026-09-18. La última
// versión es el RD 518/2026, vigente desde el 01/10/2026.
const ART_48_VERSIONS = [
	{ sourceNormId: 'BOE-A-2003-23514', publicationDate: '2003-12-23', effectiveDate: '2004-01-23', paragraphs: [] },
	{ sourceNormId: 'BOE-A-2006-15406', publicationDate: '2006-09-05', effectiveDate: '2006-09-06', paragraphs: [] },
	{ sourceNormId: 'BOE-A-2018-18002', publicationDate: '2018-12-29', effectiveDate: '2019-01-29', paragraphs: [] },
	{ sourceNormId: 'BOE-A-2026-13889', publicationDate: '2026-06-26', effectiveDate: '2026-10-01', paragraphs: [] },
];

describe('resolveEffectiveVersion', () => {
	it('devuelve la versión de 2018 justo antes de que entre en vigor el RD 518/2026', () => {
		const version = resolveEffectiveVersion(ART_48_VERSIONS, new Date('2026-09-30'));
		expect(version.sourceNormId).toBe('BOE-A-2018-18002');
	});

	it('devuelve la versión del RD 518/2026 el día en que entra en vigor', () => {
		const version = resolveEffectiveVersion(ART_48_VERSIONS, new Date('2026-10-01'));
		expect(version.sourceNormId).toBe('BOE-A-2026-13889');
	});

	it('devuelve la versión del RD 518/2026 mucho después de su entrada en vigor', () => {
		const version = resolveEffectiveVersion(ART_48_VERSIONS, new Date('2030-01-01'));
		expect(version.sourceNormId).toBe('BOE-A-2026-13889');
	});

	it('devuelve la versión original en su primer día de vigencia', () => {
		const version = resolveEffectiveVersion(ART_48_VERSIONS, new Date('2004-01-23'));
		expect(version.sourceNormId).toBe('BOE-A-2003-23514');
	});

	it('no devuelve ninguna versión antes de que exista la norma', () => {
		const version = resolveEffectiveVersion(ART_48_VERSIONS, new Date('2000-01-01'));
		expect(version).toBeUndefined();
	});
});
