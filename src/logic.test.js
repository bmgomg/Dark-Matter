import { describe, expect, it } from 'vitest';
import { elevation, generate, mask, RULES, rotated, tierOf } from './logic';

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
		for (const diff of ['easy', 'hard'])
			it(`${N}×${N} ${diff} boards match their level`, async () => {
				for (let k = 0; k < 5; k++) {
					const g = await generate(N, diff);
					const n = g.flat().filter(Boolean).length;
					expect(g).toHaveLength(N);
					expect(n).toBeGreaterThanOrEqual(N);
					expect(RULES[N + diff].ok(tierOf(g), n)).toBe(true);
				}
			});
});
