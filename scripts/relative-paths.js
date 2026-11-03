// SvelteKit writes the SPA page with root-absolute asset URLs ("/_app/..."), but itch.io
// serves the game from a sub-path, so point them at the page's own folder instead.
import { readFileSync, writeFileSync } from 'node:fs';

const file = 'build/index.html';
const html = readFileSync(file, 'utf8');
const out = html.replaceAll(/(["'(])\/_app\//g, '$1./_app/');
if (out === html) throw new Error(`no /_app/ paths found in ${file}`);
writeFileSync(file, out);
console.log(`Made asset paths relative in ${file}`);
