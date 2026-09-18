import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    ignores: ['dist/', '.astro/', 'private/'],
  },
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2025,
      sourceType: 'module',
    },
    rules: {
      'no-var': 'error',
      'prefer-const': 'error',
      eqeqeq: 'error',
    },
  },
];
