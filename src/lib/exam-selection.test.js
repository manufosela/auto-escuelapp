import { describe, expect, it } from 'vitest';
import { filterValidQuestions, selectExamQuestions, shuffle } from './exam-selection.js';

const NOW = new Date('2026-09-19');

function q(id, validFrom, validUntil) {
	return { id, validFrom: new Date(validFrom), validUntil: validUntil ? new Date(validUntil) : undefined };
}

describe('filterValidQuestions', () => {
	it('excluye preguntas que aún no son válidas', () => {
		const questions = [q('a', '2026-01-01'), q('b', '2027-01-01')];
		expect(filterValidQuestions(questions, NOW).map((x) => x.id)).toEqual(['a']);
	});

	it('excluye preguntas caducadas', () => {
		const questions = [q('a', '2020-01-01', '2021-01-01'), q('b', '2020-01-01')];
		expect(filterValidQuestions(questions, NOW).map((x) => x.id)).toEqual(['b']);
	});
});

describe('shuffle', () => {
	it('conserva todos los elementos', () => {
		const items = [1, 2, 3, 4, 5];
		const result = shuffle(items, () => 0.5);
		expect(result.toSorted()).toEqual(items);
	});

	it('no muta el array original', () => {
		const items = [1, 2, 3];
		shuffle(items, () => 0.9);
		expect(items).toEqual([1, 2, 3]);
	});

	it('es determinista con un generador fijo', () => {
		const items = [1, 2, 3, 4];
		expect(shuffle(items, () => 0)).toEqual(shuffle(items, () => 0));
	});
});

describe('selectExamQuestions', () => {
	it('nunca supera el número de preguntas vigentes disponibles', () => {
		const questions = [q('a', '2020-01-01'), q('b', '2020-01-01')];
		const selected = selectExamQuestions(questions, 30, NOW, () => 0.1);
		expect(selected).toHaveLength(2);
	});

	it('limita al count pedido cuando hay suficientes preguntas', () => {
		const questions = Array.from({ length: 40 }, (_, i) => q(`q${i}`, '2020-01-01'));
		const selected = selectExamQuestions(questions, 30, NOW, () => 0.1);
		expect(selected).toHaveLength(30);
	});

	it('no incluye preguntas no vigentes', () => {
		const questions = [q('vieja', '2020-01-01', '2021-01-01'), q('vigente', '2020-01-01')];
		const selected = selectExamQuestions(questions, 30, NOW, () => 0.1);
		expect(selected.map((x) => x.id)).toEqual(['vigente']);
	});
});
