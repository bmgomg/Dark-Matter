import { describe, expect, it } from 'vitest';
import { LEVELS } from './const';
import { canonical, dailyPuzzle, dateOf, dayOf, depth, elevation, fits, generate, mask, money, needsAllSides, rotated, seeded, shareCard } from './logic';
import { POOL } from './puzzles';

describe('views', () => {
	it('a sphere hides its size or smaller, but not bigger', () => {
		expect(mask([2, 1, 2, 3])).toBe((1 << 2) | (1 << 3));
		expect(mask([0, 0, 0, 0])).toBe(0);
	});

	it('elevation reads lanes front (bottom row) to back', () => {
		const g = [
			[3, 0],
			[1, 0]
		];
		expect(elevation(g, 0)).toEqual([[1, 3], []]);
		// one clockwise turn brings the East side to the front
		expect(rotated(g, 1)).toEqual([
			[1, 3],
			[0, 0]
		]);
		expect(elevation(g, 1)).toEqual([[1], [3]]);
	});
});

describe('generator', () => {
	for (const N of [4, 5])
		for (const diff of ['easy', 'hard', 'expert'])
			it(`${N}×${N} ${diff} boards match their level`, async () => {
				for (let k = 0; k < 5; k++) {
					const g = await generate(N, diff);
					const n = g.flat().filter(Boolean).length;
					expect(g).toHaveLength(N);
					expect(n).toBeGreaterThanOrEqual(N);
					expect(fits(N + diff, g)).toBe(true);
				}
			});

	it('every ready-made board matches its level', () => {
		for (const [id, boards] of Object.entries(POOL)) {
			const N = parseInt(id);

			for (const b of boards) {
				const cells = [...b].map(Number);
				expect(fits(id, Array.from({ length: N }, (_, i) => cells.slice(i * N, (i + 1) * N)))).toBe(true);
			}
		}
	}, 60000);

	it('no ready-made board is another turned or mirrored', () => {
		for (const [id, boards] of Object.entries(POOL)) {
			const N = parseInt(id);
			const names = boards.map((b) => {
				const cells = [...b].map(Number);
				return canonical(Array.from({ length: N }, (_, i) => cells.slice(i * N, (i + 1) * N)));
			});

			expect(new Set(names).size).toBe(boards.length);
		}
	});

	it('turning or mirroring a board leaves its grade alone', () => {
		const g = [
			[0, 2, 0, 3],
			[1, 0, 0, 0],
			[0, 0, 3, 0],
			[2, 0, 0, 1]
		];

		for (const h of [rotated(g, 1), rotated(g, 2), g.map((r) => [...r].reverse())]) {
			expect(depth(h)).toBe(depth(g));
			expect(needsAllSides(h)).toBe(needsAllSides(g));
		}
	});
});

describe('daily', () => {
	it('a date is the local one, and comes back as itself', () => {
		expect(dayOf(new Date(2026, 0, 9, 23, 59))).toBe('2026-01-09');
		expect(dayOf(dateOf('2026-11-05'))).toBe('2026-11-05');
	});

	it('seeded numbers repeat, and differ from one seed to the next', () => {
		const a = seeded('2026-11-05');
		const b = seeded('2026-11-05');
		const c = seeded('2026-11-06');
		const first = [a(), a(), a()];

		expect([b(), b(), b()]).toEqual(first);
		expect([c(), c(), c()]).not.toEqual(first);
		expect(first.every((v) => v >= 0 && v < 1)).toBe(true);
	});

	it('each level has one board a day, that fits it', async () => {
		const boards = new Set();

		for (const { id, N, diff } of LEVELS) {
			for (const day of ['2026-11-05', '2026-11-06']) {
				const g = await dailyPuzzle(day, N, diff);

				expect(await dailyPuzzle(day, N, diff)).toEqual(g);
				expect(fits(id, g)).toBe(true);
				boards.add(g.flat().join(''));
			}
		}

		expect(boards.size).toBe(2 * LEVELS.length);
	});

	it('a ready-made board comes back only after the whole pool, in a new orientation', async () => {
		for (const { id, N, diff } of LEVELS.filter((l) => POOL[l.id])) {
			const pool = POOL[id].length;
			const next = (k) => dayOf(new Date(2026, 10, 5 + k));
			const asDealt = new Set();
			const anyOrientation = new Set();

			for (let k = 0; k < 8 * pool; k++) {
				const g = await dailyPuzzle(next(k), N, diff);

				asDealt.add(g.flat().join(''));

				if (k < pool) {
					anyOrientation.add(canonical(g));
				}
			}

			expect(anyOrientation.size).toBe(pool);
			expect(asDealt.size).toBe(8 * pool);
		}
	});

	// A failure here means the generator has changed, and with it the puzzle of every day to come: a player who starts a
	// day's game after the change gets a different board from one who started before it.
	it('a day keeps its board across browsers and releases', async () => {
		expect((await dailyPuzzle('2026-11-02', 4, 'easy')).flat().join('')).toBe('0010033002000000');
	});
});

describe('the share card', () => {
	const game = (over, turns, changes) => ({ over, turns, changes });

	it('lists each finished game, a win with its score and what it cost', () => {
		const card = shareCard('Friday, November 6', [
			{ label: '4×4', sub: 'easy', game: game('won', 3, 1) },
			{ label: '4×4', sub: 'not easy', game: game('revealed', 3, 0) },
			{ label: '5×5', sub: 'quite hard', game: game('won', 12, 2) }
		]);

		expect(card.split('\n')).toEqual([
			'Dark Matter of Perspective',
			'Friday, November 6',
			'',
			'4×4 Easy: $6 · 3 turns · 1 second guess',
			'4×4 Not Easy: gave up',
			'5×5 Quite Hard: −$4 · 12 turns · 2 second guesses',
			'',
			'https://beautiful-mind-games.itch.io/dark-matter-of-perspective'
		]);
	});

	it('counts in the singular and the plural', () => {
		expect(shareCard('', [{ label: '4×4', sub: 'easy', game: game('won', 1, 0) }])).toContain('$9 · 1 turn · 0 second guesses');
	});

	it('reads a score as the player does', () => {
		expect([money(0), money(6), money(-4)]).toEqual(['$0', '$6', '−$4']);
	});
});
