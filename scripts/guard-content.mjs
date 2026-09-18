#!/usr/bin/env node
// Guard de pre-commit: bloquea contenido derivado de fuentes con copyright
// (private/) y emails personales en el diff staged. Ver docs/SOURCES.md.
import { execFileSync } from 'node:child_process';

const PRIVATE_PATH_PREFIX = 'private/';
const PERSONAL_EMAIL_PATTERN = /[A-Za-z0-9._%+-]+@(gmail|tribbuapp)\.com/gi;

/**
 * @param {string[]} stagedPaths
 * @returns {string[]} rutas staged que caen bajo private/
 */
export function findPrivatePaths(stagedPaths) {
  return stagedPaths.filter((path) => path.startsWith(PRIVATE_PATH_PREFIX));
}

/**
 * @param {string} text
 * @returns {string[]} emails personales únicos encontrados en el texto
 */
export function findPersonalEmails(text) {
  return [...new Set(text.match(PERSONAL_EMAIL_PATTERN) ?? [])];
}

function getStagedPaths() {
  const output = execFileSync(
    'git',
    ['diff', '--cached', '--name-only', '--diff-filter=ACM'],
    { encoding: 'utf8' },
  );
  return output.split('\n').filter(Boolean);
}

// El propio guard y su test contienen emails de ejemplo a propósito
// (fixtures), así que quedan excluidos del escaneo de su propio diff.
const SELF_EXCLUDED_PATHS = [
  'scripts/guard-content.mjs',
  'scripts/guard-content.test.mjs',
];

function getStagedAddedLines() {
  const output = execFileSync(
    'git',
    [
      'diff',
      '--cached',
      '-U0',
      '--',
      '.',
      ...SELF_EXCLUDED_PATHS.map((path) => `:(exclude)${path}`),
    ],
    { encoding: 'utf8' },
  );
  return output
    .split('\n')
    .filter((line) => line.startsWith('+') && !line.startsWith('+++'))
    .join('\n');
}

function main() {
  const privatePaths = findPrivatePaths(getStagedPaths());
  if (privatePaths.length > 0) {
    console.error('guard-content: no se puede commitear contenido bajo private/:');
    for (const path of privatePaths) console.error(`  - ${path}`);
    process.exit(1);
  }

  const emails = findPersonalEmails(getStagedAddedLines());
  if (emails.length > 0) {
    console.error('guard-content: email personal detectado en el diff staged:');
    for (const email of emails) console.error(`  - ${email}`);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
