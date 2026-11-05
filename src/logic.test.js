import { describe, expect, it } from 'vitest';
import { depth, elevation, fits, generate, mask, needsAllSides, rotated } from './logic';
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
