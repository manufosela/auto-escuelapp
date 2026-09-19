import { describe, expect, it } from 'vitest';
import { buildReviewQueue } from './review-queue.js';

function attempt(finishedAt, answers) {
	return {
		mode: 'practice',
		topicId: null,
		startedAt: finishedAt,
		finishedAt,
		total: answers.length,
		correct: answers.filter((a) => a.correct).length,
		failures: answers.filter((a) => !a.correct).length,
		passed: null,
		answers,
	};
}

describe('buildReviewQueue', () => {
	it('no incluye preguntas que nunca se han fallado', () => {
		const queue = buildReviewQueue([
			attempt('2026-09-01T00:00:00Z', [{ questionId: 'a', correct: true }]),
		]);
		expect(queue).toEqual([]);
	});

	it('incluye una pregunta fallada al menos una vez', () => {
		const queue = buildReviewQueue([
			attempt('2026-09-01T00:00:00Z', [{ questionId: 'a', correct: false }]),
		]);
		expect(queue.map((q) => q.questionId)).toEqual(['a']);
	});

	it('prioriza por número de fallos, de más a menos', () => {
		const queue = buildReviewQueue([
			attempt('2026-09-01T00:00:00Z', [
				{ questionId: 'poco-fallada', correct: false },
				{ questionId: 'muy-fallada', correct: false },
			]),
			attempt('2026-09-02T00:00:00Z', [{ questionId: 'muy-fallada', correct: false }]),
		]);
		expect(queue.map((q) => q.questionId)).toEqual(['muy-fallada', 'poco-fallada']);
	});

	it('a igualdad de fallos, prioriza el fallo más reciente', () => {
		const queue = buildReviewQueue([
			attempt('2026-09-01T00:00:00Z', [{ questionId: 'antigua', correct: false }]),
			attempt('2026-09-05T00:00:00Z', [{ questionId: 'reciente', correct: false }]),
		]);
		expect(queue.map((q) => q.questionId)).toEqual(['reciente', 'antigua']);
	});

	it('saca de la cola una pregunta acertada 3 veces seguidas', () => {
		const queue = buildReviewQueue([
			attempt('2026-09-01T00:00:00Z', [{ questionId: 'a', correct: false }]),
			attempt('2026-09-02T00:00:00Z', [{ questionId: 'a', correct: true }]),
			attempt('2026-09-03T00:00:00Z', [{ questionId: 'a', correct: true }]),
			attempt('2026-09-04T00:00:00Z', [{ questionId: 'a', correct: true }]),
		]);
		expect(queue).toEqual([]);
	});

	it('sigue en la cola si solo hay 2 aciertos seguidos tras el fallo', () => {
		const queue = buildReviewQueue([
			attempt('2026-09-01T00:00:00Z', [{ questionId: 'a', correct: false }]),
			attempt('2026-09-02T00:00:00Z', [{ questionId: 'a', correct: true }]),
			attempt('2026-09-03T00:00:00Z', [{ questionId: 'a', correct: true }]),
		]);
		expect(queue.map((q) => q.questionId)).toEqual(['a']);
	});

	it('vuelve a entrar en la cola si falla después de una racha de aciertos', () => {
		const queue = buildReviewQueue([
			attempt('2026-09-01T00:00:00Z', [{ questionId: 'a', correct: false }]),
			attempt('2026-09-02T00:00:00Z', [{ questionId: 'a', correct: true }]),
			attempt('2026-09-03T00:00:00Z', [{ questionId: 'a', correct: true }]),
			attempt('2026-09-04T00:00:00Z', [{ questionId: 'a', correct: true }]),
			attempt('2026-09-05T00:00:00Z', [{ questionId: 'a', correct: false }]),
		]);
		expect(queue.map((q) => q.questionId)).toEqual(['a']);
	});
});
