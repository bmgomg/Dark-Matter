// Makes the boards for the levels too slow to generate while the player waits, and writes src/puzzles.js after each
// level (the dev server reloads the page on a write). Usage: node scripts/make-puzzles.js 4expert=60 5expert=30
import { writeFileSync } from 'node:fs';
import { fits, RULES } from '../src/logic.js';

const OUT = new URL('../src/puzzles.js', import.meta.url);
const HEAD = '// Made by scripts/make-puzzles.js. Each board is its cells row by row, a digit each (0 = empty, 1-3 = a size).\n';

const pool = {};

const save = () => {
	const levels = Object.entries(pool).map(([id, boards]) => `\t'${id}': [\n${boards.map((b) => `\t\t'${b}'`).join(',\n')}\n\t]`);
	writeFileSync(OUT, `${HEAD}export const POOL = {\n${levels.join(',\n')}\n};\n`);
};

for (const [id, count] of process.argv.slice(2).map((a) => a.split('='))) {
	const { p } = RULES[id];
	const N = parseInt(id);
	const found = new Set();
	const t0 = performance.now();

	while (found.size < +count) {
		const g = Array.from({ length: N }, () => Array.from({ length: N }, () => (Math.random() < p ? 1 + Math.floor(Math.random() * 3) : 0)));

		if (g.flat().filter(Boolean).length >= N && fits(id, g)) {
			found.add(g.flat().join(''));
		}
	}

	pool[id] = [...found];
	save();
	console.log(`${id}: ${found.size} boards in ${((performance.now() - t0) / 1000).toFixed(0)} s`);
}
