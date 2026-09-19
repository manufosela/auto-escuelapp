// Simulacro de examen fiel al formato oficial: una pregunta por pantalla,
// rejilla 01-30 con solo dos estados (contestada/no contestada), cuenta
// atrás y corrección al finalizar. Ver docs/research/formato-examen-y-preguntas.md.
import { css, html, LitElement } from 'lit';
import { EXAM_RULES, isPassingResult } from '../lib/exam-rules.js';
import { selectExamQuestions } from '../lib/exam-selection.js';
import {
	answerQuestion,
	correctExam,
	countUnanswered,
	createExamSession,
	goToQuestion,
} from '../lib/exam-session.js';

const STORAGE_KEY = 'auto-escuelapp:exam-session:v1';

function loadStoredSession() {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? JSON.parse(raw) : null;
	} catch {
		return null;
	}
}

function saveSession(session) {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
	} catch {
		// almacenamiento no disponible (privado/lleno): el examen sigue
		// funcionando en memoria, solo se pierde la recuperación tras recargar.
	}
}

function clearStoredSession() {
	try {
		localStorage.removeItem(STORAGE_KEY);
	} catch {
		/* ver saveSession */
	}
}

export class ExamRunner extends LitElement {
	static properties = {
		questions: { attribute: false },
		licence: { type: String },
		_session: { state: true },
		_secondsLeft: { state: true },
		_finished: { state: true },
	};

	static styles = css`
		:host {
			display: block;
		}
		.timer {
			font-weight: 600;
			font-variant-numeric: tabular-nums;
		}
		.timer.low {
			color: #b3261e;
		}
		.statement {
			font-size: 1.1rem;
			font-weight: 600;
		}
		.options {
			list-style: none;
			margin: 0;
			padding: 0;
			display: flex;
			flex-direction: column;
			gap: 0.5rem;
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
		.options button[aria-checked='true'] {
			border-color: var(--color-accent, #154082);
			outline: 2px solid var(--color-accent, #154082);
		}
		.grid {
			display: grid;
			grid-template-columns: repeat(6, 1fr);
			gap: 0.35rem;
			margin: 1rem 0;
		}
		.grid button {
			min-height: 40px;
			border-radius: 0.35rem;
			border: 1px solid var(--color-border, #dde2e8);
			background: var(--color-bg, #fff);
			color: inherit;
			font-variant-numeric: tabular-nums;
		}
		.grid button.answered {
			background: var(--color-surface, #f3f5f8);
			font-weight: 700;
		}
		.grid button[aria-current='step'] {
			outline: 2px solid var(--color-accent, #154082);
		}
		.controls {
			display: flex;
			gap: 0.5rem;
			flex-wrap: wrap;
		}
		.controls button {
			flex: 1;
			min-height: 44px;
			border-radius: 0.5rem;
			border: 1px solid var(--color-border, #dde2e8);
			background: var(--color-surface, #f3f5f8);
			color: inherit;
		}
		.controls button.finish {
			/* Color fijo (no var(--color-accent)): en modo oscuro esa variable
			   es un azul claro pensado para texto sobre fondo oscuro, no para
			   fondo bajo texto blanco (contraste insuficiente, detectado con
			   Lighthouse). Este azul marino cumple 4.5:1 en ambos temas. */
			background: #154082;
			color: #fff;
			border-color: #154082;
		}
		.controls button:disabled {
			opacity: 0.5;
		}
		.result-header {
			font-size: 1.3rem;
			font-weight: 700;
		}
		.result-header.pass {
			color: #1a7f37;
		}
		.result-header.fail {
			color: #b3261e;
		}
		details {
			border: 1px solid var(--color-border, #dde2e8);
			border-radius: 0.5rem;
			padding: 0.5rem 0.75rem;
			margin-bottom: 0.5rem;
		}
		details[open] summary {
			margin-bottom: 0.5rem;
		}
		.tag-correct {
			color: #1a7f37;
		}
		.tag-incorrect {
			color: #b3261e;
		}
		.visually-hidden {
			position: absolute;
			width: 1px;
			height: 1px;
			overflow: hidden;
			clip: rect(0, 0, 0, 0);
			white-space: nowrap;
		}
	`;

	constructor() {
		super();
		/** @type {Array<Record<string, unknown>>} */
		this.questions = [];
		this.licence = 'B';
		this._session = null;
		this._secondsLeft = 0;
		this._finished = false;
		/** @type {number|undefined} */
		this._timerId = undefined;
	}

	connectedCallback() {
		super.connectedCallback();
		if (this.questions.length > 0) this._start();
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		clearInterval(this._timerId);
	}

	updated(changed) {
		if (changed.has('questions') && this.questions.length > 0 && !this._session) {
			this._start();
		}
	}

	_start() {
		const stored = loadStoredSession();
		// Una sesión guardada es reanudable si todas sus preguntas siguen
		// existiendo en el banco actual (no hace falta que conserven el mismo
		// orden: el orden guardado en `stored` YA es el subconjunto barajado
		// de una sesión anterior, no el banco completo).
		const currentStatements = new Set(this.questions.map((q) => q.statement));
		const isResumable =
			!!stored && stored.questions.every((q) => currentStatements.has(q.statement));
		this._session = isResumable
			? stored
			: createExamSession(
					selectExamQuestions(this.questions, EXAM_RULES[this.licence].questionCount, new Date()),
				);
		if (!isResumable) saveSession(this._session);
		this._tick();
		this._timerId = setInterval(() => this._tick(), 1000);
	}

	_tick() {
		const rules = EXAM_RULES[this.licence];
		const elapsedMs = Date.now() - new Date(this._session.startedAt).getTime();
		const secondsLeft = Math.max(0, rules.minutes * 60 - Math.floor(elapsedMs / 1000));
		this._secondsLeft = secondsLeft;
		if (secondsLeft === 0 && !this._finished) this._finish();
	}

	_answer(optionIndex) {
		this._session = answerQuestion(this._session, this._session.currentIndex, optionIndex);
		saveSession(this._session);
	}

	_goTo(index) {
		this._session = goToQuestion(this._session, index);
		saveSession(this._session);
	}

	_finish() {
		clearInterval(this._timerId);
		this._finished = true;
		clearStoredSession();
	}

	_restart() {
		clearStoredSession();
		this._finished = false;
		this._session = createExamSession(
			selectExamQuestions(this.questions, EXAM_RULES[this.licence].questionCount, new Date()),
		);
		saveSession(this._session);
		this._tick();
		this._timerId = setInterval(() => this._tick(), 1000);
	}

	_formatTime() {
		const minutes = Math.floor(this._secondsLeft / 60);
		const seconds = this._secondsLeft % 60;
		return `${minutes}:${String(seconds).padStart(2, '0')}`;
	}

	render() {
		if (!this._session) return html`<p>Cargando examen…</p>`;
		if (this._session.questions.length === 0) {
			return html`<p role="alert">
				No hay preguntas vigentes disponibles para generar el examen.
			</p>`;
		}
		if (this._finished) return this._renderResults();
		return this._renderQuestion();
	}

	_renderQuestion() {
		const session = this._session;
		const question = session.questions[session.currentIndex];
		const total = session.questions.length;
		const given = session.answers[session.currentIndex];

		return html`
			<p class="timer ${this._secondsLeft <= 60 ? 'low' : ''}" aria-live="polite">
				Tiempo restante: ${this._formatTime()}
			</p>
			<p class="statement">${session.currentIndex + 1}. ${question.statement}</p>
			<div class="options" role="radiogroup" aria-label="Opciones de respuesta">
				${question.options.map(
					(option, i) => html`
						<button role="radio" aria-checked=${given === i} @click=${() => this._answer(i)}>
							${option}
						</button>
					`,
				)}
			</div>
			<nav class="grid" aria-label="Preguntas del examen">
				${session.questions.map(
					(_, i) => html`
						<button
							class=${session.answers[i] !== null ? 'answered' : ''}
							aria-current=${i === session.currentIndex ? 'step' : 'false'}
							@click=${() => this._goTo(i)}
						>
							${String(i + 1).padStart(2, '0')}
							<span class="visually-hidden"
								>${session.answers[i] !== null ? ', contestada' : ', no contestada'}</span
							>
						</button>
					`,
				)}
			</nav>
			<div class="controls">
				<button
					?disabled=${session.currentIndex === 0}
					@click=${() => this._goTo(session.currentIndex - 1)}
				>
					Anterior
				</button>
				<button
					?disabled=${session.currentIndex === total - 1}
					@click=${() => this._goTo(session.currentIndex + 1)}
				>
					Siguiente
				</button>
				<button class="finish" @click=${() => this._finish()}>
					Finalizar (${countUnanswered(session)} sin contestar)
				</button>
			</div>
		`;
	}

	_renderResults() {
		const { results, failures } = correctExam(this._session);
		const passed = isPassingResult(failures, this.licence);
		return html`
			<p class="result-header ${passed ? 'pass' : 'fail'}">
				${passed ? 'APTO' : 'NO APTO'} — ${failures} fallo${failures === 1 ? '' : 's'} de
				${results.length}
			</p>
			${results.map(
				(result, i) => html`
					<details>
						<summary class=${result.isCorrect ? 'tag-correct' : 'tag-incorrect'}>
							${i + 1}. ${result.isCorrect ? 'Correcta' : 'Incorrecta'} — ${result.question.statement}
						</summary>
						<p>
							Tu respuesta:
							${result.givenIndex === null
								? 'en blanco'
								: result.question.options[result.givenIndex]}
						</p>
						<p>Respuesta correcta: ${result.question.options[result.question.correctIndex]}</p>
						<p>${result.question.explanation}</p>
					</details>
				`,
			)}
			<div class="controls">
				<button class="finish" @click=${() => this._restart()}>Nuevo examen</button>
			</div>
		`;
	}
}

customElements.define('exam-runner', ExamRunner);
