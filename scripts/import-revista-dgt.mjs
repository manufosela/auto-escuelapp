#!/usr/bin/env node
// Importa el TEXTO de los tests de la revista "Tráfico y Seguridad Vial"
// (revista.dgt.es/es/test/) a un área de borrador para revisión humana.
// Ver docs/SOURCES.md y CONTENT-LICENSE.md §2 para las condiciones de uso:
// solo texto, citando el número de test y la URL; las imágenes de la
// revista NUNCA se descargan ni se referencian (su reproducción está
// prohibida por el aviso legal de la propia revista).
//
// El resultado NO se escribe directamente en src/content/questions/: la
// colección exige `explanation` y `legalReference` (ver content.config.js),
// y estos datos requieren investigación legal caso por caso que este script
// no puede hacer de forma fiable. Cada test importado se guarda como
// borrador en docs/research/revista-dgt-imports/test-{n}.json, con una
// clasificación de materia heurística (`subjectGuess`, puede ser null) a
// revisar por una persona antes de promocionar la pregunta al schema final.
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const USER_AGENT = 'auto-escuelapp/0.1 (+https://github.com/manufosela/auto-escuelapp)';
const BASE_URL = 'https://revista.dgt.es/es/test';
const ROOT = path.join(import.meta.dirname, '..');
const OUTPUT_DIR = path.join(ROOT, 'docs', 'research', 'revista-dgt-imports');
const REQUEST_DELAY_MS = 1500;

// Números de test enlazados desde revista.dgt.es/es/test/ el 2026-09-19. Se
// añaden aquí explícitamente según se van revisando, nunca recorriendo el
// sitio a ciegas (evita carga innecesaria en el servidor de la DGT).
export const TEST_NUMBERS = [268, 270, 271, 272, 273, 274, 275, 276, 277, 278];

// Heurística de clasificación por materia (Anexo V.B.1, RD 818/2009 — ver
// docs/research/formato-examen-y-preguntas.md §5). Es solo una sugerencia:
// el resultado se marca siempre para revisión humana antes de publicarse.
const SUBJECT_KEYWORDS = [
	[4, /alcohol|droga|cannabis|somnolencia|fatiga|sueño|medicamento sedante|tiempo de reacción/i],
	[8, /peatón|peatones|ciclista|patinete|vmp|usuario vulnerable/i],
	[15, /cinturón|casco|reposacabezas|\bsri\b|airbag/i],
	[14, /freno|frenos|neumático|rueda de repuesto|batería|avería mecánica/i],
	[5, /distancia de seguridad|distancia de frenado|estabilidad/i],
	[6, /túnel|niebla|hielo|calzada mojada|lluvia intensa/i],
	[9, /deslumbr|luz de largo alcance|luz de corto alcance|visibilidad|remolque/i],
	[13, /abandonar el vehículo|al aparcar|al estacionar/i],
	[10, /permiso de circulación|itv|seguro obligatorio|documentación/i],
	[11, /primeros auxilios|persona accidentada|socorrer/i],
	[12, /carga del vehículo|equipaje|pasajeros transportados/i],
	[16, /conducción eficiente|medio ambiente|emisiones/i],
	[1, /señal|ceda el paso|\bstop\b|prioridad|velocidad máxima|límite de velocidad|adelantar|adelantamiento|marcas viales|claxon|carril/i],
];

/**
 * Sugiere una materia (1-16) a partir del texto de la pregunta, o `null` si
 * ninguna palabra clave encaja (requiere clasificación manual).
 * @param {string} text
 * @returns {number|null}
 */
export function guessSubject(text) {
	const match = SUBJECT_KEYWORDS.find(([, pattern]) => pattern.test(text));
	return match ? match[0] : null;
}

/**
 * @param {string} raw fragmento HTML
 * @returns {string} texto plano, sin etiquetas ni entidades básicas
 */
function cleanText(raw) {
	return raw
		.replace(/<[^>]+>/g, ' ')
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/\s+/g, ' ')
		.trim();
}

/**
 * Extrae las preguntas de un test de la revista DGT. Nunca lee ni referencia
 * las imágenes de las preguntas (prohibido por el aviso legal de la
 * revista): solo el enunciado, las 3 opciones y la respuesta correcta.
 * @param {string} html
 * @param {number} testNumber
 * @param {string} url
 * @returns {Array<{ number: number, statement: string, options: string[], correctIndex: number, subjectGuess: number|null, source: { type: 'revista-dgt', testNumber: number, url: string } }>}
 */
export function parseTestHtml(html, testNumber, url) {
	const articleRe = /<article class="test[^"]*">([\s\S]*?)<\/article>/g;
	const questions = [];
	let articleMatch;
	while ((articleMatch = articleRe.exec(html))) {
		const block = articleMatch[1];
		const headingMatch = /<h4 class="tit_not">\s*(\d+)\.\s*([\s\S]*?)<\/h4>/.exec(block);
		if (!headingMatch) {
			throw new Error(`Test ${testNumber}: no se pudo localizar el enunciado de una pregunta`);
		}
		const [, numberText, rawStatement] = headingMatch;
		const number = Number(numberText);
		const statement = cleanText(rawStatement);

		const options = [];
		const optionRe = /<span class="opcion">[A-C]\.<\/span>\s*([\s\S]*?)<\/li>/g;
		let optionMatch;
		while ((optionMatch = optionRe.exec(block))) {
			options.push(cleanText(optionMatch[1]));
		}
		if (options.length !== 3) {
			throw new Error(
				`Test ${testNumber} pregunta ${number}: se esperaban 3 opciones, se encontraron ${options.length}`,
			);
		}

		const correctMatch = /Respuesta correcta<\/strong>\s*<span class="opcion">([A-C])<\/span>/.exec(block);
		if (!correctMatch) {
			throw new Error(`Test ${testNumber} pregunta ${number}: no se encontró la respuesta correcta`);
		}
		const correctIndex = correctMatch[1].charCodeAt(0) - 'A'.charCodeAt(0);

		questions.push({
			number,
			statement,
			options,
			correctIndex,
			subjectGuess: guessSubject(statement),
			source: { type: 'revista-dgt', testNumber, url },
		});
	}
	if (questions.length === 0) {
		throw new Error(`Test ${testNumber}: no se encontró ninguna pregunta en ${url}`);
	}
	return questions;
}

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function importTest(testNumber) {
	const url = `${BASE_URL}/Test-num-${testNumber}.shtml`;
	const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
	if (!response.ok) {
		throw new Error(`revista.dgt.es respondió ${response.status} para ${url}`);
	}
	const html = await response.text();
	const questions = parseTestHtml(html, testNumber, url);
	const draft = { testNumber, url, importedAt: new Date().toISOString(), questions };
	await writeFile(
		path.join(OUTPUT_DIR, `test-${testNumber}.json`),
		`${JSON.stringify(draft, null, '\t')}\n`,
		'utf8',
	);
	console.log(`Test ${testNumber}: ${questions.length} preguntas → docs/research/revista-dgt-imports/test-${testNumber}.json`);
}

async function main() {
	await mkdir(OUTPUT_DIR, { recursive: true });
	for (const [index, testNumber] of TEST_NUMBERS.entries()) {
		if (index > 0) await sleep(REQUEST_DELAY_MS); // peticiones espaciadas
		await importTest(testNumber);
	}
}

if (import.meta.url === `file://${process.argv[1]}`) {
	main().catch((error) => {
		console.error(`import-revista-dgt: ${error.message}`);
		process.exit(1);
	});
}
