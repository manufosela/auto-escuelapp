// Panel de acceso (AUT-TSK-0034): el administrador aprueba o rechaza las
// solicitudes y quita el acceso. Solo se muestra a cuentas en admins; las
// reglas de Firestore lo exigen igualmente en cada lectura y escritura.
import { css, html, LitElement } from 'lit';
import {
	approveRequest,
	isAdminUser,
	listAccessRequests,
	listAllowedUsers,
	rejectRequest,
	revokeAccess,
} from '../lib/access-admin.js';
import { onAuthChange } from '../lib/firebase-client.js';

const DATE_FORMAT = new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium', timeStyle: 'short' });

export class AccessAdmin extends LitElement {
	static properties = {
		_state: { state: true },
		_requests: { state: true },
		_users: { state: true },
		_busyUid: { state: true },
		_error: { state: true },
	};

	static styles = css`
		:host {
			display: block;
		}
		section {
			margin-block: 1.5rem;
		}
		h2 {
			font-size: 1.15rem;
			margin: 0 0 0.75rem;
		}
		ul {
			list-style: none;
			margin: 0;
			padding: 0;
			display: grid;
			gap: 0.5rem;
		}
		li {
			display: flex;
			flex-wrap: wrap;
			align-items: center;
			gap: 0.5rem 1rem;
			padding: 0.75rem;
			border: 1px solid var(--color-border, #dde2e8);
			border-radius: 0.5rem;
			background: var(--color-surface, #f3f5f8);
		}
		.who {
			flex: 1 1 12rem;
			min-width: 0;
			overflow-wrap: anywhere;
		}
		.meta {
			display: block;
			font-size: 0.85rem;
			opacity: 0.8;
		}
		.actions {
			display: flex;
			gap: 0.5rem;
		}
		button {
			min-height: 44px;
			padding: 0 1rem;
			border-radius: 0.5rem;
			border: 1px solid var(--color-border, #dde2e8);
			background: var(--color-bg, #ffffff);
			color: inherit;
			font-size: 0.95rem;
		}
		button.primary {
			border-color: var(--color-accent, #154082);
			background: var(--color-accent, #154082);
			color: var(--color-bg, #ffffff);
		}
		button:disabled {
			opacity: 0.5;
		}
		.error {
			color: var(--color-danger, #b3261e);
		}
	`;

	constructor() {
		super();
		// checking | denied | ready
		this._state = 'checking';
		this._requests = [];
		this._users = [];
		this._busyUid = null;
		this._error = null;
		this._uid = null;
		this._unsubscribe = undefined;
	}

	connectedCallback() {
		super.connectedCallback();
		this._unsubscribe = onAuthChange((user) => this._onUser(user));
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		this._unsubscribe?.();
	}

	async _onUser(user) {
		this._uid = user?.uid ?? null;
		if (!user || !(await isAdminUser(user))) {
			this._state = 'denied';
			return;
		}
		this._state = 'ready';
		await this._reload();
	}

	async _reload() {
		[this._requests, this._users] = await Promise.all([listAccessRequests(), listAllowedUsers()]);
	}

	/**
	 * @param {string} uid
	 * @param {() => Promise<void>} action
	 */
	async _run(uid, action) {
		this._busyUid = uid;
		this._error = null;
		try {
			await action();
			await this._reload();
		} catch (error) {
			this._error = 'No se ha podido guardar el cambio. Inténtalo de nuevo.';
			console.error('access-admin: fallo guardando el cambio', error);
		} finally {
			this._busyUid = null;
		}
	}

	_renderRequest(request) {
		const busy = this._busyUid === request.uid;
		const rejected = request.status === 'rejected';
		return html`
			<li>
				<span class="who">
					${request.displayName || request.email}
					<span class="meta">
						${request.email} · ${DATE_FORMAT.format(new Date(request.requestedAt))}
						${rejected ? ' · rechazada' : ''}
					</span>
				</span>
				<span class="actions">
					<button class="primary" ?disabled=${busy} @click=${() => this._run(request.uid, () => approveRequest(request))}>
						Aprobar
					</button>
					${rejected
						? null
						: html`<button ?disabled=${busy} @click=${() => this._run(request.uid, () => rejectRequest(request.uid))}>
								Rechazar
							</button>`}
				</span>
			</li>
		`;
	}

	_renderUser(user) {
		const isSelf = user.uid === this._uid;
		return html`
			<li>
				<span class="who">${user.name}${isSelf ? html`<span class="meta">Tú</span>` : null}</span>
				${isSelf
					? null
					: html`<button ?disabled=${this._busyUid === user.uid} @click=${() => this._run(user.uid, () => revokeAccess(user.uid))}>
							Quitar acceso
						</button>`}
			</li>
		`;
	}

	render() {
		if (this._state === 'checking') return html`<p role="status">Comprobando permisos…</p>`;
		if (this._state === 'denied') return html`<p role="alert">Esta página es solo para el administrador.</p>`;
		return html`
			${this._error ? html`<p role="alert" class="error">${this._error}</p>` : null}
			<section>
				<h2>Solicitudes de acceso</h2>
				${this._requests.length === 0
					? html`<p>No hay solicitudes.</p>`
					: html`<ul>${this._requests.map((request) => this._renderRequest(request))}</ul>`}
			</section>
			<section>
				<h2>Con acceso</h2>
				<ul>${this._users.map((user) => this._renderUser(user))}</ul>
			</section>
		`;
	}
}

customElements.define('access-admin', AccessAdmin);
