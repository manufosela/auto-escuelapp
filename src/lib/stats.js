// Agrega el historial de intentos en un resumen: últimos exámenes, racha de
// aptos y acierto por materia (Anexo V.B.1 del RD 818/2009).

/**
 * @param {import('./attempt.js').Attempt[]} attempts
 * @param {Map<string, number>} subjectByQuestionId id de pregunta -> materia (1-16)
 */
export function summarizeAttempts(attempts, subjectByQuestionId) {
	const sorted = [...attempts].sort(
		(a, b) => new Date(a.finishedAt) - new Date(b.finishedAt),
	);
	const exams = sorted.filter((attempt) => attempt.mode === 'exam');

	const lastExams = exams
		.slice(-10)
		.toReversed()
		.map((attempt) => ({ finishedAt: attempt.finishedAt, passed: attempt.passed }));

	let currentPassStreak = 0;
	for (let i = exams.length - 1; i >= 0; i--) {
		if (exams[i].passed) currentPassStreak += 1;
		else break;
	}

	const bySubject = new Map();
	for (const attempt of sorted) {
		for (const answer of attempt.answers) {
			const subject = subjectByQuestionId.get(answer.questionId);
			if (subject === undefined) continue; // la pregunta ya no existe en el banco
			const entry = bySubject.get(subject) ?? { subject, correct: 0, total: 0 };
			entry.total += 1;
			if (answer.correct) entry.correct += 1;
			bySubject.set(subject, entry);
		}
	}
	const accuracyBySubject = [...bySubject.values()]
		.map((entry) => ({ ...entry, ratio: entry.correct / entry.total }))
		.toSorted((a, b) => a.subject - b.subject);

	return {
		totalAttempts: attempts.length,
		lastExams,
		currentPassStreak,
		accuracyBySubject,
	};
}
