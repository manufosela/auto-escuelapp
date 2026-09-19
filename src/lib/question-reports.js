// Reportar una pregunta defectuosa: se oculta siempre en este dispositivo
// (con o sin sesión) y, si hay sesión, se guarda en Firestore para revisión.
// Sin sesión, el reporte en Firestore no tendría a quién atribuirse, así que
// se ofrece en su lugar un enlace a un issue de GitHub prerrellenado.
//
// firebase/firestore se importa con import() dinámico: se reporta como
// mucho una vez por sesión de práctica/examen, así que no debe entrar en el
// chunk inicial de cada página (AUT-TSK-0025, mismo motivo que history-store.js).
import { auth } from './firebase-client.js';
import { hideQuestion } from './hidden-questions.js';

const REASON_LABELS = {
	wrong_answer: 'La respuesta marcada como correcta no lo es',
	unclear: 'El enunciado es confuso o ambiguo',
	outdated: 'La normativa ha cambiado',
	other: 'Otro motivo',
};

/**
 * @param {string} questionId
 * @param {'wrong_answer'|'unclear'|'outdated'|'other'} reason
 * @param {string} [statement] enunciado de la pregunta, para el título del issue
 * @returns {string}
 */
export function buildGithubIssueUrl(questionId, reason, statement = '') {
	const title = `Pregunta defectuosa: ${questionId}`;
	const body = [
		`**Pregunta:** ${statement || questionId}`,
		`**Motivo:** ${REASON_LABELS[reason] ?? reason}`,
	].join('\n\n');
	const params = new URLSearchParams({ title, body, labels: 'pregunta-defectuosa' });
	return `https://github.com/manufosela/auto-escuelapp/issues/new?${params}`;
}

/**
 * @param {string} questionId
 * @param {'wrong_answer'|'unclear'|'outdated'|'other'} reason
 * @param {string} [statement]
 * @returns {Promise<{ savedToFirestore: boolean, githubIssueUrl: string|null }>}
 */
export async function reportQuestion(questionId, reason, statement = '') {
	hideQuestion(questionId);
	const user = auth.currentUser;
	if (!user) {
		// sin sesión: no hay a quién atribuir el reporte en Firestore
		return { savedToFirestore: false, githubIssueUrl: buildGithubIssueUrl(questionId, reason, statement) };
	}
	const { addDoc, collection, getFirestore } = await import('firebase/firestore');
	await addDoc(collection(getFirestore(), 'users', user.uid, 'questionReports'), {
		questionId,
		reason,
		createdAt: new Date().toISOString(),
	});
	return { savedToFirestore: true, githubIssueUrl: null };
}
