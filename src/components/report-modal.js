// Modal propio para reportar una pregunta defectuosa (nunca prompt()/confirm()
// nativos). Emite un evento `report-submit` con el motivo elegido, o
// `report-cancel` si se cierra sin enviar.
import { css, html, LitElement } from 'lit';

const REASONS = [
	{ value: 'wrong_answer', label: 'La respuesta marcada como correcta no lo es' },
	{ value: 'unclear', label: 'El enunciado es confuso o ambiguo' },
	{ value: 'outdated', label: 'La normativa ha cambiado' },
	{ value: 'other', label: 'Otro motivo' },
];

export class ReportModal extends LitElement {
	static properties = {
		open: { type: Boolean, reflect: true },
		_reason: { state: true },
	};

	static styles = css`
		:host([open]) {
			position: fixed;
			inset: 0;
			display: flex;
			align-items: flex-end;
			justify-content: center;
			background: rgba(0, 0, 0, 0.5);
			z-index: 100;
		}
		:host(:not([open])) {
			display: none;
		}
		.sheet {
			width: 100%;
			max-width: 480px;
			background: var(--color-bg, #fff);
			color: var(--color-text, #1a1a1a);
			border-radius: 1rem 1rem 0 0;
			padding: 1rem;
		}
		fieldset {
			border: none;
			padding: 0;
			margin: 0 0 1rem;
		}
		label {
			display: flex;
			align-items: center;
			gap: 0.5rem;
			min-height: 44px;
		}
		.actions {
			display: flex;
			gap: 0.5rem;
		}
		.actions button {
			flex: 1;
			min-height: 44px;
			border-radius: 0.5rem;
			border: 1px solid var(--color-border, #dde2e8);
			background: var(--color-surface, #f3f5f8);
			color: inherit;
			font-size: 1rem;
		}
		.actions button.confirm {
			background: #154082;
			color: #fff;
			border-color: #154082;
		}
		.actions button:disabled {
			opacity: 0.5;
		}
	`;

	constructor() {
		super();
		this.open = false;
		this._reason = null;
	}

	_cancel() {
		this.open = false;
		this._reason = null;
		this.dispatchEvent(new CustomEvent('report-cancel'));
	}

	_confirm() {
		if (!this._reason) return;
		this.dispatchEvent(new CustomEvent('report-submit', { detail: { reason: this._reason } }));
		this.open = false;
		this._reason = null;
	}

	render() {
		if (!this.open) return null;
		return html`
			<div class="sheet" role="dialog" aria-modal="true" aria-label="Reportar pregunta">
				<h2>¿Qué falla en esta pregunta?</h2>
				<fieldset>
					${REASONS.map(
						(reason) => html`
							<label>
								<input
									type="radio"
									name="report-reason"
									value=${reason.value}
									@change=${() => (this._reason = reason.value)}
								/>
								${reason.label}
							</label>
						`,
					)}
				</fieldset>
				<div class="actions">
					<button @click=${() => this._cancel()}>Cancelar</button>
					<button class="confirm" ?disabled=${!this._reason} @click=${() => this._confirm()}>
						Enviar
					</button>
				</div>
			</div>
		`;
	}
}

customElements.define('report-modal', ReportModal);
