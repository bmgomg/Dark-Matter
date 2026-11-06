// Makes the boards for the levels too slow to generate while the player waits, and writes src/puzzles.js as each level
// is done (the dev server reloads the page on a write). Each level named is topped up to its count; what's there stays,
// the other levels too. A board that's another one turned or mirrored doesn't count: to the player it's the same puzzle.
// It uses most of the cores, at low priority, and gives up on a level after STALL_MS without a new board.
// Usage: node scripts/make-puzzles.js 4expert=365 5expert=365
import { writeFileSync } from 'node:fs';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { isMainThread, parentPort, Worker, workerData } from 'node:worker_threads';
import { canonical, fits, RULES } from '../src/logic.js';
import { POOL } from '../src/puzzles.js';

const OUT = new URL('../src/puzzles.js', import.meta.url);
const HEAD = '// Made by scripts/make-puzzles.js. Each board is its cells row by row, a digit each (0 = empty, 1-3 = a size).\n';
const STALL_MS = 15 * 60 * 1000;

const grid = (board, N) => {
	const cells = [...board].map(Number);
	return Array.from({ length: N }, (_, i) => cells.slice(i * N, (i + 1) * N));
};

// a worker: boards that fit the level, for as long as it's left to run
const search = (id) => {
	const { p } = RULES[id];
	const N = parseInt(id);

	for (;;) {
		const g = Array.from({ length: N }, () => Array.from({ length: N }, () => (Math.random() < p ? 1 + Math.floor(Math.random() * 3) : 0)));

		if (g.flat().filter(Boolean).length >= N && fits(id, g)) {
			parentPort.postMessage(g.flat().join(''));
		}
	}
};

const pool = { ...POOL };

const save = () => {
	const levels = Object.entries(pool).map(([id, boards]) => `\t'${id}': [\n${boards.map((b) => `\t\t'${b}'`).join(',\n')}\n\t]`);
	writeFileSync(OUT, `${HEAD}export const POOL = {\n${levels.join(',\n')}\n};\n`);
};

const topUp = (id, count) =>
	new Promise((resolve) => {
		const N = parseInt(id);
		const boards = [...(pool[id] ?? [])];
		const seen = new Set(boards.map((b) => canonical(grid(b, N))));
		const t0 = performance.now();
		let last = Date.now();

		const finish = (workers, watch) => {
			clearInterval(watch);
			workers.forEach((w) => w.terminate());
			pool[id] = boards;
			save();
			console.log(`${id}: ${boards.length} of ${count} boards, in ${((performance.now() - t0) / 1000).toFixed(0)} s`);
			resolve();
		};

		if (boards.length >= count) {
			console.log(`${id}: has ${boards.length} already`);
			resolve();
			return;
		}

		const workers = Array.from(
			{ length: Math.max(1, os.cpus().length - 3) },
			() => new Worker(fileURLToPath(import.meta.url), { workerData: id })
		);
		const watch = setInterval(() => {
			if (Date.now() - last > STALL_MS) {
				console.log(`${id}: no new board in ${STALL_MS / 60000} minutes`);
				finish(workers, watch);
			}
		}, 10000);

		for (const worker of workers) {
			worker.on('message', (board) => {
				const name = canonical(grid(board, N));

				if (seen.has(name) || boards.length >= count) {
					return;
				}

				seen.add(name);
				boards.push(board);
				last = Date.now();

				if (boards.length % 25 === 0) {
					console.log(`${id}: ${boards.length} (${((performance.now() - t0) / 1000).toFixed(0)} s)`);
				}

				if (boards.length === count) {
					finish(workers, watch);
				}
			});
		}
	});

if (isMainThread) {
	os.setPriority(os.constants.priority.PRIORITY_BELOW_NORMAL);

	for (const [id, count] of process.argv.slice(2).map((a) => a.split('='))) {
		await topUp(id, +count);
	}

	process.exit();
} else {
	search(workerData);
}
