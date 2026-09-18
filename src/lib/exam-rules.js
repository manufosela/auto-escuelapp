// Reglas del examen teórico oficial (permiso B), según el Anexo VI.B del
// Reglamento General de Conductores (RD 818/2009, BOE-A-2009-9481).
export const EXAM_RULES = {
  B: {
    questionCount: 30,
    optionsPerQuestion: 3,
    minutes: 30,
    maxAllowedFailures: 3,
  },
};

/**
 * Determina si un número de fallos supera el máximo permitido para aprobar.
 * @param {number} failures - Número de respuestas incorrectas o en blanco.
 * @param {keyof typeof EXAM_RULES} licence - Tipo de permiso.
 * @returns {boolean} true si el resultado es APTO.
 */
export function isPassingResult(failures, licence = 'B') {
  const rules = EXAM_RULES[licence];
  if (!rules) {
    throw new Error(`Reglas de examen no definidas para el permiso "${licence}"`);
  }
  return failures <= rules.maxAllowedFailures;
}
