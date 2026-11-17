// Texto de un tema para leerlo en voz alta (AUT-TSK-0037). Lo usan el script
// que genera los MP3 con ElevenLabs y la página del tema, que solo enseña el
// audio si su hash coincide con el texto actual. Solo se ejecuta en Node
// (build y scripts), nunca en el navegador.
import { createHash } from 'node:crypto';

/** @type {Array<[RegExp, string]>} */
const UNITS = [
	[/(\d)\s?km\/h\b/g, '$1 kilómetros por hora'],
	[/(\d)\s?mg\/l\b/g, '$1 miligramos por litro'],
	[/(\d)\s?g\/l\b/g, '$1 gramos por litro'],
	[/(\d)\s?kg\b/g, '$1 kilos'],
	[/(\d)\s?m\b(?!\/)/g, '$1 metros'],
];

/**
 * @param {string} text
 * @returns {string}
 */
export function expandAbbreviations(text) {
	return UNITS.reduce((result, [pattern, replacement]) => result.replace(pattern, replacement), text);
}

/** @param {string} line */
function stripInline(line) {
	return line
		.replaceAll(/\[([^\]]+)\]\([^)]*\)/g, '$1')
		.replaceAll(/(\*\*|__|\*|_)(\S[^*_]*?)\1/g, '$2')
		.replaceAll('`', '');
}

/** @param {string} heading */
function closeSentence(heading) {
	return /[.:!?]$/.test(heading) ? heading : `${heading}.`;
}

/**
 * Markdown del cuerpo de un tema a texto plano: un párrafo por bloque, una
 * línea por elemento de lista y los títulos acabados en punto para que la
 * voz haga la pausa.
 * @param {string} markdown
 * @returns {string}
 */
export function markdownToSpeech(markdown) {
	const blocks = markdown.trim().split(/\n\s*\n/);
	return blocks
		.map((block) => {
			const lines = [];
			for (const rawLine of block.split('\n')) {
				const line = rawLine.trim();
				const heading = line.match(/^#{1,6}\s+(.*)$/);
				const listItem = line.match(/^(?:[-*+]|\d+\.)\s+(.*)$/);
				if (heading) lines.push(closeSentence(heading[1]));
				else if (listItem) lines.push(listItem[1]);
				else if (lines.length === 0) lines.push(line);
				else lines[lines.length - 1] += ` ${line}`;
			}
			// Las marcas en línea se quitan tras unir: un **énfasis** puede
			// partirse entre dos líneas del fichero.
			return lines.map(stripInline).join('\n');
		})
		.join('\n\n');
}

/**
 * @param {{ title: string, summary: string, keyPoints: string[], body: string }} topic
 * @returns {string}
 */
export function topicSpeechText({ title, summary, keyPoints, body }) {
	const text = [
		closeSentence(title),
		summary.trim(),
		['Puntos clave.', ...keyPoints].join('\n'),
		markdownToSpeech(body),
	].join('\n\n');
	return expandAbbreviations(text);
}

/**
 * Ruta del audio de un tema, solo si se generó con su texto actual: un audio
 * que ya no coincide con lo escrito no se ofrece.
 * @param {string} slug
 * @param {string} text texto actual (topicSpeechText)
 * @param {Record<string, string>} manifest slug → hash del audio generado
 * @returns {string | null}
 */
export function topicAudioSrc(slug, text, manifest) {
	return manifest[slug] === speechHash(text) ? `/audio/topics/${slug}.mp3` : null;
}

/**
 * @param {string} text
 * @returns {string} 16 caracteres hexadecimales
 */
export function speechHash(text) {
	return createHash('sha256').update(text).digest('hex').slice(0, 16);
}
