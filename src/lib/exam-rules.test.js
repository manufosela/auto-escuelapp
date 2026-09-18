import { describe, expect, it } from 'vitest';
import { isPassingResult } from './exam-rules.js';

describe('isPassingResult', () => {
  it('aprueba con 0 fallos', () => {
    expect(isPassingResult(0)).toBe(true);
  });

  it('aprueba con el máximo de 3 fallos permitido en el permiso B', () => {
    expect(isPassingResult(3)).toBe(true);
  });

  it('suspende con 4 fallos', () => {
    expect(isPassingResult(4)).toBe(false);
  });

  it('lanza un error si el permiso no tiene reglas definidas', () => {
    expect(() => isPassingResult(0, 'X')).toThrow(/permiso/);
  });
});
