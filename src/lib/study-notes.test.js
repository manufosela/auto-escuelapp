import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { STUDY_NOTES } from './content-schemas.js';

const root = path.join(import.meta.dirname, '..', 'content');
const notesDir = path.join(root, 'study-notes');
const files = readdirSync(notesDir).filter((file) => file.endsWith('.json'));
const read = (file) => JSON.parse(readFileSync(path.join(notesDir, file), 'utf8'));

describe('esquema de las notas para memorizar', () => {
	const table = {
		title: 'T',
		columns: ['A', 'B'],
		rows: [['1', '2']],
		legalReferences: [{ norm: 'BOE-A-2003-23514', article: 'art. 20', asOfDate: '2004-01-23' }],
	};

	it('acepta tablas cuyas filas tienen tantas celdas como columnas', () => {
		expect(STUDY_NOTES.safeParse({ tables: [table] }).success).toBe(true);
	});

	it('rechaza una fila con celdas de menos y una tabla sin referencia legal', () => {
		expect(STUDY_NOTES.safeParse({ tables: [{ ...table, rows: [['1']] }] }).success).toBe(false);
		expect(STUDY_NOTES.safeParse({ tables: [{ ...table, legalReferences: [] }] }).success).toBe(false);
	});
});

describe('notas para memorizar del temario', () => {
	it('cubre todos los temas del temario', () => {
		const topics = readdirSync(path.join(root, 'topics')).filter((file) => file.endsWith('.md'));
		const covered = new Set(files.map((file) => file.replace(/\.json$/, '')));
		expect(topics.map((file) => file.replace(/\.md$/, '')).filter((topic) => !covered.has(topic))).toEqual([]);
	});

	it.each(files)('%s cumple el esquema y corresponde a un tema que existe', (file) => {
		expect(STUDY_NOTES.safeParse(read(file)).error).toBeUndefined();
		expect(existsSync(path.join(root, 'topics', file.replace(/\.json$/, '.md')))).toBe(true);
	});
});
