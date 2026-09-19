#!/usr/bin/env node
// Vigila las normas ya citadas por el contenido versionado
// (src/content/legal/) contra la API de datos abiertos del BOE, y abre un
// issue de GitHub cuando la API devuelve una versión que el contenido
// todavía no tiene. Pensado para ejecutarse desde un workflow programado
// (.github/workflows/watch-boe.yml, cron semanal).
//
// Sin estado nuevo: la "última versión conocida" es la que ya está
// committeada en src/content/legal/**/*.json (scripts/fetch-legal.mjs la
// guarda ahí). No hace falta un fichero de estado aparte.
import { execFileSync } from 'node:child_process';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fetchBlock } from './fetch-legal.mjs';

const ROOT = path.join(import.meta.dirname, '..');
const LEGAL_DIR = path.join(ROOT, 'src', 'content', 'legal');
const QUESTIONS_DIR = path.join(ROOT, 'src', 'content', 'questions');
const REPO = 'manufosela/auto-escuelapp';

/** @param {{ sourceNormId: string, effectiveDate: string }} version */
export function versionKey(version) {
	return `${version.sourceNormId}@${version.effectiveDate}`;
}

/**
 * @param {{ versions?: Array<{ sourceNormId: string, effectiveDate: string }> }} localBlock
 * @param {{ versions?: Array<{ sourceNormId: string, effectiveDate: string }> }} liveBlock
 * @returns {boolean}
 */
export function hasBlockChanged(localBlock, liveBlock) {
	const local = (localBlock.versions ?? []).map(versionKey);
	const live = (liveBlock.versions ?? []).map(versionKey);
	return local.length !== live.length || local.some((key, i) => key !== live[i]);
}

function blockNumber(blockId) {
	const match = /^a(\d+)$/.exec(blockId);
	if (!match) throw new Error(`blockId con formato inesperado: "${blockId}"`);
	return match[1];
}

function articleNumber(article) {
	return /art\.\s*(\d+)/.exec(article ?? '')?.[1] ?? null;
}

/**
 * Compara por número de artículo (ignora el sufijo de apartado/letra, p. ej.
 * "art. 48.1.e)" cuenta como el artículo 48): mejor avisar de más que dejar
 * pasar en silencio una pregunta que podría verse afectada.
 * @param {{ legalReference?: { norm: string, article: string } }} question
 * @param {string} normId
 * @param {string} blockId
 * @returns {boolean}
 */
export function questionCitesBlock(question, normId, blockId) {
	return (
		question.legalReference?.norm === normId &&
		articleNumber(question.legalReference.article) === blockNumber(blockId)
	);
}

async function loadLocalBlocks() {
	const blocks = [];
	let normDirs;
	try {
		normDirs = await readdir(LEGAL_DIR, { withFileTypes: true });
	} catch {
		return blocks;
	}
	for (const dirent of normDirs) {
		if (!dirent.isDirectory()) continue;
		const files = await readdir(path.join(LEGAL_DIR, dirent.name));
		for (const file of files) {
			if (!file.endsWith('.json')) continue;
			const data = JSON.parse(await readFile(path.join(LEGAL_DIR, dirent.name, file), 'utf8'));
			blocks.push({ normId: dirent.name, blockId: data.blockId, data });
		}
	}
	return blocks;
}

async function loadQuestions() {
	let files;
	try {
		files = await readdir(QUESTIONS_DIR);
	} catch {
		return [];
	}
	const questions = [];
	for (const file of files) {
		if (!file.endsWith('.json')) continue;
		const data = JSON.parse(await readFile(path.join(QUESTIONS_DIR, file), 'utf8'));
		questions.push({ file, data });
	}
	return questions;
}

/**
 * @returns {Promise<Array<{ normId: string, blockId: string, title: string, citingQuestions: string[] }>>}
 */
export async function findChanges() {
	const [localBlocks, questions] = await Promise.all([loadLocalBlocks(), loadQuestions()]);
	const changes = [];
	for (const local of localBlocks) {
		const live = await fetchBlock({ normId: local.normId, blockId: local.blockId });
		if (!hasBlockChanged(local.data, live)) continue;
		const citingQuestions = questions
			.filter(({ data }) => questionCitesBlock(data, local.normId, local.blockId))
			.map(({ file }) => file);
		changes.push({ normId: local.normId, blockId: local.blockId, title: live.title, citingQuestions });
	}
	return changes;
}

function issueMarker(change) {
	return `[BOE-WATCH] ${change.normId} ${change.blockId}`;
}

function issueBody(change) {
	const lines = [
		`La API de datos abiertos del BOE devuelve una versión de **${change.title}** ` +
			`(${change.normId}, bloque \`${change.blockId}\`) que no coincide con la guardada en ` +
			`\`src/content/legal/${change.normId}/${change.blockId}.json\`.`,
		'',
		'Pasos:',
		'1. Ejecutar `node scripts/fetch-legal.mjs` (añadiendo el bloque a `BLOCKS` si hiciera falta) para traer la versión actualizada.',
		'2. Revisar si el cambio afecta a alguna pregunta y actualizar su `explanation`/`legalReference`, o marcarla como no vigente con `validUntil` si ha quedado obsoleta.',
	];
	if (change.citingQuestions.length > 0) {
		lines.push(
			'',
			'Preguntas que citan hoy este bloque:',
			...change.citingQuestions.map((file) => `- \`src/content/questions/${file}\``),
		);
	} else {
		lines.push('', 'Ninguna pregunta cita hoy este bloque directamente.');
	}
	return lines.join('\n');
}

function hasOpenIssue(marker) {
	const output = execFileSync(
		'gh',
		[
			'issue',
			'list',
			'--repo',
			REPO,
			'--state',
			'open',
			'--search',
			`"${marker}" in:title`,
			'--json',
			'title',
		],
		{ encoding: 'utf8' },
	);
	return JSON.parse(output).some((issue) => issue.title.includes(marker));
}

function createIssue(change) {
	const marker = issueMarker(change);
	execFileSync(
		'gh',
		[
			'issue',
			'create',
			'--repo',
			REPO,
			'--title',
			`${marker}: revisar preguntas afectadas`,
			'--body',
			issueBody(change),
		],
		{ encoding: 'utf8' },
	);
}

async function main() {
	const changes = await findChanges();
	if (changes.length === 0) {
		console.log('watch-boe: sin cambios respecto al contenido versionado.');
		return;
	}
	for (const change of changes) {
		const marker = issueMarker(change);
		if (hasOpenIssue(marker)) {
			console.log(`watch-boe: ya hay un issue abierto para ${marker}, no se duplica.`);
			continue;
		}
		createIssue(change);
		console.log(`watch-boe: creado issue para ${marker}.`);
	}
}

if (import.meta.url === `file://${process.argv[1]}`) {
	main().catch((error) => {
		console.error(`watch-boe: ${error.message}`);
		process.exit(1);
	});
}
