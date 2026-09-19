// Estado puro de un mazo de fichas: avanzar, clasificar como "la sé" o "no
// la sé" y consultar el resumen final.

/**
 * @typedef {{ index: number, cards: unknown[], known: unknown[], unknown: unknown[] }} DeckState
 */

/**
 * @param {unknown[]} cards
 * @returns {DeckState}
 */
export function createDeck(cards) {
	return { index: 0, cards, known: [], unknown: [] };
}

/** @param {DeckState} deck */
export function isDeckFinished(deck) {
	return deck.index >= deck.cards.length;
}

/**
 * @param {DeckState} deck
 * @param {boolean} knewIt
 * @returns {DeckState}
 */
export function markCard(deck, knewIt) {
	if (isDeckFinished(deck)) {
		throw new Error('No quedan fichas por clasificar');
	}
	const card = deck.cards[deck.index];
	return {
		...deck,
		index: deck.index + 1,
		known: knewIt ? [...deck.known, card] : deck.known,
		unknown: knewIt ? deck.unknown : [...deck.unknown, card],
	};
}
