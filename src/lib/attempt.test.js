import { describe, expect, it } from 'vitest';
import { buildAttempt } from './attempt.js';

function result(id, isCorrect) {
	return { question: { id }, isCorrect };
}

describe('buildAttempt', () => {
	it('cuenta aciertos y fallos a partir de los resultados', () => {
		const attempt = buildAttempt({
			mode: 'exam',
			startedAt: '2026-09-19T10:00:00Z',
			results: [result('a', true), result('b', false), result('c', true)],
			isPassing: (failures) => failures <= 3,
		});
		expect(attempt.total).toBe(3);
		expect(attempt.correct).toBe(2);
		expect(attempt.failures).toBe(1);
		expect(attempt.passed).toBe(true);
	});

	it('solo guarda el id de cada pregunta y si se acertó, nunca el enunciado', () => {
		const attempt = buildAttempt({
			mode: 'exam',
			startedAt: '2026-09-19T10:00:00Z',
			results: [result('velocidad-autovia', true)],
			isPassing: () => true,
		});
		expect(attempt.answers).toEqual([{ questionId: 'velocidad-autovia', correct: true }]);
	});

	it('no calcula passed en modo práctica si no se pasa isPassing', () => {
		const attempt = buildAttempt({
			mode: 'practice',
			topicId: 'velocidad-y-distancias',
			startedAt: '2026-09-19T10:00:00Z',
			results: [result('a', false)],
		});
		expect(attempt.passed).toBeNull();
		expect(attempt.topicId).toBe('velocidad-y-distancias');
	});

	it('registra startedAt y finishedAt en ISO', () => {
		const attempt = buildAttempt({
			mode: 'exam',
			startedAt: '2026-09-19T10:00:00Z',
			results: [],
			isPassing: () => true,
		});
		expect(attempt.startedAt).toBe('2026-09-19T10:00:00.000Z');
		expect(() => new Date(attempt.finishedAt).toISOString()).not.toThrow();
	});
});
