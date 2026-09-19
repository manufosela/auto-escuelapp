import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getHiddenQuestionIds, hideQuestion } from './hidden-questions.js';

// El entorno de test es Node (sin DOM): se sustituye localStorage por un
// mock mínimo en memoria, suficiente para probar el módulo.
function createLocalStorageMock() {
	const store = new Map();
	return {
		getItem: (key) => (store.has(key) ? store.get(key) : null),
		setItem: (key, value) => store.set(key, String(value)),
		removeItem: (key) => store.delete(key),
		clear: () => store.clear(),
	};
}

beforeEach(() => {
	vi.stubGlobal('localStorage', createLocalStorageMock());
});

describe('hidden-questions', () => {
	it('empieza vacío', () => {
		expect(getHiddenQuestionIds()).toEqual(new Set());
	});

	it('oculta una pregunta y persiste entre llamadas', () => {
		hideQuestion('velocidad-autovia');
		expect(getHiddenQuestionIds()).toEqual(new Set(['velocidad-autovia']));
	});

	it('acumula varias preguntas ocultas sin duplicar', () => {
		hideQuestion('a');
		hideQuestion('b');
		hideQuestion('a');
		expect(getHiddenQuestionIds()).toEqual(new Set(['a', 'b']));
	});
});
