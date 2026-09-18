// Resuelve qué versión de un bloque normativo (ver colección `legal`) está
// vigente en una fecha dada. El BOE publica versiones futuras ya aprobadas
// (p. ej. un Real Decreto en vigor a partir de una fecha posterior), así que
// "la última del array" no es lo mismo que "la vigente hoy".

/**
 * Devuelve la versión vigente en `atDate`: la de `effectiveDate` más
 * reciente que no sea posterior a `atDate`. Genérica en `T` para conservar
 * el tipo concreto de cada versión (p. ej. con `paragraphs` tipados), tanto
 * si `effectiveDate` llega como string (JSON crudo) o como Date (tras el
 * `z.coerce.date()` de la colección de contenido).
 * @template {{ effectiveDate: string | Date }} T
 * @param {T[]} versions
 * @param {Date} atDate
 * @returns {T | undefined} undefined si ninguna versión ha entrado aún en
 *   vigor en esa fecha.
 */
export function resolveEffectiveVersion(versions, atDate) {
	const applicable = versions
		.filter((version) => new Date(version.effectiveDate) <= atDate)
		.toSorted((a, b) => new Date(b.effectiveDate) - new Date(a.effectiveDate));
	return applicable[0];
}
