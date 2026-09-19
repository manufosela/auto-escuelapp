import { describe, expect, it } from 'vitest';
import { selectTopicQuestions } from './practice-selection.js';

const NOW = new Date('2026-09-19');

function q(id, subject, validFrom = '2020-01-01') {
	return { id, subject, validFrom };
}

describe('selectTopicQuestions', () => {
	it('solo incluye preguntas de las materias pedidas', () => {
		const questions = [q('a', 1), q('b', 4), q('c', 5)];
		const selected = selectTopicQuestions(questions, [1, 5], 10, NOW, () => 0.1);
		expect(selected.map((x) => x.id).toSorted()).toEqual(['a', 'c']);
	});

	it('excluye preguntas no vigentes', () => {
		const questions = [q('a', 1, '2030-01-01'), q('b', 1, '2020-01-01')];
		const selected = selectTopicQuestions(questions, [1], 10, NOW, () => 0.1);
		expect(selected.map((x) => x.id)).toEqual(['b']);
	});

	it('limita al tamaño pedido', () => {
		const questions = Array.from({ length: 5 }, (_, i) => q(`q${i}`, 1));
		const selected = selectTopicQuestions(questions, [1], 3, NOW, () => 0.1);
		expect(selected).toHaveLength(3);
	});

	it('devuelve menos si no hay suficientes preguntas del tema', () => {
		const questions = [q('a', 1)];
		const selected = selectTopicQuestions(questions, [1], 10, NOW, () => 0.1);
		expect(selected).toHaveLength(1);
	});
});
