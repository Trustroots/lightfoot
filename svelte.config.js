import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://svelte.dev/docs/kit/integrations
  // for more information about preprocessors
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      fallback: 'index.html',
    }),
    paths: {
      // SvelteKit base path should not have trailing slash
      // For custom domain (CNAME), use empty base path
      // For regular GitHub Pages, use repo name
      // BASE_PATH env var is set in GitHub Actions
      base:
        process.env.BASE_PATH && process.env.BASE_PATH.trim() !== ''
          ? process.env.BASE_PATH.trim().replace(/\/$/, '')
          : '',
    },
    prerender: {
      handleHttpError: ({ path, referrer, message }) => {
        // Ignore 500 errors during prerender - they're likely from client-only code
        if (message.includes('500')) {
          console.warn(`Prerender warning for ${path}: ${message}`);
          return;
        }
        throw new Error(message);
      },
    },
  },
};

export default config;
