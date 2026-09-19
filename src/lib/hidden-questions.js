// Preguntas ocultas para este usuario/dispositivo: cuando alguien reporta
// una pregunta, deja de salirle en exámenes y prácticas de inmediato, sin
// esperar a que nadie revise el reporte.
const STORAGE_KEY = 'auto-escuelapp:hidden-questions:v1';

/** @returns {Set<string>} */
export function getHiddenQuestionIds() {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return new Set(raw ? JSON.parse(raw) : []);
	} catch {
		return new Set();
	}
}

/** @param {string} questionId */
export function hideQuestion(questionId) {
	const hidden = getHiddenQuestionIds();
	hidden.add(questionId);
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify([...hidden]));
	} catch {
		// almacenamiento no disponible: la pregunta puede volver a salir
		// tras recargar, pero el reporte en Firestore (si hay sesión) queda.
	}
}
