import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter(),
		paths: {
			// SvelteKit base path should not have trailing slash
			// BASE_PATH env var is set in GitHub Actions, fallback to /lightfoot in production
			base: process.env.BASE_PATH 
				? process.env.BASE_PATH.replace(/\/$/, '') 
				: (process.env.NODE_ENV === 'production' ? '/lightfoot' : '')
		}
	}
};

export default config;
