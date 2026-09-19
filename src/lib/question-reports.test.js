import { describe, expect, it } from 'vitest';
import { buildGithubIssueUrl } from './question-reports.js';

describe('buildGithubIssueUrl', () => {
	it('incluye el id de la pregunta y el motivo en el título y el cuerpo', () => {
		const url = buildGithubIssueUrl('velocidad-autovia', 'wrong_answer', '¿Cuál es la velocidad máxima?');
		expect(url).toContain('https://github.com/manufosela/auto-escuelapp/issues/new?');
		expect(url).toContain(encodeURIComponent('velocidad-autovia'));
		expect(url).toContain('labels=pregunta-defectuosa');
		const params = new URL(url).searchParams;
		expect(params.get('title')).toBe('Pregunta defectuosa: velocidad-autovia');
		expect(params.get('body')).toContain('¿Cuál es la velocidad máxima?');
		expect(params.get('body')).toContain('La respuesta marcada como correcta no lo es');
	});

	it('usa el id como enunciado si no se pasa uno', () => {
		const url = buildGithubIssueUrl('q1', 'other');
		const params = new URL(url).searchParams;
		expect(params.get('body')).toContain('q1');
	});
});
