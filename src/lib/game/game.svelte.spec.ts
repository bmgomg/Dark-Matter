import { describe, expect, it } from 'vitest';
import { Game } from './game.svelte';

describe('Game', () => {
	it('turning tracks the side, turns and sides seen', async () => {
		const g = new Game();
		await g.newPuzzle(4, 'easy');
		g.turn(-1);
		expect(g.side).toBe(3); // West
		g.turn(1);
		g.turn(1);
		expect(g.side).toBe(1); // East
		expect(g.turns).toBe(3);
		expect(g.sidesSeen).toBe(3);
	});

	it('tapping with the same brush clears the cell', async () => {
		const g = new Game();
		await g.newPuzzle(4, 'easy');
		g.brush = 2;
		g.paint(0, 0);
		expect(g.marks[0][0]).toBe(2);
		g.paint(0, 0);
		expect(g.marks[0][0]).toBe(-1);
	});

	it('Done outlines wrong cells, and a correct map solves', async () => {
		const g = new Game();
		await g.newPuzzle(5, 'hard');
		g.done();
		expect(g.phase).toBe('play');
		expect(g.wrong.length).toBe(g.sol.flat().filter(Boolean).length); // blanks count as empty

		for (let i = 0; i < 5; i++)
			for (let j = 0; j < 5; j++) {
				const v = g.sol[i][j];
				if (v) {
					g.brush = v;
					g.paint(i, j);
				}
			}
		expect(g.wrong).toEqual([]);
		g.done();
		expect(g.phase).toBe('solved');
	});

	it('Show solution locks the map', async () => {
		const g = new Game();
		await g.newPuzzle(4, 'hard');
		g.reveal();
		expect(g.phase).toBe('revealed');
		g.paint(0, 0);
		expect(g.marks[0][0]).toBe(-1);
	});
});
