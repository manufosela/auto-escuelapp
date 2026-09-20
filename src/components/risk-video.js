// Vídeo de percepción de riesgo (Anexo VI.B.1 del RD 818/2009, AUT-TSK-0022):
// se debe ver al menos una vez antes de la pregunta, con un máximo de
// visualizaciones. Al terminar de verse por primera vez, emite
// `video-watched` con su duración real, para que quien lo use (p. ej. el
// examen) pueda ampliar su cronómetro por ese tiempo. `video-continue` se
// emite al pulsar "Ver pregunta".
import { css, html, LitElement } from 'lit';

export class RiskVideo extends LitElement {
	static properties = {
		videoUrl: { type: String, attribute: 'video-url' },
		maxViews: { type: Number, attribute: 'max-views' },
		_viewsUsed: { state: true },
		_hasPlayed: { state: true },
	};

	static styles = css`
		:host {
			display: block;
		}
		video {
			display: block;
			width: 100%;
			border-radius: 0.5rem;
			background: #000;
		}
		.controls {
			display: flex;
			gap: 0.5rem;
			margin-top: 0.75rem;
			flex-wrap: wrap;
		}
		button {
			flex: 1;
			min-height: 44px;
			border-radius: 0.5rem;
			border: 1px solid var(--color-border, #dde2e8);
			background: var(--color-surface, #f3f5f8);
			color: inherit;
			font-size: 1rem;
		}
		button.primary {
			background: #154082;
			color: #fff;
			border-color: #154082;
		}
	`;

	constructor() {
		super();
		this.videoUrl = '';
		this.maxViews = 3;
		this._viewsUsed = 0;
		this._hasPlayed = false;
	}

	_play() {
		const video = this.renderRoot.querySelector('video');
		video.currentTime = 0;
		video.play();
	}

	_onEnded() {
		this._viewsUsed += 1;
		if (this._hasPlayed) return;
		this._hasPlayed = true;
		const video = this.renderRoot.querySelector('video');
		this.dispatchEvent(
			new CustomEvent('video-watched', { detail: { durationSeconds: video.duration || 0 } }),
		);
	}

	_continue() {
		this.dispatchEvent(new CustomEvent('video-continue'));
	}

	render() {
		const remaining = this.maxViews - this._viewsUsed;
		return html`
			<video src=${this.videoUrl} playsinline @ended=${() => this._onEnded()}></video>
			<div class="controls">
				${!this._hasPlayed
					? html`<button class="primary" @click=${() => this._play()}>Reproducir</button>`
					: html`
							${remaining > 0
								? html`<button @click=${() => this._play()}>
										Volver a ver (quedan ${remaining})
									</button>`
								: null}
							<button class="primary" @click=${() => this._continue()}>Ver pregunta</button>
						`}
			</div>
		`;
	}
}

customElements.define('risk-video', RiskVideo);
