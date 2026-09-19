import { describe, expect, it } from 'vitest';
import { createDeck, isDeckFinished, markCard } from './flashcard-deck.js';

describe('createDeck', () => {
	it('empieza en la primera ficha sin clasificar nada', () => {
		const deck = createDeck(['a', 'b']);
		expect(deck.index).toBe(0);
		expect(deck.known).toEqual([]);
		expect(deck.unknown).toEqual([]);
	});
});

describe('isDeckFinished', () => {
	it('no ha terminado con fichas pendientes', () => {
		expect(isDeckFinished(createDeck(['a']))).toBe(false);
	});

	it('termina cuando el índice alcanza el total', () => {
		let deck = createDeck(['a']);
		deck = markCard(deck, true);
		expect(isDeckFinished(deck)).toBe(true);
	});
});

describe('markCard', () => {
	it('clasifica en "known" sin mutar el mazo original', () => {
		const deck = createDeck(['a', 'b']);
		const next = markCard(deck, true);
		expect(next.known).toEqual(['a']);
		expect(next.unknown).toEqual([]);
		expect(next.index).toBe(1);
		expect(deck.index).toBe(0);
	});

	it('clasifica en "unknown"', () => {
		const deck = createDeck(['a']);
		const next = markCard(deck, false);
		expect(next.unknown).toEqual(['a']);
		expect(next.known).toEqual([]);
	});

	it('rechaza clasificar cuando el mazo ya ha terminado', () => {
		let deck = createDeck(['a']);
		deck = markCard(deck, true);
		expect(() => markCard(deck, true)).toThrow(/no quedan fichas/i);
	});
});
