import { getViteConfig } from 'astro/config';

// getViteConfig permite renderizar componentes .astro en tests (Container API).
export default getViteConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.js', 'scripts/**/*.test.mjs'],
  },
});
