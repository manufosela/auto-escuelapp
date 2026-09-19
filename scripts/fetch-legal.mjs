#!/usr/bin/env node
// Descarga bloques de normativa consolidada desde la API de datos abiertos
// del BOE y los guarda como contenido versionado en src/content/legal/.
// Ver docs/SOURCES.md y CONTENT-LICENSE.md para las condiciones de reutilización.
//
// Nota sobre la API: el endpoint texto/bloque/{id} solo acepta
// `Accept: application/xml` de forma exacta (un valor único, sin lista ni
// comodines) — cualquier otra cabecera Accept, incluida su ausencia,
// devuelve 400 "No soportado ningún mime type de la cabecera Accept".
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { XMLParser } from 'fast-xml-parser';

const BOE_API_BASE = 'https://www.boe.es/datosabiertos/api/legislacion-consolidada';
const CONTENT_DIR = path.join(import.meta.dirname, '..', 'src', 'content', 'legal');

// Bloques a descargar. Se añaden aquí explícitamente según los va
// necesitando el contenido (temario, preguntas) — nunca "toda la norma".
const BLOCKS = [
	{ normId: 'BOE-A-2003-23514', blockId: 'a20' },
	{ normId: 'BOE-A-2003-23514', blockId: 'a48' },
	{ normId: 'BOE-A-2003-23514', blockId: 'a50' },
	{ normId: 'BOE-A-2003-23514', blockId: 'a54' },
];

const parser = new XMLParser({
	ignoreAttributes: false,
	attributeNamePrefix: '@_',
	textNodeName: '#text',
	isArray: (name) => name === 'p' || name === 'version',
});

/**
 * Aplana el árbol parseado de un elemento a su texto, ignorando atributos.
 * @param {unknown} node
 * @returns {string}
 */
export function flattenText(node) {
	if (node === null || node === undefined) return '';
	if (typeof node === 'string' || typeof node === 'number') return String(node);
	if (Array.isArray(node)) return node.map(flattenText).join(' ');
	if (typeof node === 'object') {
		return Object.entries(node)
			.filter(([key]) => !key.startsWith('@_'))
			.map(([, value]) => flattenText(value))
			.join(' ')
			.trim();
	}
	return '';
}

/**
 * Convierte una fecha BOE "YYYYMMDD" en ISO "YYYY-MM-DD".
 * @param {string} boeDate
 * @returns {string}
 */
export function boeDateToISO(boeDate) {
	if (!/^\d{8}$/.test(boeDate)) {
		throw new Error(`Fecha BOE con formato inesperado: "${boeDate}"`);
	}
	return `${boeDate.slice(0, 4)}-${boeDate.slice(4, 6)}-${boeDate.slice(6, 8)}`;
}

/**
 * @param {{ normId: string, blockId: string }} params
 */
export async function fetchBlock({ normId, blockId }) {
	const url = `${BOE_API_BASE}/id/${normId}/texto/bloque/${blockId}`;
	const response = await fetch(url, {
		headers: { Accept: 'application/xml' },
	});
	if (!response.ok) {
		throw new Error(`BOE API respondió ${response.status} para ${url}`);
	}
	const xml = await response.text();
	const parsed = parser.parse(xml);
	const status = parsed?.response?.status;
	if (Number(status?.code) !== 200) {
		throw new Error(`BOE API devolvió estado "${status?.text}" para ${url}`);
	}
	const bloque = parsed?.response?.data?.bloque;
	if (!bloque) {
		throw new Error(`Respuesta sin bloque para ${url}`);
	}

	const versions = (bloque.version ?? []).map((version) => ({
		sourceNormId: version['@_id_norma'],
		publicationDate: boeDateToISO(version['@_fecha_publicacion']),
		effectiveDate: boeDateToISO(version['@_fecha_vigencia']),
		paragraphs: (version.p ?? []).map((p) => ({
			class: p['@_class'] ?? null,
			text: flattenText(p),
		})),
	}));

	return {
		normId,
		blockId,
		title: bloque['@_titulo'] ?? '',
		versions,
	};
}

async function main() {
	for (const block of BLOCKS) {
		const data = await fetchBlock(block);
		const dir = path.join(CONTENT_DIR, block.normId);
		await mkdir(dir, { recursive: true });
		const file = path.join(dir, `${block.blockId}.json`);
		await writeFile(file, `${JSON.stringify(data, null, '\t')}\n`, 'utf8');
		console.log(`Escrito ${path.relative(process.cwd(), file)} (${data.versions.length} versiones)`);
	}
}

if (import.meta.url === `file://${process.argv[1]}`) {
	main().catch((error) => {
		console.error(`fetch-legal: ${error.message}`);
		process.exit(1);
	});
}
