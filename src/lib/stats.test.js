import { describe, expect, it } from 'vitest';
import { summarizeAttempts } from './stats.js';

function attempt(overrides = {}) {
	return {
		mode: 'exam',
		topicId: null,
		startedAt: '2026-09-19T09:00:00.000Z',
		finishedAt: '2026-09-19T09:30:00.000Z',
		total: 0,
		correct: 0,
		failures: 0,
		passed: null,
		answers: [],
		...overrides,
	};
}

const SUBJECTS = new Map([
	['velocidad-urbana', 1],
	['velocidad-autovia', 1],
	['alcohol-general', 4],
]);

describe('summarizeAttempts', () => {
	it('sin intentos devuelve un resumen vacío', () => {
		const summary = summarizeAttempts([], SUBJECTS);
		expect(summary.totalAttempts).toBe(0);
		expect(summary.lastExams).toEqual([]);
		expect(summary.currentPassStreak).toBe(0);
		expect(summary.accuracyBySubject).toEqual([]);
	});

	it('agrega el acierto por materia cruzando el id de pregunta', () => {
		const summary = summarizeAttempts(
			[
				attempt({
					answers: [
						{ questionId: 'velocidad-urbana', correct: true },
						{ questionId: 'alcohol-general', correct: false },
					],
				}),
			],
			SUBJECTS,
		);
		expect(summary.accuracyBySubject).toEqual([
			{ subject: 1, correct: 1, total: 1, ratio: 1 },
			{ subject: 4, correct: 0, total: 1, ratio: 0 },
		]);
	});

	it('ignora preguntas que ya no existen en el banco', () => {
		const summary = summarizeAttempts(
			[attempt({ answers: [{ questionId: 'borrada', correct: true }] })],
			SUBJECTS,
		);
		expect(summary.accuracyBySubject).toEqual([]);
	});

	it('calcula la racha de aptos consecutivos desde el examen más reciente', () => {
		const summary = summarizeAttempts(
			[
				attempt({ finishedAt: '2026-09-01T00:00:00Z', passed: false }),
				attempt({ finishedAt: '2026-09-02T00:00:00Z', passed: true }),
				attempt({ finishedAt: '2026-09-03T00:00:00Z', passed: true }),
			],
			SUBJECTS,
		);
		expect(summary.currentPassStreak).toBe(2);
	});

	it('la racha se corta en el primer suspenso mirando hacia atrás', () => {
		const summary = summarizeAttempts(
			[
				attempt({ finishedAt: '2026-09-01T00:00:00Z', passed: true }),
				attempt({ finishedAt: '2026-09-02T00:00:00Z', passed: false }),
				attempt({ finishedAt: '2026-09-03T00:00:00Z', passed: true }),
			],
			SUBJECTS,
		);
		expect(summary.currentPassStreak).toBe(1);
	});

	it('no cuenta los intentos de práctica para la racha ni los últimos exámenes', () => {
		const summary = summarizeAttempts(
			[attempt({ mode: 'practice', passed: null, finishedAt: '2026-09-01T00:00:00Z' })],
			SUBJECTS,
		);
		expect(summary.lastExams).toEqual([]);
		expect(summary.currentPassStreak).toBe(0);
	});

	it('devuelve los últimos exámenes en orden del más reciente al más antiguo', () => {
		const summary = summarizeAttempts(
			[
				attempt({ finishedAt: '2026-09-01T00:00:00Z', passed: true }),
				attempt({ finishedAt: '2026-09-03T00:00:00Z', passed: false }),
				attempt({ finishedAt: '2026-09-02T00:00:00Z', passed: true }),
			],
			SUBJECTS,
		);
		expect(summary.lastExams.map((e) => e.finishedAt)).toEqual([
			'2026-09-03T00:00:00Z',
			'2026-09-02T00:00:00Z',
			'2026-09-01T00:00:00Z',
		]);
	});
});
