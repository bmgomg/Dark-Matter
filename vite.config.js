import { readFileSync } from 'node:fs';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

// In dev, the pages in scripts/ at /scripts/<name>.html, such as the sound effects' audition page (sfx.html), so that
// they can import the game's modules from src/. SvelteKit would answer them with a 404.
const scriptPages = {
	name: 'script-pages',
	configureServer(server) {
		server.middlewares.use((req, res, next) => {
			const page = req.url.match(/^\/scripts\/([\w-]+\.html)$/)?.[1];

			if (!page) {
				return next();
			}

			try {
				const html = readFileSync(`scripts/${page}`);
				res.setHeader('Content-Type', 'text/html; charset=utf-8');
				res.end(html);
			} catch {
				next();
			}
		});
	}
};

export default defineConfig({
	plugins: [scriptPages, sveltekit()],
	server: { port: 1119, strictPort: true },
	test: { include: ['src/**/*.test.js'], environment: 'node' }
});
