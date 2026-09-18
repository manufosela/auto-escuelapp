import { describe, expect, it } from 'vitest';
import { stripHtml } from './fetch-signs.mjs';

describe('stripHtml', () => {
	it('extrae el nombre de un enlace de autor de Commons', () => {
		expect(
			stripHtml(
				'<a href="//commons.wikimedia.org/wiki/User:Benedicto16" class="mw-redirect" title="User:Benedicto16">Benedicto16</a>',
			),
		).toBe('Benedicto16');
	});

	it('quita el span oculto de texto espejo sin duplicar el contenido', () => {
		// Formato real de Commons para autor desconocido (extmetadata.Artist
		// del fichero "Spain traffic signal r1.svg").
		expect(
			stripHtml('Unknown author<span style="display: none;">Unknown author</span>'),
		).toBe('Unknown author');
	});

	it('devuelve texto plano sin cambios', () => {
		expect(stripHtml('Ministerio de Transportes, Movilidad y Agenda Urbana')).toBe(
			'Ministerio de Transportes, Movilidad y Agenda Urbana',
		);
	});
});
