// Construye el resumen de un intento (examen o práctica) que se persiste en
// el historial. Solo guarda el id de cada pregunta y si se acertó, nunca su
// enunciado: el contenido ya vive en la colección pública de preguntas.

/**
 * @typedef {{ mode: 'exam'|'practice', topicId: string|null, startedAt: string, finishedAt: string, total: number, correct: number, failures: number, passed: boolean, answers: Array<{ questionId: string, correct: boolean }> }} Attempt
 */

/**
 * @param {{ mode: 'exam'|'practice', topicId?: string|null, startedAt: string|Date, results: Array<{ question: { id: string }, isCorrect: boolean }>, isPassing?: (failures: number) => boolean }} params
 * @returns {Attempt}
 */
export function buildAttempt({ mode, topicId = null, startedAt, results, isPassing }) {
	const answers = results.map((result) => ({
		questionId: result.question.id,
		correct: result.isCorrect,
	}));
	const correct = answers.filter((answer) => answer.correct).length;
	const failures = answers.length - correct;
	return {
		mode,
		topicId,
		startedAt: new Date(startedAt).toISOString(),
		finishedAt: new Date().toISOString(),
		total: answers.length,
		correct,
		failures,
		passed: isPassing ? isPassing(failures) : null,
		answers,
	};
}
