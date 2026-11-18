// Audio de los temas en el build (AUT-TSK-0040): lo comparten la página de
// cada tema y el índice del temario. Solo Node.
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { topicAudioSrc, topicSpeechText } from './topic-speech.js';

/**
 * Manifiesto que escribe scripts/generate-topic-audio.mjs.
 * @param {string} [root] raíz del proyecto
 * @returns {Record<string, string>} slug → hash del audio generado
 */
export function readAudioManifest(root = process.cwd()) {
	const manifestPath = path.join(root, 'public', 'audio', 'topics', 'manifest.json');
	return existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : {};
}

/**
 * @param {{ id: string, body?: string, data: { title: string, summary: string, keyPoints: string[] } }} topic
 * @param {Record<string, string>} manifest
 * @returns {string | null}
 */
export function audioSrcForTopic(topic, manifest) {
	return topicAudioSrc(topic.id, topicSpeechText({ ...topic.data, body: topic.body ?? '' }), manifest);
}
