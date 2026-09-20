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
	{ normId: 'BOE-A-2003-23514', blockId: 'a21' },
	{ normId: 'BOE-A-2003-23514', blockId: 'a48' },
	{ normId: 'BOE-A-2003-23514', blockId: 'a50' },
	{ normId: 'BOE-A-2003-23514', blockId: 'a54' },
	{ normId: 'BOE-A-2003-23514', blockId: 'a101' },
	{ normId: 'BOE-A-2003-23514', blockId: 'a41' },
	{ normId: 'BOE-A-2003-23514', blockId: 'a65' },
	{ normId: 'BOE-A-2003-23514', blockId: 'a117' },
	{ normId: 'BOE-A-2003-23514', blockId: 'a85' },
	{ normId: 'BOE-A-2003-23514', blockId: 'a92' },
	{ normId: 'BOE-A-2003-23514', blockId: 'a14' },
	{ normId: 'BOE-A-2003-23514', blockId: 'a106' },
	{ normId: 'BOE-A-2003-23514', blockId: 'a36' },
	{ normId: 'BOE-A-2003-23514', blockId: 'a18' },
	{ normId: 'BOE-A-1999-1826', blockId: 'anvii' },
	{ normId: 'BOE-A-2015-11722', blockId: 'a46' },
	{ normId: 'BOE-A-2015-11722', blockId: 'a51' },
	{ normId: 'BOE-A-2009-9481', blockId: 'a12' },
	{ normId: 'BOE-A-2017-12841', blockId: 'a6' },
];

const parser = new XMLParser({
	ignoreAttributes: false,
	attributeNamePrefix: '@_',
	textNodeName: '#text',
	isArray: (name) => name === 'p' || name === 'version' || name === 'table' || name === 'tr',
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
 * Aplana las celdas de una fila (<tr>) a texto, una por elemento. El
 * parser separa <td> y <th> en propiedades distintas del mismo objeto
 * (pierde su orden real si estuvieran intercalados), pero en las tablas
 * del BOE cada fila usa un único tipo de celda (cabecera → th, cuerpo →
 * td) salvo la celda de esquina en blanco, que queda vacía y se descarta.
 * @param {unknown} row
 * @returns {string[]}
 */
function cellTexts(row) {
	if (!row || typeof row !== 'object') return [];
	const cells = [].concat(row.td ?? [], row.th ?? []);
	return cells.map(flattenText).map((text) => text.trim()).filter(Boolean);
}

/**
 * Aplana una tabla del BOE (<table>) a texto plano, fila a fila. Las
 * preguntas/temario deben leer estas filas para redactar su propio texto,
 * nunca copiar la tabla tal cual.
 * @param {unknown} table
 * @returns {string}
 */
export function flattenTable(table) {
	const rows = [
		...[].concat(table?.thead?.tr ?? []),
		...[].concat(table?.tbody?.tr ?? []),
	];
	return rows
		.map((row) => cellTexts(row).join(' | '))
		.filter(Boolean)
		.join('\n');
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
		// Las tablas (<table>) del BOE no van dentro de <p>: se aplanan
		// aparte y se añaden al final. No conservan su posición exacta
		// entre los párrafos, pero antes se perdían por completo.
		paragraphs: [
			...(version.p ?? []).map((p) => ({
				class: p['@_class'] ?? null,
				text: flattenText(p),
			})),
			...[].concat(version.table ?? []).map((table) => ({
				class: 'tabla',
				text: flattenTable(table),
			})),
		],
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
