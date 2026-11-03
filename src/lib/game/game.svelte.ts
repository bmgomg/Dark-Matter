import { generate, type Difficulty, type Grid, type Size } from './logic';

export const SIDES = ['South', 'East', 'North', 'West'] as const; // side facing you after r clockwise turns
export const NAMES = ['Empty', 'Small', 'Medium', 'Large'] as const;

export type Mark = Size | -1; // -1 = blank, counts as empty
export type Phase = 'loading' | 'play' | 'solved' | 'revealed';

export class Game {
	id = $state(0); // bumps with each new puzzle
	N = $state(4); // requested level; the board on screen is sol.length
	diff = $state<Difficulty>('easy');
	sol = $state<Grid>([]);
	marks = $state<Mark[][]>([]);
	angle = $state(0); // accumulates so the plan always animates the short way round
	turns = $state(0);
	seen = $state([true, false, false, false]);
	brush = $state<Size>(1);
	phase = $state<Phase>('loading');
	wrong = $state<[number, number][]>([]);

	side = $derived(((this.angle / 90) % 4 + 4) % 4);
	sidesSeen = $derived(this.seen.filter(Boolean).length);

	#genToken = 0;

	async newPuzzle(N = this.N, diff = this.diff) {
		const token = ++this.#genToken;
		this.N = N;
		this.diff = diff;
		this.phase = 'loading';
		const sol = await generate(N, diff);
		if (token !== this.#genToken) return;
		this.id++;
		this.sol = sol;
		this.marks = Array.from({ length: N }, () => Array(N).fill(-1));
		this.angle = 0;
		this.turns = 0;
		this.seen = [true, false, false, false];
		this.wrong = [];
		this.phase = 'play';
	}

	paint(i: number, j: number) {
		if (this.phase !== 'play') return;
		this.marks[i][j] = this.marks[i][j] === this.brush ? -1 : this.brush;
		this.wrong = [];
	}

	turn(dir: 1 | -1) {
		if (this.phase === 'loading') return;
		this.angle += dir * 90;
		this.turns++;
		this.seen[this.side] = true;
	}

	done() {
		if (this.phase !== 'play') return;
		const wrong: [number, number][] = [];
		for (let i = 0; i < this.N; i++)
			for (let j = 0; j < this.N; j++)
				if (Math.max(0, this.marks[i][j]) !== this.sol[i][j]) wrong.push([i, j]);
		this.wrong = wrong;
		if (!wrong.length) this.phase = 'solved';
	}

	reveal() {
		if (this.phase === 'play') this.phase = 'revealed';
	}

	isWrong(i: number, j: number) {
		return this.wrong.some(([a, b]) => a === i && b === j);
	}
}
