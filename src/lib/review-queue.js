// Cola de repaso priorizado, derivada del historial de intentos (sin
// estado propio que mantener sincronizado). Una pregunta sale de la cola
// cuando sus últimas 3 apariciones consecutivas fueron correctas; mientras
// tanto se prioriza por número de fallos y por la fecha del último fallo.

/**
 * @param {import('./attempt.js').Attempt[]} attempts
 * @returns {Array<{ questionId: string, failCount: number, lastFailedAt: string }>}
 *   ordenado de mayor a menor prioridad de repaso
 */
export function buildReviewQueue(attempts) {
	const records = attempts
		.flatMap((attempt) =>
			attempt.answers.map((answer) => ({ ...answer, at: attempt.finishedAt })),
		)
		.toSorted((a, b) => new Date(a.at) - new Date(b.at));

	const byQuestion = new Map();
	for (const record of records) {
		const list = byQuestion.get(record.questionId) ?? [];
		list.push(record);
		byQuestion.set(record.questionId, list);
	}

	const queue = [];
	for (const [questionId, questionRecords] of byQuestion) {
		const failCount = questionRecords.filter((r) => !r.correct).length;
		if (failCount === 0) continue; // nunca fallada: no es candidata a repaso

		const lastThree = questionRecords.slice(-3);
		const masteredInReview = lastThree.length === 3 && lastThree.every((r) => r.correct);
		if (masteredInReview) continue;

		const lastFailed = [...questionRecords].toReversed().find((r) => !r.correct);
		queue.push({ questionId, failCount, lastFailedAt: lastFailed.at });
	}

	return queue.toSorted((a, b) => {
		if (b.failCount !== a.failCount) return b.failCount - a.failCount;
		return new Date(b.lastFailedAt) - new Date(a.lastFailedAt);
	});
}
