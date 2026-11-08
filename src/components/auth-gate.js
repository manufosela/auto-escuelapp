// Puerta de acceso (AUT-TSK-0032): sin una cuenta autorizada solo se ve la
// pantalla de entrada. El HTML se sirve con los elementos
// [data-requires-access] ocultos y esta puerta los muestra al confirmar el
// acceso.
import { css, html, LitElement } from 'lit';
import { accessView } from '../lib/access-view.js';
import { onAccessChange, signInWithGoogle } from '../lib/firebase-client.js';

export class AuthGate extends LitElement {
	static properties = {
		_access: { state: true },
		_error: { state: true },
	};

	static styles = css`
		:host {
			display: block;
			padding-inline: 1rem;
		}
		.panel {
			max-width: 24rem;
			margin: 3rem auto;
			padding: 1.5rem;
			text-align: center;
			border: 1px solid var(--color-border, #dde2e8);
			border-radius: 0.75rem;
			background: var(--color-surface, #f3f5f8);
		}
		h1 {
			margin: 0 0 0.5rem;
			font-size: 1.4rem;
			color: var(--color-accent, #154082);
		}
		p {
			margin: 0 0 1.25rem;
		}
		button {
			min-height: 44px;
			padding: 0 1.25rem;
			border-radius: 0.5rem;
			border: 1px solid var(--color-accent, #154082);
			background: var(--color-accent, #154082);
			/* El fondo de la página contrasta con el acento en ambos temas. */
			color: var(--color-bg, #ffffff);
			font-size: 1rem;
		}
		.error {
			margin: 1rem 0 0;
			color: var(--color-danger, #b3261e);
		}
	`;

	constructor() {
		super();
		this._access = undefined;
		this._error = null;
		this._unsubscribe = undefined;
	}

	connectedCallback() {
		super.connectedCallback();
		this._unsubscribe = onAccessChange((access) => {
			this._access = access;
			const { showApp } = accessView(access);
			for (const element of document.querySelectorAll('[data-requires-access]')) {
				element.hidden = !showApp;
			}
		});
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		this._unsubscribe?.();
	}

	async _signIn() {
		this._error = null;
		try {
			await signInWithGoogle();
		} catch (error) {
			this._error = 'No se ha podido iniciar sesión. Inténtalo de nuevo.';
			console.error('auth-gate: fallo al iniciar sesión', error);
		}
	}

	render() {
		const { screen } = accessView(this._access);
		if (screen === null) return null;
		if (screen === 'checking') {
			return html`<div class="panel" role="status"><p>Comprobando acceso…</p></div>`;
		}
		const denied = screen === 'denied';
		return html`
			<div class="panel">
				<h1>auto-escuelapp</h1>
				<p role=${denied ? 'alert' : 'status'}>
					${denied
						? 'Esta cuenta no tiene acceso a la app.'
						: 'Entra con tu cuenta de Google para usar la app.'}
				</p>
				<button @click=${() => this._signIn()}>
					${denied ? 'Entrar con otra cuenta' : 'Entrar con Google'}
				</button>
				${this._error ? html`<p role="alert" class="error">${this._error}</p>` : null}
			</div>
		`;
	}
}

customElements.define('auth-gate', AuthGate);
