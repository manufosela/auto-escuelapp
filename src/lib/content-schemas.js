// Esquemas de contenido compartidos entre src/content.config.js y los tests
// que validan los ficheros de contenido.
import { z } from 'astro/zod';

export const LEGAL_REFERENCE = z.object({
	// ID de norma tal como lo expone la API de datos abiertos del BOE,
	// p. ej. "BOE-A-2009-9481".
	norm: z.string().regex(/^BOE-[AB]-\d{4}-\d+$/),
	article: z.string().min(1),
	// Fecha (YYYY-MM-DD) de la versión del bloque citada, para poder
	// detectar cuando una norma cambia y la cita queda desactualizada.
	asOfDate: z.coerce.date(),
});

// Bloque «Para memorizar» de un tema (AUT-TSK-0041): tablas de valores, cada
// una con la norma de la que salen, y reglas nemotécnicas para recordarlos.
// El fichero se llama como el tema (src/content/study-notes/<tema>.json).
const STUDY_TABLE = z
	.object({
		title: z.string().min(1),
		columns: z.array(z.string().min(1)).min(2),
		rows: z.array(z.array(z.string().min(1))).min(1),
		// Aclaración bajo la tabla, p. ej. qué vehículos entran en cada columna.
		note: z.string().min(1).optional(),
		legalReferences: z.array(LEGAL_REFERENCE).min(1),
	})
	.refine((table) => table.rows.every((row) => row.length === table.columns.length), {
		message: 'Cada fila debe tener tantas celdas como columnas',
	});

export const STUDY_NOTES = z.object({
	tables: z.array(STUDY_TABLE).default([]),
	mnemonics: z
		.array(
			z.object({
				rule: z.string().min(1),
				hint: z.string().min(1),
			}),
		)
		.default([]),
});
