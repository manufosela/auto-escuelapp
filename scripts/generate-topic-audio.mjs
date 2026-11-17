// Genera el audio de cada tema del temario con ElevenLabs (AUT-TSK-0037).
// Uso: ELEVENLABS_API_KEY=... ELEVENLABS_VOICE_ID=... node scripts/generate-topic-audio.mjs
// Solo pide a la API los temas cuyo texto cambió desde la última vez
// (public/audio/topics/manifest.json guarda el hash de cada uno). La clave
// solo se usa aquí: nunca llega a la app.
import { readdir, readFile, rm, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'yaml';
import { speechHash, topicSpeechText } from '../src/lib/topic-speech.js';

const ROOT = path.join(import.meta.dirname, '..');
const TOPICS_DIR = path.join(ROOT, 'src', 'content', 'topics');
const AUDIO_DIR = path.join(ROOT, 'public', 'audio', 'topics');
const MANIFEST_PATH = path.join(AUDIO_DIR, 'manifest.json');
const MODEL_ID = 'eleven_multilingual_v2';
// Límite de caracteres por petición de eleven_multilingual_v2.
const MAX_CHARACTERS = 10_000;

/**
 * @param {string} source fichero .md de un tema
 * @returns {{ title: string, summary: string, keyPoints: string[], body: string }}
 */
export function parseTopicFile(source) {
	const match = source.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
	if (!match) throw new Error('el tema no tiene frontmatter');
	const { title, summary, keyPoints } = parse(match[1]);
	return { title, summary, keyPoints, body: match[2] };
}

/**
 * @param {Record<string, string | undefined>} env
 * @returns {{ apiKey: string, voiceId: string }}
 */
export function requireConfig(env) {
	const missing = ['ELEVENLABS_API_KEY', 'ELEVENLABS_VOICE_ID'].filter((name) => !env[name]);
	if (missing.length > 0) throw new Error(`faltan variables de entorno: ${missing.join(', ')}`);
	return { apiKey: env.ELEVENLABS_API_KEY, voiceId: env.ELEVENLABS_VOICE_ID };
}

/**
 * @param {Array<{ slug: string, hash: string }>} topics
 * @param {Record<string, string>} manifest slug → hash del audio generado
 * @returns {{ toGenerate: string[], toRemove: string[] }}
 */
export function planGeneration(topics, manifest) {
	const slugs = new Set(topics.map((topic) => topic.slug));
	return {
		toGenerate: topics.filter((topic) => manifest[topic.slug] !== topic.hash).map((topic) => topic.slug),
		toRemove: Object.keys(manifest).filter((slug) => !slugs.has(slug)),
	};
}

/**
 * @param {string} text
 * @param {{ apiKey: string, voiceId: string, fetchImpl?: typeof fetch }} options
 * @returns {Promise<Uint8Array>} MP3
 */
export async function synthesize(text, { apiKey, voiceId, fetchImpl = fetch }) {
	if (text.length > MAX_CHARACTERS) {
		throw new Error(`el texto tiene ${text.length} caracteres y el modelo admite ${MAX_CHARACTERS}`);
	}
	const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_64`;
	const response = await fetchImpl(url, {
		method: 'POST',
		headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
		body: JSON.stringify({ text, model_id: MODEL_ID }),
	});
	if (!response.ok) throw new Error(`ElevenLabs respondió ${response.status}: ${await response.text()}`);
	return new Uint8Array(await response.arrayBuffer());
}

async function readManifest() {
	try {
		return JSON.parse(await readFile(MANIFEST_PATH, 'utf8'));
	} catch (error) {
		if (error.code === 'ENOENT') return {};
		throw error;
	}
}

async function main() {
	const config = requireConfig(process.env);
	const files = (await readdir(TOPICS_DIR)).filter((file) => file.endsWith('.md'));
	const topics = await Promise.all(
		files.map(async (file) => {
			const text = topicSpeechText(parseTopicFile(await readFile(path.join(TOPICS_DIR, file), 'utf8')));
			return { slug: path.basename(file, '.md'), text, hash: speechHash(text) };
		}),
	);
	const manifest = await readManifest();
	const { toGenerate, toRemove } = planGeneration(topics, manifest);
	await mkdir(AUDIO_DIR, { recursive: true });
	for (const slug of toRemove) {
		await rm(path.join(AUDIO_DIR, `${slug}.mp3`), { force: true });
		delete manifest[slug];
	}
	for (const slug of toGenerate) {
		const topic = topics.find((entry) => entry.slug === slug);
		await writeFile(path.join(AUDIO_DIR, `${slug}.mp3`), await synthesize(topic.text, config));
		manifest[slug] = topic.hash;
		// El manifest se guarda tras cada tema: si falla uno, lo ya generado no se repite.
		await writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, '\t')}\n`);
		console.log(`generado ${slug} (${topic.text.length} caracteres)`);
	}
	if (toRemove.length > 0) await writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, '\t')}\n`);
	console.log(`${toGenerate.length} generados, ${toRemove.length} retirados, ${topics.length - toGenerate.length} sin cambios`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
	main().catch((error) => {
		console.error(`generate-topic-audio: ${error.message}`);
		process.exit(1);
	});
}
