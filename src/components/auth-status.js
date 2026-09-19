// Estado de sesión en el header: botón de entrar/salir con Google.
import { css, html, LitElement } from 'lit';
import { onAuthChange, signInWithGoogle, signOutUser } from '../lib/firebase-client.js';

export class AuthStatus extends LitElement {
	static properties = {
		_user: { state: true },
		_error: { state: true },
	};

	static styles = css`
		:host {
			display: block;
			position: relative;
		}
		button {
			min-height: 36px;
			padding: 0 0.75rem;
			border-radius: 0.5rem;
			border: 1px solid var(--color-border, #dde2e8);
			background: var(--color-surface, #f3f5f8);
			color: inherit;
			font-size: 0.85rem;
		}
		.user {
			display: flex;
			align-items: center;
			gap: 0.5rem;
			font-size: 0.85rem;
		}
		.name {
			max-width: 10rem;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
		.error {
			position: absolute;
			right: 1rem;
			margin: 0.25rem 0 0;
			font-size: 0.75rem;
			color: var(--color-danger, #b3261e);
		}
	`;

	constructor() {
		super();
		// undefined: todavía no se sabe. null: sin sesión. objeto: con sesión.
		this._user = undefined;
		this._unsubscribe = undefined;
		this._error = null;
	}

	async _signIn() {
		this._error = null;
		try {
			await signInWithGoogle();
		} catch (error) {
			this._error = 'No se ha podido iniciar sesión. Inténtalo de nuevo.';
			console.error('auth-status: fallo al iniciar sesión', error);
		}
	}

	connectedCallback() {
		super.connectedCallback();
		this._unsubscribe = onAuthChange((user) => {
			this._user = user;
		});
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		this._unsubscribe?.();
	}

	render() {
		if (this._user === undefined) return null;
		if (this._user === null) {
			return html`
				<button @click=${() => this._signIn()}>Entrar con Google</button>
				${this._error ? html`<p role="alert" class="error">${this._error}</p>` : null}
			`;
		}
		return html`
			<div class="user">
				<span class="name">${this._user.displayName ?? this._user.email}</span>
				<button @click=${() => signOutUser()}>Salir</button>
			</div>
		`;
	}
}

customElements.define('auth-status', AuthStatus);
