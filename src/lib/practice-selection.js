// Selección de preguntas para el modo práctica por tema: solo las vigentes
// que cubran alguna de las materias (subject, Anexo V.B.1) del tema elegido.
import { excludeHidden, filterValidQuestions, shuffle } from './exam-selection.js';

/**
 * @template {{ id: string, subject: number, validFrom: string|Date, validUntil?: string|Date }} T
 * @param {T[]} questions
 * @param {number[]} subjects
 * @param {number} count
 * @param {Date} atDate
 * @param {() => number} random
 * @param {Set<string>} hiddenIds preguntas reportadas por el usuario (AUT-TSK-0020)
 * @returns {T[]}
 */
export function selectTopicQuestions(
	questions,
	subjects,
	count,
	atDate,
	random = Math.random,
	hiddenIds = new Set(),
) {
	const subjectSet = new Set(subjects);
	const valid = excludeHidden(
		filterValidQuestions(questions, atDate).filter((q) => subjectSet.has(q.subject)),
		hiddenIds,
	);
	return shuffle(valid, random).slice(0, count);
}
