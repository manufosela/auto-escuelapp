// Fichas de repaso: anverso/reverso que se gira con un toque, clasificación
// en "la sé" / "no la sé" y resumen final.
import { css, html, LitElement } from 'lit';
import { createDeck, isDeckFinished, markCard } from '../lib/flashcard-deck.js';

export class FlashcardDeck extends LitElement {
	static properties = {
		cards: { attribute: false },
		_deck: { state: true },
		_flipped: { state: true },
	};

	static styles = css`
		:host {
			display: block;
			min-height: 50vh;
		}
		.card {
			min-height: 180px;
			border-radius: 0.75rem;
			border: 1px solid var(--color-border, #dde2e8);
			background: var(--color-surface, #f3f5f8);
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 1.5rem;
			text-align: center;
			font-size: 1.1rem;
			cursor: pointer;
		}
		.card .hint {
			display: block;
			margin-top: 0.75rem;
			font-size: 0.75rem;
			opacity: 0.6;
		}
		.actions {
			display: flex;
			gap: 0.5rem;
			margin-top: 1rem;
		}
		.actions button {
			flex: 1;
			min-height: 44px;
			border-radius: 0.5rem;
			border: 1px solid var(--color-border, #dde2e8);
			background: var(--color-bg, #fff);
			color: inherit;
			font-size: 1rem;
		}
		.actions button.know {
			border-color: var(--color-success, #1a7f37);
			color: var(--color-success, #1a7f37);
		}
		.actions button.dont-know {
			border-color: var(--color-danger, #b3261e);
			color: var(--color-danger, #b3261e);
		}
		.progress {
			margin-bottom: 0.5rem;
			font-size: 0.85rem;
			opacity: 0.7;
		}
		.restart {
			width: 100%;
			min-height: 44px;
			border-radius: 0.5rem;
			border: none;
			background: #154082;
			color: #fff;
			font-size: 1rem;
			margin-top: 0.75rem;
		}
	`;

	constructor() {
		super();
		/** @type {Array<{ front: string, back: string }>} */
		this.cards = [];
		this._deck = null;
		this._flipped = false;
	}

	updated(changed) {
		if (changed.has('cards') && this.cards.length > 0 && !this._deck) {
			this._deck = createDeck(this.cards);
		}
	}

	_flip() {
		this._flipped = !this._flipped;
	}

	_mark(knewIt) {
		this._deck = markCard(this._deck, knewIt);
		this._flipped = false;
	}

	_restart() {
		this._deck = createDeck(this.cards);
		this._flipped = false;
	}

	render() {
		if (this.cards.length === 0) return html`<p role="alert">No hay fichas para este tema todavía.</p>`;
		if (!this._deck) return html`<p>Cargando fichas…</p>`;
		if (isDeckFinished(this._deck)) return this._renderSummary();
		return this._renderCard();
	}

	_renderCard() {
		const card = this._deck.cards[this._deck.index];
		return html`
			<p class="progress">${this._deck.index + 1} / ${this._deck.cards.length}</p>
			<div
				class="card"
				role="button"
				tabindex="0"
				@click=${() => this._flip()}
				@keydown=${(event) => {
					if (event.key === 'Enter' || event.key === ' ') {
						event.preventDefault();
						this._flip();
					}
				}}
			>
				<div>
					${this._flipped ? card.back : card.front}
					<span class="hint">${this._flipped ? 'Toca para ver la pregunta' : 'Toca para ver la respuesta'}</span>
				</div>
			</div>
			<div class="actions">
				<button class="dont-know" @click=${() => this._mark(false)}>No la sé</button>
				<button class="know" @click=${() => this._mark(true)}>La sé</button>
			</div>
		`;
	}

	_renderSummary() {
		const { known, unknown } = this._deck;
		return html`
			<p>Sabidas: ${known.length} de ${known.length + unknown.length}</p>
			<button class="restart" @click=${() => this._restart()}>Repasar de nuevo</button>
		`;
	}
}

customElements.define('flashcard-deck', FlashcardDeck);
