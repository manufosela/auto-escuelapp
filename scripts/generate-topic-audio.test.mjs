import { describe, expect, it, vi } from 'vitest';
import { parseTopicFile, planGeneration, requireConfig, synthesize } from './generate-topic-audio.mjs';

describe('parseTopicFile', () => {
	it('separa el frontmatter del cuerpo', () => {
		const source = '---\ntitle: "Velocidad"\nsummary: >\n  Límites de\n  velocidad.\nkeyPoints:\n  - "Uno."\norder: 1\n---\n\n## Detalle\n';
		expect(parseTopicFile(source)).toEqual({
			title: 'Velocidad',
			summary: 'Límites de velocidad.\n',
			keyPoints: ['Uno.'],
			body: '\n## Detalle\n',
		});
	});

	it('falla si el fichero no tiene frontmatter', () => {
		expect(() => parseTopicFile('## Sin frontmatter')).toThrow(/frontmatter/);
	});
});

describe('requireConfig', () => {
	it('devuelve la clave y la voz', () => {
		expect(requireConfig({ ELEVENLABS_API_KEY: 'k', ELEVENLABS_VOICE_ID: 'v' })).toEqual({
			apiKey: 'k',
			voiceId: 'v',
		});
	});

	it('falla nombrando lo que falta', () => {
		expect(() => requireConfig({ ELEVENLABS_VOICE_ID: 'v' })).toThrow(/ELEVENLABS_API_KEY/);
		expect(() => requireConfig({ ELEVENLABS_API_KEY: 'k' })).toThrow(/ELEVENLABS_VOICE_ID/);
	});
});

describe('planGeneration', () => {
	it('genera solo los temas nuevos o cambiados y retira los que ya no existen', () => {
		const topics = [
			{ slug: 'igual', hash: 'a' },
			{ slug: 'cambiado', hash: 'b2' },
			{ slug: 'nuevo', hash: 'c' },
		];
		const manifest = { igual: 'a', cambiado: 'b1', borrado: 'd' };
		expect(planGeneration(topics, manifest)).toEqual({
			toGenerate: ['cambiado', 'nuevo'],
			toRemove: ['borrado'],
		});
	});
});

describe('synthesize', () => {
	const config = { apiKey: 'k', voiceId: 'voz' };

	it('pide el MP3 a ElevenLabs con la clave en cabecera y el modelo multilingüe', async () => {
		const fetchImpl = vi.fn().mockResolvedValue(new Response(new Uint8Array([1, 2, 3])));
		const audio = await synthesize('Hola.', { ...config, fetchImpl });
		expect([...audio]).toEqual([1, 2, 3]);
		const [url, init] = fetchImpl.mock.calls[0];
		expect(url).toBe('https://api.elevenlabs.io/v1/text-to-speech/voz?output_format=mp3_44100_64');
		expect(init.headers['xi-api-key']).toBe('k');
		expect(JSON.parse(init.body)).toEqual({ text: 'Hola.', model_id: 'eleven_multilingual_v2' });
	});

	it('falla con el estado y el mensaje de la API', async () => {
		const fetchImpl = vi.fn().mockResolvedValue(new Response('quota_exceeded', { status: 401 }));
		await expect(synthesize('Hola.', { ...config, fetchImpl })).rejects.toThrow(/401.*quota_exceeded/);
	});

	it('falla sin llamar a la API si el texto supera el límite del modelo', async () => {
		const fetchImpl = vi.fn();
		await expect(synthesize('a'.repeat(10_001), { ...config, fetchImpl })).rejects.toThrow(/10000/);
		expect(fetchImpl).not.toHaveBeenCalled();
	});
});
