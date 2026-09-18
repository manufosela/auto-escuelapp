import { describe, expect, it } from 'vitest';
import { findPersonalEmails, findPrivatePaths } from './guard-content.mjs';

describe('findPrivatePaths', () => {
  it('detecta rutas bajo private/', () => {
    expect(findPrivatePaths(['private/libro.md', 'src/index.astro'])).toEqual([
      'private/libro.md',
    ]);
  });

  it('devuelve vacío si no hay rutas privadas', () => {
    expect(findPrivatePaths(['src/index.astro', 'README.md'])).toEqual([]);
  });
});

describe('findPersonalEmails', () => {
  it('detecta un email de gmail', () => {
    expect(findPersonalEmails('contacto: alguien@gmail.com')).toEqual([
      'alguien@gmail.com',
    ]);
  });

  it('detecta un email de tribbuapp.com', () => {
    expect(findPersonalEmails('+autor: persona@tribbuapp.com')).toEqual([
      'persona@tribbuapp.com',
    ]);
  });

  it('no detecta nada en texto sin emails personales', () => {
    expect(findPersonalEmails('contacto: soporte@ejemplo.org')).toEqual([]);
  });

  it('deduplica emails repetidos', () => {
    const text = 'a@gmail.com\nb@gmail.com\na@gmail.com';
    expect(findPersonalEmails(text)).toEqual(['a@gmail.com', 'b@gmail.com']);
  });
});
