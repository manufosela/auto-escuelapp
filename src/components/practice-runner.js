// Práctica por tema: corrección inmediata tras cada respuesta (a diferencia
// del examen, que corrige solo al final) y opción de repetir solo lo fallado.
import { css, html, LitElement } from 'lit';
import { selectTopicQuestions } from '../lib/practice-selection.js';
import { shuffle } from '../lib/exam-selection.js';

const SIZE_OPTIONS = [10, 20, 30];

export class PracticeRunner extends LitElement {
	static properties = {
		questions: { attribute: false },
		subjects: { attribute: false },
		_pool: { state: true },
		_current: { state: true },
		_index: { state: true },
		_selectedOption: { state: true },
		_failed: { state: true },
		_correctCount: { state: true },
		_phase: { state: true }, // 'picker' | 'running' | 'summary'
	};

	static styles = css`
		:host {
			display: block;
			/* Reserva espacio mientras llegan questions/subjects (se asignan
			   tras el primer render): evita un salto de layout grande. */
			min-height: 50vh;
		}
		.sizes {
			display: flex;
			gap: 0.5rem;
			flex-wrap: wrap;
		}
		.sizes button {
			flex: 1;
			min-height: 44px;
			border-radius: 0.5rem;
			border: 1px solid var(--color-border, #dde2e8);
			background: var(--color-surface, #f3f5f8);
			color: inherit;
			font-size: 1rem;
		}
		.statement {
			font-size: 1.1rem;
			font-weight: 600;
		}
		.options {
			display: flex;
			flex-direction: column;
			gap: 0.5rem;
			margin: 0.75rem 0;
		}
		.options button {
			width: 100%;
			text-align: left;
			padding: 0.75rem;
			min-height: 44px;
			border-radius: 0.5rem;
			border: 1px solid var(--color-border, #dde2e8);
			background: var(--color-surface, #f3f5f8);
			color: inherit;
			font-size: 1rem;
		}
		.options button.correct {
			border-color: #1a7f37;
			outline: 2px solid #1a7f37;
		}
		.options button.incorrect {
			border-color: #b3261e;
			outline: 2px solid #b3261e;
		}
		.feedback {
			padding: 0.75rem;
			border-radius: 0.5rem;
			margin-bottom: 0.75rem;
		}
		.feedback.correct {
			background: rgba(26, 127, 55, 0.12);
		}
		.feedback.incorrect {
			background: rgba(179, 38, 30, 0.12);
		}
		.next {
			width: 100%;
			min-height: 44px;
			border-radius: 0.5rem;
			border: none;
			background: #154082;
			color: #fff;
			font-size: 1rem;
		}
		.next:disabled {
			opacity: 0.5;
		}
	`;

	constructor() {
		super();
		/** @type {Array<Record<string, unknown>>} */
		this.questions = [];
		/** @type {number[]} */
		this.subjects = [];
		this._phase = 'picker';
		this._pool = [];
		this._current = [];
		this._index = 0;
		this._selectedOption = null;
		this._failed = [];
		this._correctCount = 0;
	}

	_availableCount() {
		return selectTopicQuestions(this.questions, this.subjects, Infinity, new Date()).length;
	}

	_start(size) {
		this._current = selectTopicQuestions(this.questions, this.subjects, size, new Date());
		this._index = 0;
		this._selectedOption = null;
		this._failed = [];
		this._correctCount = 0;
		this._phase = 'running';
	}

	_retryFailed() {
		this._current = shuffle(this._failed);
		this._index = 0;
		this._selectedOption = null;
		this._failed = [];
		this._correctCount = 0;
		this._phase = 'running';
	}

	_answer(optionIndex) {
		if (this._selectedOption !== null) return; // ya respondida, ver explicación
		this._selectedOption = optionIndex;
		const question = this._current[this._index];
		if (optionIndex === question.correctIndex) {
			this._correctCount += 1;
		} else {
			this._failed = [...this._failed, question];
		}
	}

	_next() {
		if (this._index + 1 >= this._current.length) {
			this._phase = 'summary';
			return;
		}
		this._index += 1;
		this._selectedOption = null;
	}

	render() {
		if (this._phase === 'picker') return this._renderPicker();
		if (this._phase === 'summary') return this._renderSummary();
		return this._renderQuestion();
	}

	_renderPicker() {
		const available = this._availableCount();
		if (available === 0) {
			return html`<p role="alert">No hay preguntas vigentes para este tema todavía.</p>`;
		}
		// Sin duplicar botones cuando el tema tiene menos preguntas que el
		// tamaño más pequeño ofrecido (p. ej. solo 3 disponibles: un botón).
		const sizes = [...new Set(SIZE_OPTIONS.map((size) => Math.min(size, available)))];
		return html`
			<p>¿Cuántas preguntas quieres practicar? (${available} disponibles)</p>
			<div class="sizes">
				${sizes.map((size) => html`<button @click=${() => this._start(size)}>${size}</button>`)}
			</div>
		`;
	}

	_renderQuestion() {
		const question = this._current[this._index];
		const answered = this._selectedOption !== null;
		return html`
			<p class="statement">${this._index + 1} / ${this._current.length}. ${question.statement}</p>
			<div class="options">
				${question.options.map((option, i) => {
					let cls = '';
					if (answered && i === question.correctIndex) cls = 'correct';
					else if (answered && i === this._selectedOption) cls = 'incorrect';
					return html`<button
						class=${cls}
						?disabled=${answered}
						@click=${() => this._answer(i)}
					>
						${option}
					</button>`;
				})}
			</div>
			${answered
				? html`
						<div class="feedback ${this._selectedOption === question.correctIndex ? 'correct' : 'incorrect'}">
							<p>
								${this._selectedOption === question.correctIndex ? '✓ Correcto.' : '✗ Incorrecto.'}
								Respuesta correcta: ${question.options[question.correctIndex]}
							</p>
							<p>${question.explanation}</p>
						</div>
					`
				: null}
			<button class="next" ?disabled=${!answered} @click=${() => this._next()}>
				${this._index + 1 >= this._current.length ? 'Ver resumen' : 'Siguiente'}
			</button>
		`;
	}

	_renderSummary() {
		const total = this._correctCount + this._failed.length;
		return html`
			<p class="statement">Aciertos: ${this._correctCount} de ${total}</p>
			${this._failed.length > 0
				? html`<button class="next" @click=${() => this._retryFailed()}>
						Repetir ${this._failed.length} fallada${this._failed.length === 1 ? '' : 's'}
					</button>`
				: html`<p>¡Sin fallos!</p>`}
			<button class="next" @click=${() => (this._phase = 'picker')}>Elegir otro tamaño</button>
		`;
	}
}

customElements.define('practice-runner', PracticeRunner);
