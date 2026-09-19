import { describe, expect, it } from 'vitest';
import { hasBlockChanged, questionCitesBlock, versionKey } from './watch-boe.mjs';

describe('versionKey', () => {
	it('combina norma origen y fecha de vigencia', () => {
		expect(versionKey({ sourceNormId: 'BOE-A-2003-23514', effectiveDate: '2004-01-23' })).toBe(
			'BOE-A-2003-23514@2004-01-23',
		);
	});
});

describe('hasBlockChanged', () => {
	const V1 = { sourceNormId: 'BOE-A-2003-23514', effectiveDate: '2004-01-23' };
	const V2 = { sourceNormId: 'BOE-A-2006-15406', effectiveDate: '2006-09-06' };

	it('no detecta cambio si las versiones coinciden', () => {
		expect(hasBlockChanged({ versions: [V1, V2] }, { versions: [V1, V2] })).toBe(false);
	});

	it('detecta una versión nueva en la API que el contenido no tiene', () => {
		expect(hasBlockChanged({ versions: [V1] }, { versions: [V1, V2] })).toBe(true);
	});

	it('detecta una fecha de vigencia distinta en la misma posición', () => {
		const v2Distinta = { ...V2, effectiveDate: '2099-01-01' };
		expect(hasBlockChanged({ versions: [V1, V2] }, { versions: [V1, v2Distinta] })).toBe(true);
	});

	it('trata como sin versiones un bloque sin el campo `versions`', () => {
		expect(hasBlockChanged({}, {})).toBe(false);
	});
});

describe('questionCitesBlock', () => {
	it('reconoce una pregunta que cita el artículo exacto del bloque', () => {
		const question = { legalReference: { norm: 'BOE-A-2003-23514', article: 'art. 20' } };
		expect(questionCitesBlock(question, 'BOE-A-2003-23514', 'a20')).toBe(true);
	});

	it('reconoce una cita con apartado/letra (art. 48.1.e))', () => {
		const question = { legalReference: { norm: 'BOE-A-2003-23514', article: 'art. 48.1.e)' } };
		expect(questionCitesBlock(question, 'BOE-A-2003-23514', 'a48')).toBe(true);
	});

	it('no confunde artículos distintos de la misma norma', () => {
		const question = { legalReference: { norm: 'BOE-A-2003-23514', article: 'art. 20' } };
		expect(questionCitesBlock(question, 'BOE-A-2003-23514', 'a48')).toBe(false);
	});

	it('no confunde el mismo número de artículo de normas distintas', () => {
		const question = { legalReference: { norm: 'BOE-A-2009-9481', article: 'art. 20' } };
		expect(questionCitesBlock(question, 'BOE-A-2003-23514', 'a20')).toBe(false);
	});

	it('devuelve false si la pregunta no tiene legalReference', () => {
		expect(questionCitesBlock({}, 'BOE-A-2003-23514', 'a20')).toBe(false);
	});
});
