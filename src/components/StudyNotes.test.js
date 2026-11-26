import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import StudyNotes from './StudyNotes.astro';

const notes = {
	tables: [
		{
			title: 'Tasas de alcohol',
			columns: ['Conductor', 'Sangre', 'Aire espirado'],
			rows: [['General', '0,5 g/l', '0,25 mg/l']],
			legalReferences: [{ norm: 'BOE-A-2003-23514', article: 'art. 20', asOfDate: new Date('2004-01-23') }],
		},
	],
	mnemonics: [{ rule: 'Aire = sangre ÷ 2', hint: '0,5 en sangre son 0,25 en aire.' }],
};

describe('StudyNotes', () => {
	it('pinta cada tabla con su cabecera, sus filas y la norma de la que sale', async () => {
		const container = await AstroContainer.create();
		const html = await container.renderToString(StudyNotes, { props: notes });
		expect(html).toContain('Para memorizar');
		expect(html).toMatch(/<caption[^>]*>Tasas de alcohol<\/caption>/);
		expect(html).toMatch(/<th scope="col"[^>]*>Aire espirado<\/th>/);
		expect(html).toMatch(/<th scope="row"[^>]*>General<\/th>/);
		expect(html).toContain('0,25 mg/l');
		expect(html).toContain('BOE-A-2003-23514 art. 20');
	});

	it('pinta la aclaración de la tabla si la tiene', async () => {
		const container = await AstroContainer.create();
		const tables = [{ ...notes.tables[0], note: 'Incluye a los ciclistas.' }];
		const html = await container.renderToString(StudyNotes, { props: { ...notes, tables } });
		expect(html).toContain('Incluye a los ciclistas.');
	});

	it('pinta las reglas para recordar', async () => {
		const container = await AstroContainer.create();
		const html = await container.renderToString(StudyNotes, { props: notes });
		expect(html).toContain('Aire = sangre ÷ 2');
		expect(html).toContain('0,5 en sangre son 0,25 en aire.');
	});

	it('no pinta la sección de reglas si el tema no tiene', async () => {
		const container = await AstroContainer.create();
		const html = await container.renderToString(StudyNotes, { props: { ...notes, mnemonics: [] } });
		expect(html).not.toContain('Reglas para recordarlo');
	});
});
