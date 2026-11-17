import { describe, expect, it } from 'vitest';
import {
	expandAbbreviations,
	markdownToSpeech,
	speechHash,
	topicAudioSrc,
	topicSpeechText,
} from './topic-speech.js';

describe('markdownToSpeech', () => {
	it('quita las marcas de markdown y cierra los títulos con punto', () => {
		const markdown = '## Velocidad en vías urbanas\n\nEl límite es **transitable y\nsuficiente**, ver [art. 48](https://boe.es).';
		expect(markdownToSpeech(markdown)).toBe(
			'Velocidad en vías urbanas.\n\nEl límite es transitable y suficiente, ver art. 48.',
		);
	});

	it('pone cada elemento de una lista en su línea y une sus líneas partidas', () => {
		const markdown = 'Casos:\n\n- Dentro de un túnel.\n- Quien presente síntomas de\n  conducir bajo efectos.\n1. Primero.';
		expect(markdownToSpeech(markdown)).toBe(
			'Casos:\n\nDentro de un túnel.\nQuien presente síntomas de conducir bajo efectos.\nPrimero.',
		);
	});
});

describe('expandAbbreviations', () => {
	it('lee las unidades enteras', () => {
		expect(expandAbbreviations('A 120 km/h, 0,25 mg/l, 0,5 g/l, 3.500 kg y 1,50 m o más.')).toBe(
			'A 120 kilómetros por hora, 0,25 miligramos por litro, 0,5 gramos por litro, 3.500 kilos y 1,50 metros o más.',
		);
	});

	it('no toca letras sueltas que no van detrás de un número', () => {
		expect(expandAbbreviations('el m de mano y la km de algo')).toBe('el m de mano y la km de algo');
	});
});

describe('topicSpeechText', () => {
	it('lee título, resumen, puntos clave y desarrollo en ese orden', () => {
		const text = topicSpeechText({
			title: 'Velocidad',
			summary: 'Límites.',
			keyPoints: ['A 50 km/h.', 'Distancia.'],
			body: '## Detalle\n\nTexto.',
		});
		expect(text).toBe(
			'Velocidad.\n\nLímites.\n\nPuntos clave.\nA 50 kilómetros por hora.\nDistancia.\n\nDetalle.\n\nTexto.',
		);
	});
});

describe('topicAudioSrc', () => {
	it('da la ruta del MP3 si el audio se generó con el texto actual', () => {
		expect(topicAudioSrc('velocidad', 'texto', { velocidad: speechHash('texto') })).toBe(
			'/audio/topics/velocidad.mp3',
		);
	});

	it('no da audio si el texto cambió desde que se generó o si no hay audio', () => {
		expect(topicAudioSrc('velocidad', 'texto nuevo', { velocidad: speechHash('texto') })).toBeNull();
		expect(topicAudioSrc('velocidad', 'texto', {})).toBeNull();
	});
});

describe('speechHash', () => {
	it('es estable para el mismo texto y cambia si cambia el texto', () => {
		expect(speechHash('hola')).toBe(speechHash('hola'));
		expect(speechHash('hola')).not.toBe(speechHash('hola.'));
		expect(speechHash('hola')).toMatch(/^[0-9a-f]{16}$/);
	});
});
