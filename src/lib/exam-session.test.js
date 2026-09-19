import { describe, expect, it } from 'vitest';
import {
	answerQuestion,
	correctExam,
	countUnanswered,
	createExamSession,
	goToQuestion,
	isAnswered,
} from './exam-session.js';

const QUESTIONS = [
	{ statement: '¿1?', options: ['a', 'b', 'c'], correctIndex: 0 },
	{ statement: '¿2?', options: ['a', 'b', 'c'], correctIndex: 1 },
	{ statement: '¿3?', options: ['a', 'b', 'c'], correctIndex: 2 },
];

describe('createExamSession', () => {
	it('empieza sin respuestas y en la primera pregunta', () => {
		const session = createExamSession(QUESTIONS, new Date('2026-09-19T10:00:00Z'));
		expect(session.answers).toEqual([null, null, null]);
		expect(session.currentIndex).toBe(0);
		expect(session.startedAt).toBe('2026-09-19T10:00:00.000Z');
	});
});

describe('answerQuestion', () => {
	it('registra la respuesta sin mutar la sesión original', () => {
		const session = createExamSession(QUESTIONS);
		const next = answerQuestion(session, 1, 2);
		expect(next.answers).toEqual([null, 2, null]);
		expect(session.answers).toEqual([null, null, null]);
	});

	it('permite cambiar una respuesta ya dada', () => {
		let session = createExamSession(QUESTIONS);
		session = answerQuestion(session, 0, 1);
		session = answerQuestion(session, 0, 2);
		expect(session.answers[0]).toBe(2);
	});

	it('rechaza un índice de pregunta fuera de rango', () => {
		const session = createExamSession(QUESTIONS);
		expect(() => answerQuestion(session, 99, 0)).toThrow(/fuera de rango/);
	});

	it('rechaza un índice de opción fuera de rango', () => {
		const session = createExamSession(QUESTIONS);
		expect(() => answerQuestion(session, 0, 5)).toThrow(/fuera de rango/);
	});
});

describe('goToQuestion / isAnswered / countUnanswered', () => {
	it('navega a la pregunta indicada', () => {
		const session = goToQuestion(createExamSession(QUESTIONS), 2);
		expect(session.currentIndex).toBe(2);
	});

	it('cuenta las preguntas sin responder', () => {
		let session = createExamSession(QUESTIONS);
		expect(countUnanswered(session)).toBe(3);
		session = answerQuestion(session, 0, 0);
		expect(countUnanswered(session)).toBe(2);
		expect(isAnswered(session, 0)).toBe(true);
		expect(isAnswered(session, 1)).toBe(false);
	});
});

describe('correctExam', () => {
	it('cuenta como fallo una pregunta en blanco', () => {
		const session = createExamSession(QUESTIONS);
		const { failures } = correctExam(session);
		expect(failures).toBe(3);
	});

	it('acierta solo las respuestas correctas', () => {
		let session = createExamSession(QUESTIONS);
		session = answerQuestion(session, 0, 0); // correcta
		session = answerQuestion(session, 1, 0); // incorrecta (correcta es 1)
		session = answerQuestion(session, 2, 2); // correcta
		const { results, failures } = correctExam(session);
		expect(failures).toBe(1);
		expect(results[0].isCorrect).toBe(true);
		expect(results[1].isCorrect).toBe(false);
		expect(results[2].isCorrect).toBe(true);
	});
});
