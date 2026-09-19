// Estado puro de una sesión de examen en curso: responder, navegar entre
// preguntas y corregir al finalizar. Sin dependencias del DOM ni de
// almacenamiento, para poder testear y serializar (localStorage) fácilmente.

/**
 * @typedef {{ statement: string, options: string[], correctIndex: number }} ExamQuestion
 * @typedef {{ questions: ExamQuestion[], answers: (number|null)[], currentIndex: number, startedAt: string }} ExamSession
 */

/**
 * @param {ExamQuestion[]} questions
 * @param {Date} startedAt
 * @returns {ExamSession}
 */
export function createExamSession(questions, startedAt = new Date()) {
	return {
		questions,
		answers: questions.map(() => null),
		currentIndex: 0,
		startedAt: startedAt.toISOString(),
	};
}

function assertQuestionIndex(session, index) {
	if (index < 0 || index >= session.questions.length) {
		throw new Error(`Índice de pregunta fuera de rango: ${index}`);
	}
}

/**
 * @param {ExamSession} session
 * @param {number} index
 * @param {number} optionIndex
 * @returns {ExamSession} nueva sesión con la respuesta registrada
 */
export function answerQuestion(session, index, optionIndex) {
	assertQuestionIndex(session, index);
	if (optionIndex < 0 || optionIndex > 2) {
		throw new Error(`Índice de opción fuera de rango: ${optionIndex}`);
	}
	const answers = [...session.answers];
	answers[index] = optionIndex;
	return { ...session, answers };
}

/**
 * @param {ExamSession} session
 * @param {number} index
 * @returns {ExamSession}
 */
export function goToQuestion(session, index) {
	assertQuestionIndex(session, index);
	return { ...session, currentIndex: index };
}

/** @param {ExamSession} session @param {number} index */
export function isAnswered(session, index) {
	return session.answers[index] !== null;
}

/** @param {ExamSession} session */
export function countUnanswered(session) {
	return session.answers.filter((answer) => answer === null).length;
}

/**
 * Corrige la sesión: una pregunta en blanco cuenta como fallo, igual que en
 * el examen real (Anexo VI.B.3 del RD 818/2009).
 * @param {ExamSession} session
 * @returns {{ results: Array<{ question: ExamQuestion, givenIndex: number|null, isCorrect: boolean }>, failures: number }}
 */
export function correctExam(session) {
	const results = session.questions.map((question, index) => {
		const givenIndex = session.answers[index];
		return { question, givenIndex, isCorrect: givenIndex === question.correctIndex };
	});
	const failures = results.filter((result) => !result.isCorrect).length;
	return { results, failures };
}
