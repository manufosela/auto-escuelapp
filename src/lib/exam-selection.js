// Selección de preguntas para un examen, según el Anexo VI.B del RD
// 818/2009: 30 preguntas para el permiso B (ver EXAM_RULES en exam-rules.js).

/**
 * @typedef {{ validFrom: Date, validUntil?: Date }} SelectableQuestion
 */

/**
 * Filtra las preguntas vigentes en una fecha dada.
 * @template {SelectableQuestion} T
 * @param {T[]} questions
 * @param {Date} atDate
 * @returns {T[]}
 */
export function filterValidQuestions(questions, atDate) {
	// new Date(x) admite tanto un Date como un ISO string (p. ej. tras pasar
	// por JSON, tal como llega desde una página Astro con define:vars).
	return questions.filter(
		(q) =>
			new Date(q.validFrom) <= atDate &&
			(!q.validUntil || new Date(q.validUntil) >= atDate),
	);
}

/**
 * Excluye las preguntas reportadas/ocultas por el usuario (AUT-TSK-0020).
 * @template {{ id: string }} T
 * @param {T[]} questions
 * @param {Set<string>} hiddenIds
 * @returns {T[]}
 */
export function excludeHidden(questions, hiddenIds) {
	if (hiddenIds.size === 0) return questions;
	return questions.filter((q) => !hiddenIds.has(q.id));
}

/**
 * Baraja un array sin mutar el original (Fisher-Yates).
 * @template T
 * @param {T[]} items
 * @param {() => number} random
 * @returns {T[]}
 */
export function shuffle(items, random = Math.random) {
	const result = [...items];
	for (let i = result.length - 1; i > 0; i--) {
		const j = Math.floor(random() * (i + 1));
		[result[i], result[j]] = [result[j], result[i]];
	}
	return result;
}

/**
 * Selecciona hasta `count` preguntas vigentes al azar, sin repetir. Si el
 * banco tiene menos preguntas vigentes que `count`, devuelve todas las que
 * haya (nunca inventa ni repite para rellenar).
 * @template {SelectableQuestion} T
 * @param {T[]} questions
 * @param {number} count
 * @param {Date} atDate
 * @param {() => number} random
 * @param {Set<string>} hiddenIds preguntas reportadas por el usuario (AUT-TSK-0020)
 * @returns {T[]}
 */
export function selectExamQuestions(
	questions,
	count,
	atDate,
	random = Math.random,
	hiddenIds = new Set(),
) {
	const valid = excludeHidden(filterValidQuestions(questions, atDate), hiddenIds);
	return shuffle(valid, random).slice(0, count);
}
