import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { audioSrcForTopic, readAudioManifest } from './topic-audio.js';
import { speechHash, topicSpeechText } from './topic-speech.js';

const topic = {
	id: 'velocidad',
	body: '## Detalle\n\nTexto.',
	data: { title: 'Velocidad', summary: 'Límites.', keyPoints: ['A 50 km/h.'] },
};

describe('readAudioManifest', () => {
	it('lee el manifiesto de public/audio/topics', () => {
		const root = mkdtempSync(path.join(tmpdir(), 'audio-'));
		mkdirSync(path.join(root, 'public', 'audio', 'topics'), { recursive: true });
		writeFileSync(path.join(root, 'public', 'audio', 'topics', 'manifest.json'), '{"velocidad":"abc"}');
		expect(readAudioManifest(root)).toEqual({ velocidad: 'abc' });
	});

	it('da un manifiesto vacío si aún no se ha generado audio', () => {
		expect(readAudioManifest(mkdtempSync(path.join(tmpdir(), 'audio-')))).toEqual({});
	});
});

describe('audioSrcForTopic', () => {
	it('da el MP3 del tema si su audio corresponde al texto actual', () => {
		const text = topicSpeechText({ ...topic.data, body: topic.body });
		expect(audioSrcForTopic(topic, { velocidad: speechHash(text) })).toBe('/audio/topics/velocidad.mp3');
		expect(audioSrcForTopic(topic, { velocidad: 'otro' })).toBeNull();
	});
});
