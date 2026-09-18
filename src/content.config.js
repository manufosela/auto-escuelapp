// Colecciones de contenido de estudio (temario, preguntas, señales).
// Ver docs/SOURCES.md para la trazabilidad fuente-por-fichero y
// CONTENT-LICENSE.md para las condiciones de reutilización de cada fuente.
import { file, glob } from 'astro/loaders';
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';

// Las 16 materias del Anexo V.B.1 del RD 818/2009 (Reglamento General de
// Conductores). Ver docs/research/formato-examen-y-preguntas.md.
const SUBJECT = z.number().int().min(1).max(16);

const LEGAL_REFERENCE = z.object({
	// ID de norma tal como lo expone la API de datos abiertos del BOE,
	// p. ej. "BOE-A-2009-9481".
	norm: z.string().regex(/^BOE-[AB]-\d{4}-\d+$/),
	article: z.string().min(1),
	// Fecha (YYYY-MM-DD) de la versión del bloque citada, para poder
	// detectar cuando una norma cambia y la cita queda desactualizada.
	asOfDate: z.coerce.date(),
});

const topics = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/topics' }),
	schema: z.object({
		title: z.string().min(1),
		// Materias del Anexo V.B.1 que cubre este tema (al menos una).
		subjects: z.array(SUBJECT).min(1),
		summary: z.string().min(1),
		keyPoints: z.array(z.string().min(1)).min(1),
		legalReferences: z.array(LEGAL_REFERENCE).min(1),
		order: z.number().int().min(1),
	}),
});

const questions = defineCollection({
	loader: glob({ pattern: '**/*.json', base: './src/content/questions' }),
	schema: z.object({
		statement: z.string().min(1),
		// Exactamente 3 opciones, como en el examen real.
		options: z.array(z.string().min(1)).length(3),
		// Índice (0-2) de la opción correcta dentro de `options`.
		correctIndex: z.number().int().min(0).max(2),
		explanation: z.string().min(1),
		subject: SUBJECT,
		legalReference: LEGAL_REFERENCE,
		licence: z.enum(['B']).default('B'),
		source: z.discriminatedUnion('type', [
			z.object({ type: z.literal('own') }),
			z.object({
				type: z.literal('revista-dgt'),
				testNumber: z.number().int().min(1),
				url: z.url(),
			}),
		]),
		// Vigencia de la pregunta: deja de usarse en tests generados si
		// `validUntil` ya ha pasado (p. ej. tras un cambio normativo).
		validFrom: z.coerce.date(),
		validUntil: z.coerce.date().optional(),
		// Imagen opcional (p. ej. una señal) referenciada desde public/.
		image: z.string().optional(),
		// Código de una señal del catálogo (colección `signs`), si aplica.
		signId: z.string().optional(),
		// Vídeo de percepción de riesgo opcional (AUT-TSK-0022).
		video: z
			.object({
				url: z.url(),
				maxViews: z.number().int().min(1).default(3),
			})
			.optional(),
	}),
});

const signs = defineCollection({
	loader: file('./src/content/signs/signs.json'),
	schema: z.object({
		// Código oficial del catálogo (RD 465/2025), p. ej. "R-101", "P-1".
		id: z.string().regex(/^[A-Z]-\d+[a-z]?$/),
		group: z.enum([
			'warning',
			'priority',
			'prohibitory',
			'mandatory',
			'indication',
			'service',
			'temporary',
			'additional',
		]),
		name: z.string().min(1),
		meaning: z.string().min(1),
		// Fichero SVG bajo public/signs/, se puebla en AUT-TSK-0006.
		svg: z.string(),
		licence: z.string().min(1),
		author: z.string().min(1),
		sourceUrl: z.url(),
	}),
});

export const collections = { topics, questions, signs };
