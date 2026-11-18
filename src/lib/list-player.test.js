import { describe, expect, it } from 'vitest';
import { listPlayerAction } from './list-player.js';

describe('listPlayerAction', () => {
	it('carga el tema pulsado si el reproductor está vacío o tiene otro tema', () => {
		expect(listPlayerAction({ currentSrc: '', paused: true }, '/audio/topics/a.mp3')).toBe('load');
		expect(listPlayerAction({ currentSrc: '/audio/topics/b.mp3', paused: false }, '/audio/topics/a.mp3')).toBe(
			'load',
		);
	});

	it('pausa el tema que está sonando y reanuda el que está en pausa', () => {
		expect(listPlayerAction({ currentSrc: '/audio/topics/a.mp3', paused: false }, '/audio/topics/a.mp3')).toBe(
			'pause',
		);
		expect(listPlayerAction({ currentSrc: '/audio/topics/a.mp3', paused: true }, '/audio/topics/a.mp3')).toBe(
			'play',
		);
	});
});
