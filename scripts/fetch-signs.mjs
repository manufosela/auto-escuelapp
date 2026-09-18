#!/usr/bin/env node
// Descarga señales de tráfico verificadas desde Wikimedia Commons
// (Category:SVG road signs in Spain y subcategorías) a public/signs/ y
// genera src/content/signs/signs.json + ATTRIBUTIONS.md.
//
// Solo se incluyen aquí señales cuyo código y significado se han
// contrastado manualmente contra una fuente fiable (ver el comentario de
// cada entrada en SIGNS). El resto del catálogo, incluidas las señales del
// RD 465/2025 aún sin cobertura verificada en Commons, se documenta en
// docs/research/senales-pendientes.md — no se rellena a ciegas a partir
// del nombre de fichero, que no siempre es fiable.
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const USER_AGENT = 'auto-escuelapp/0.1 (+https://github.com/manufosela/auto-escuelapp)';
const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';
const ROOT = path.join(import.meta.dirname, '..');
const SIGNS_DIR = path.join(ROOT, 'public', 'signs');
const SIGNS_JSON = path.join(ROOT, 'src', 'content', 'signs', 'signs.json');
const ATTRIBUTIONS_FILE = path.join(ROOT, 'ATTRIBUTIONS.md');

// Verificado el 2026-09-18 contra la API de Commons (extmetadata) y, para
// el significado, contra la descripción de Commons y/o
// es.wikipedia.org/wiki/Anexo:Señales_de_tráfico_de_reglamentación_de_España.
const SIGNS = [
	{
		id: 'R-1',
		group: 'priority',
		name: 'Ceda el paso',
		meaning:
			'Obligación de ceder el paso a los vehículos que circulan por la vía a la que se aproxima.',
		file: 'Spain traffic signal r1.svg',
	},
	{
		id: 'R-2',
		group: 'priority',
		name: 'Stop',
		meaning: 'Detención obligatoria: obligación de detenerse ante la señal y ceder el paso.',
		file: 'Spain traffic signal r2, 2023 set.svg',
	},
	{
		id: 'R-101',
		group: 'prohibitory',
		name: 'Entrada prohibida',
		meaning: 'Entrada prohibida a toda clase de vehículos en ambos sentidos.',
		file: 'Spain traffic signal r101.svg',
	},
];

/**
 * Quita el span oculto de "texto espejo" que Commons añade a menudo tras el
 * autor/licencia visibles, y después el resto de etiquetas HTML.
 * @param {string} html
 * @returns {string}
 */
export function stripHtml(html) {
	return html
		.replace(/<span[^>]*display:\s*none[^>]*>.*?<\/span>/gis, '')
		.replace(/<[^>]+>/g, '')
		.trim();
}

async function fetchImageInfo(fileTitle) {
	const url = new URL(COMMONS_API);
	url.searchParams.set('action', 'query');
	url.searchParams.set('format', 'json');
	url.searchParams.set('titles', `File:${fileTitle}`);
	url.searchParams.set('prop', 'imageinfo');
	url.searchParams.set('iiprop', 'url|extmetadata');
	const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
	if (!response.ok) {
		throw new Error(`Commons API respondió ${response.status} para "${fileTitle}"`);
	}
	const data = await response.json();
	const page = Object.values(data.query?.pages ?? {})[0];
	const info = page?.imageinfo?.[0];
	if (!info) {
		throw new Error(`Sin imageinfo para "${fileTitle}" — ¿existe el fichero en Commons?`);
	}
	return info;
}

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
	await mkdir(SIGNS_DIR, { recursive: true });
	const entries = [];
	const attributionLines = [];

	for (const sign of SIGNS) {
		const info = await fetchImageInfo(sign.file);
		const meta = info.extmetadata ?? {};
		const licence = meta.LicenseShortName?.value ?? 'desconocida';
		const author = meta.Artist?.value ? stripHtml(meta.Artist.value) : 'desconocido';

		const svgResponse = await fetch(info.url, { headers: { 'User-Agent': USER_AGENT } });
		if (!svgResponse.ok) {
			throw new Error(`No se pudo descargar el SVG de ${sign.id}: ${svgResponse.status}`);
		}
		const svgText = await svgResponse.text();
		const fileName = `${sign.id.toLowerCase()}.svg`;
		await writeFile(path.join(SIGNS_DIR, fileName), svgText, 'utf8');

		entries.push({
			id: sign.id,
			group: sign.group,
			name: sign.name,
			meaning: sign.meaning,
			svg: `public/signs/${fileName}`,
			licence,
			author,
			sourceUrl: info.descriptionurl,
		});
		attributionLines.push(
			`- Código: ${sign.id}\n  Fichero: public/signs/${fileName}\n  Autor: ${author}\n  Licencia: ${licence}\n  Origen: ${info.descriptionurl}`,
		);
		console.log(`Descargada ${sign.id} (${licence}, ${author})`);
		await sleep(500); // espaciar peticiones a la API de Commons
	}

	await writeFile(SIGNS_JSON, `${JSON.stringify(entries, null, '\t')}\n`, 'utf8');
	await updateAttributions(attributionLines);
	console.log(`Escritas ${entries.length} señales en ${path.relative(ROOT, SIGNS_JSON)}`);
}

async function updateAttributions(lines) {
	const { readFile } = await import('node:fs/promises');
	const current = await readFile(ATTRIBUTIONS_FILE, 'utf8');
	const marker = '## Señales';
	const nextMarker = '\n## Otras fuentes con atribución';
	const start = current.indexOf(marker);
	const end = current.indexOf(nextMarker);
	if (start === -1 || end === -1) {
		throw new Error('No se encontraron los marcadores esperados en ATTRIBUTIONS.md');
	}
	const before = current.slice(0, start + marker.length);
	const after = current.slice(end);
	const body = `\n\n${lines.join('\n\n')}\n`;
	await writeFile(ATTRIBUTIONS_FILE, `${before}${body}${after}`, 'utf8');
}

if (import.meta.url === `file://${process.argv[1]}`) {
	main().catch((error) => {
		console.error(`fetch-signs: ${error.message}`);
		process.exit(1);
	});
}
