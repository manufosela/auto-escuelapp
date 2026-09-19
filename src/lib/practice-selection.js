// Selección de preguntas para el modo práctica por tema: solo las vigentes
// que cubran alguna de las materias (subject, Anexo V.B.1) del tema elegido.
import { filterValidQuestions, shuffle } from './exam-selection.js';

/**
 * @template {{ subject: number, validFrom: string|Date, validUntil?: string|Date }} T
 * @param {T[]} questions
 * @param {number[]} subjects
 * @param {number} count
 * @param {Date} atDate
 * @param {() => number} random
 * @returns {T[]}
 */
export function selectTopicQuestions(questions, subjects, count, atDate, random = Math.random) {
	const subjectSet = new Set(subjects);
	const valid = filterValidQuestions(questions, atDate).filter((q) => subjectSet.has(q.subject));
	return shuffle(valid, random).slice(0, count);
}
