// Sesión en el header: nombre y botón de salir. Entrar lo ofrece auth-gate.
import { css, html, LitElement } from 'lit';
import { onAuthChange, signOutUser } from '../lib/firebase-client.js';

export class AuthStatus extends LitElement {
	static properties = {
		_user: { state: true },
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
	`;

	constructor() {
		super();
		// undefined: todavía no se sabe. null: sin sesión. objeto: con sesión.
		this._user = undefined;
		this._unsubscribe = undefined;
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
		// Sin sesión autorizada la entrada la ofrece auth-gate (AUT-TSK-0032).
		if (!this._user) return null;
		return html`
			<div class="user">
				<span class="name">${this._user.displayName ?? this._user.email}</span>
				<button @click=${() => signOutUser()}>Salir</button>
			</div>
		`;
	}
}

customElements.define('auth-status', AuthStatus);
