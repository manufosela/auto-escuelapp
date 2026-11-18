// Reproductor único del índice del temario (AUT-TSK-0040): qué hacer al
// pulsar el play de un tema según lo que tenga ya el reproductor.

/**
 * @param {{ currentSrc: string, paused: boolean }} player
 * @param {string} clickedSrc audio del tema pulsado
 * @returns {'load' | 'pause' | 'play'}
 */
export function listPlayerAction({ currentSrc, paused }, clickedSrc) {
	if (currentSrc !== clickedSrc) return 'load';
	return paused ? 'play' : 'pause';
}
