// Resumen del progreso: últimos exámenes, racha de aptos y acierto por
// materia. Carga los intentos (Firestore o localStorage) al conectarse.
import { css, html, LitElement } from 'lit';
import { loadAttempts } from '../lib/history-store.js';
import { summarizeAttempts } from '../lib/stats.js';

const SUBJECT_LABELS = {
	1: 'Disposiciones legales (señalización, prioridad, velocidad)',
	2: 'Accidentes: factores y causas',
	3: 'Vigilancia y actitudes hacia otros usuarios',
	4: 'Percepción, alcohol, drogas, fatiga',
	5: 'Distancias de seguridad y frenado',
	6: 'Calzada, meteorología y túneles',
	7: 'La vía',
	8: 'Usuarios vulnerables',
	9: 'Tipo de vehículo y visibilidad',
	10: 'Documentos administrativos',
	11: 'Accidentes y primeros auxilios',
	12: 'Carga y personas transportadas',
	13: 'Precauciones al abandonar el vehículo',
	14: 'Elementos mecánicos de seguridad',
	15: 'Equipos de seguridad',
	16: 'Medio ambiente y conducción eficiente',
};

export class ProgressView extends LitElement {
	static properties = {
		subjectByQuestionId: { attribute: false },
		_summary: { state: true },
	};

	static styles = css`
		:host {
			display: block;
			min-height: 50vh;
		}
		.streak {
			font-size: 1.3rem;
			font-weight: 700;
		}
		.exams {
			list-style: none;
			padding: 0;
			display: flex;
			flex-direction: column;
			gap: 0.35rem;
		}
		.exams li {
			display: flex;
			justify-content: space-between;
			padding: 0.4rem 0.6rem;
			border-radius: 0.4rem;
			background: var(--color-surface, #f3f5f8);
		}
		.pass {
			color: var(--color-success, #1a7f37);
			font-weight: 600;
		}
		.fail {
			color: var(--color-danger, #b3261e);
			font-weight: 600;
		}
		.subject-row {
			display: flex;
			justify-content: space-between;
			gap: 0.5rem;
			padding: 0.3rem 0;
			border-bottom: 1px solid var(--color-border, #dde2e8);
		}
	`;

	constructor() {
		super();
		/** @type {Map<string, number>} */
		this.subjectByQuestionId = new Map();
		this._summary = null;
		this._loaded = false;
	}

	updated(changed) {
		// subjectByQuestionId llega en un <script> posterior al primero (ver
		// la página): se espera a que tenga contenido antes de calcular el
		// resumen, igual que exam-runner/practice-runner esperan `questions`.
		if (!this._loaded && changed.has('subjectByQuestionId') && this.subjectByQuestionId.size > 0) {
			this._loaded = true;
			this._load();
		}
	}

	async _load() {
		const attempts = await loadAttempts();
		this._summary = summarizeAttempts(attempts, this.subjectByQuestionId);
	}

	render() {
		if (!this._summary) return html`<p>Cargando progreso…</p>`;
		if (this._summary.totalAttempts === 0) {
			return html`<p>
				Todavía no has hecho ningún test.
				<a href="/practica/examen/">Empieza un examen</a> o
				<a href="/practica/">practica por tema</a>.
			</p>`;
		}
		return html`
			<p class="streak">
				Racha actual: ${this._summary.currentPassStreak} apto${this._summary.currentPassStreak === 1 ? '' : 's'} seguido${this._summary.currentPassStreak === 1 ? '' : 's'}
			</p>
			<h2>Últimos exámenes</h2>
			${this._summary.lastExams.length === 0
				? html`<p>Todavía no has hecho ningún examen completo.</p>`
				: html`<ul class="exams">
						${this._summary.lastExams.map(
							(exam) => html`
								<li>
									<span>${new Date(exam.finishedAt).toLocaleDateString('es-ES')}</span>
									<span class=${exam.passed ? 'pass' : 'fail'}
										>${exam.passed ? 'APTO' : 'NO APTO'}</span
									>
								</li>
							`,
						)}
					</ul>`}
			<h2>Acierto por materia</h2>
			${this._summary.accuracyBySubject.length === 0
				? html`<p>Todavía no hay suficientes respuestas para desglosar por materia.</p>`
				: this._summary.accuracyBySubject.map(
						(entry) => html`
							<div class="subject-row">
								<span>${SUBJECT_LABELS[entry.subject] ?? `Materia ${entry.subject}`}</span>
								<span>${Math.round(entry.ratio * 100)}% (${entry.correct}/${entry.total})</span>
							</div>
						`,
					)}
		`;
	}
}

customElements.define('progress-view', ProgressView);
