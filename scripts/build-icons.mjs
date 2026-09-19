#!/usr/bin/env node
// Regenera los PNG del icono de la PWA a partir de public/icons/icon.svg.
// Los PNG resultantes SÍ se versionan (son pequeños y deterministas); este
// script se ejecuta a mano solo cuando cambia el SVG fuente.
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.join(import.meta.dirname, '..');
const SOURCE_SVG = path.join(ROOT, 'public', 'icons', 'icon.svg');
const SIZES = [180, 192, 512];

async function main() {
	const svg = await readFile(SOURCE_SVG);
	for (const size of SIZES) {
		const outFile = path.join(ROOT, 'public', 'icons', `icon-${size}.png`);
		await sharp(svg).resize(size, size).png().toFile(outFile);
		console.log(`Generado ${path.relative(ROOT, outFile)}`);
	}
}

main().catch((error) => {
	console.error(`build-icons: ${error.message}`);
	process.exit(1);
});
